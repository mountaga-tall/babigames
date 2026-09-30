(() => {
  const cfg = window.BABIGAMES_CONFIG || {};
  const authButton = document.getElementById('auth-btn');
  const modal = document.getElementById('auth-modal');
  const form = document.getElementById('auth-form');
  const title = document.getElementById('auth-title');
  const usernameWrap = document.getElementById('auth-username-wrap');
  const usernameInput = document.getElementById('auth-username');
  const emailInput = document.getElementById('auth-email');
  const passwordInput = document.getElementById('auth-password');
  const submitButton = document.getElementById('auth-submit');
  const modeButton = document.getElementById('auth-mode');
  const closeButton = document.getElementById('auth-close');
  const statusEl = document.getElementById('auth-status');
  let client = null;
  let signUpMode = false;
  let currentUser = null;
  let profile = null;

  const games = ['snake','minesweeper','chess','checkers','connect4','2048','memory','tetris'];

  function configured() {
    return Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey);
  }

  function setStatus(message, error = false) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.toggle('error', error);
  }

  function openModal(signUp = false) {
    if (!modal) return;
    signUpMode = signUp;
    title.textContent = signUpMode ? 'Créer un compte' : 'Connexion';
    usernameWrap.classList.toggle('hidden', !signUpMode);
    modeButton.textContent = signUpMode ? 'J’ai déjà un compte' : 'Créer un compte';
    submitButton.textContent = signUpMode ? 'Créer mon compte' : 'Se connecter';
    setStatus(configured() ? '' : 'Configure Supabase dans js/config.js pour activer les comptes.');
    modal.classList.remove('hidden');
    (signUpMode ? usernameInput : emailInput)?.focus();
  }

  function closeModal() {
    modal?.classList.add('hidden');
    form?.reset();
    setStatus('');
  }

  async function loadLibrary() {
    if (window.supabase?.createClient) return true;
    if (!navigator.onLine) return false;
    return new Promise(resolve => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      script.onload = () => resolve(Boolean(window.supabase?.createClient));
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }

  async function init() {
    authButton?.addEventListener('click', () => {
      if (currentUser) signOut();
      else openModal(false);
    });
    closeButton?.addEventListener('click', closeModal);
    modal?.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    modeButton?.addEventListener('click', () => openModal(!signUpMode));

    authButton?.classList.remove('hidden');
    if (!configured()) {
      authButton.textContent = 'Connexion';
      return;
    }

    const loaded = await loadLibrary();
    if (!loaded) {
      authButton.textContent = 'Invité';
      return;
    }

    client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    const sessionResult = await client.auth.getSession();
    await handleSession(sessionResult.data?.session || null);

    client.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });
    form?.addEventListener('submit', handleSubmit);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!client) return;

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const username = usernameInput.value.trim();

    if (!email || password.length < 8 || (signUpMode && username.length < 3)) {
      setStatus(
        signUpMode
          ? 'Pseudo ≥ 3 caractères et mot de passe ≥ 8 caractères.'
          : 'Email valide et mot de passe ≥ 8 caractères.',
        true
      );
      return;
    }

    submitButton.disabled = true;
    setStatus(signUpMode ? 'Création du compte…' : 'Connexion…');

    try {
      if (signUpMode) {
        const result = await client.auth.signUp({
          email,
          password,
          options: { data: { username } }
        });
        if (result.error) throw result.error;
        if (!result.data.session) {
          setStatus('Compte créé. Vérifie ton email puis connecte-toi.');
        } else {
          closeModal();
        }
      } else {
        const result = await client.auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
        closeModal();
      }
    } catch (error) {
      setStatus(error?.message || 'Une erreur est survenue.', true);
    } finally {
      submitButton.disabled = false;
    }
  }

  async function handleSession(session) {
    currentUser = session?.user || null;
    profile = null;
    if (currentUser) {
      profile = await ensureProfile();
      updateHeader();
      await syncLocalScores();
      Babi.toast('Bienvenue' + (profile?.username ? ' ' + profile.username : '') + ' 👋');
      document.dispatchEvent(new CustomEvent('babi-auth-ready', {
        detail: { user: currentUser, profile }
      }));
    } else {
      updateHeader();
      document.dispatchEvent(new CustomEvent('babi-auth-ready', {
        detail: { user: null, profile: null }
      }));
    }
  }

  async function ensureProfile() {
    const username = String(
      currentUser.user_metadata?.username ||
      currentUser.email?.split('@')[0] ||
      'Joueur'
    ).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24) || 'Joueur';

    const result = await client
      .from('profiles')
      .upsert({ id: currentUser.id, username }, { onConflict: 'id' })
      .select('id, username')
      .single();

    return result.error ? { id: currentUser.id, username } : result.data;
  }

  function updateHeader() {
    if (!authButton) return;
    authButton.classList.remove('hidden');
    if (currentUser) {
      authButton.textContent = profile?.username ? '👤 ' + profile.username : '👤 Compte';
      authButton.title = 'Se déconnecter';
    } else {
      authButton.textContent = 'Connexion';
      authButton.title = 'Se connecter';
    }
  }

  async function syncLocalScores() {
    if (!client || !currentUser) return;

    const result = await client
      .from('scores')
      .select('game,best_score')
      .eq('user_id', currentUser.id);

    if (result.error) return;

    const serverScores = Object.fromEntries(
      (result.data || []).map(row => [row.game, Number(row.best_score) || 0])
    );

    for (const game of games) {
      const local = Number(localStorage.getItem(Babi.scoreKey(game)) || 0) || 0;
      const server = serverScores[game] || 0;
      const best = Math.max(local, server);

      if (best > local) {
        try { localStorage.setItem(Babi.scoreKey(game), String(best)); } catch (_) {}
      }
      if (best > server) await saveBest(game, best);
    }
  }

  async function saveBest(game, score) {
    if (!client || !currentUser || !games.includes(game)) return;
    const safeScore = Math.max(0, Math.floor(Number(score) || 0));
    if (!safeScore) return;

    const existingResult = await client
      .from('scores')
      .select('best_score')
      .eq('user_id', currentUser.id)
      .eq('game', game)
      .maybeSingle();

    const existing = Number(existingResult.data?.best_score) || 0;
    if (safeScore <= existing) return;

    await client.from('scores').upsert({
      user_id: currentUser.id,
      game,
      best_score: safeScore,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,game' });
  }

  async function signOut() {
    if (!client) return;
    const result = await client.auth.signOut();
    if (result.error) {
      Babi.toast('Déconnexion impossible');
      return;
    }
    Babi.toast('Déconnecté');
  }

  window.BabiAuth = {
    get user() { return currentUser; },
    get profile() { return profile; },
    get configured() { return configured(); },
    open: openModal,
    signOut,
    saveBest
  };

  init();
})();
