(() => {
  const views = [...document.querySelectorAll('.view')];
  const backBtn = document.getElementById('back-btn');
  const homeBtn = document.getElementById('home-btn');
  const installBtn = document.getElementById('install-btn');
  const overlay = document.getElementById('win-overlay');
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let currentGame = null;
  let deferredPrompt = null;
  let toastTimer = null;
  let lastFocused = null;
  const gameLabels = {
    snake: 'Snake', minesweeper: 'Démineur', chess: 'Échecs', checkers: 'Dames',
    connect4: 'Puissance 4', '2048': '2048', memory: 'Memory', tetris: 'Tetris'
  };

  const safeVibrate = pattern => {
    if (reducedMotion) return;
    try { navigator.vibrate?.(pattern); } catch (_) {}
  };

  const Babi = {
    vibrate: safeVibrate,
    reducedMotion,
    toast(message) {
      const el = document.getElementById('toast');
      if (!el) return;
      el.textContent = message;
      el.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => el.classList.remove('show'), 1900);
    },
    scoreKey(game) { return `babigames-best-${game}`; },
    getBest(game) {
      try { return Number(localStorage.getItem(this.scoreKey(game)) || 0) || 0; } catch (_) { return 0; }
    },
    setBest(game, score) {
      const safeScore = Math.max(0, Number(score) || 0);
      const best = this.getBest(game);
      if (safeScore > best) {
        try { localStorage.setItem(this.scoreKey(game), String(safeScore)); } catch (_) {}
        window.BabiAuth?.saveBest?.(game, safeScore);
        return safeScore;
      }
      return best;
    },
    win(game, title, text, emoji = '🏆') {
      safeVibrate([30, 55, 30]);
      this.wow();
      const ov = document.getElementById('win-overlay');
      if (!ov) return;
      document.getElementById('win-emoji').textContent = emoji;
      document.getElementById('win-title').textContent = title;
      document.getElementById('win-text').textContent = text;
      ov.dataset.game = game;
      ov.classList.remove('hidden');
      lastFocused = document.activeElement;
      document.getElementById('win-replay')?.focus({ preventScroll: true });
    },
    hideWin() {
      overlay?.classList.add('hidden');
      overlay?.removeAttribute('data-game');
      if (lastFocused && document.contains(lastFocused)) lastFocused.focus({ preventScroll: true });
    },
    wow() {
      if (reducedMotion) return;
      const n = 30;
      const frag = document.createDocumentFragment();
      const sparks = [];
      for (let i = 0; i < n; i++) {
        const p = document.createElement('span');
        p.className = 'wow-spark';
        const angle = (Math.PI * 2 * i) / n;
        const distance = 90 + Math.random() * 190;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;
        p.style.setProperty('--dx', `${dx}px`);
        p.style.setProperty('--dy', `${dy}px`);
        p.style.setProperty('--delay', `${Math.random() * 70}ms`);
        p.style.setProperty('--hue', `${175 + Math.round(Math.random() * 85)}`);
        frag.appendChild(p);
        sparks.push(p);
      }
      document.body.appendChild(frag);
      sparks.forEach(p => {
        const animation = p.animate([
          { transform: 'translate(-50%, -50%) scale(.35)', opacity: 1 },
          { transform: 'translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0)', opacity: 0 }
        ], { duration: 720 + Math.random() * 240, delay: Math.random() * 80, easing: 'cubic-bezier(.18,.8,.22,1)' });
        animation.finished.then(() => p.remove()).catch(() => p.remove());
      });
    }
  };
  window.Babi = Babi;

  function announceView(view, game) {
    views.forEach(v => v.setAttribute('aria-hidden', v !== view ? 'true' : 'false'));
    document.title = game ? `BabiGames — ${gameLabels[game] || game}` : 'BabiGames — 8 jeux';
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  }

  function showGame(game) {
    Babi.hideWin();
    const view = document.getElementById(`${game}-view`);
    if (!view) return;
    if (currentGame && currentGame !== game) document.dispatchEvent(new CustomEvent(`stop-${currentGame}`));
    views.forEach(v => v.classList.add('hidden'));
    view.classList.remove('hidden');
    view.classList.remove('view-enter');
    void view.offsetWidth;
    view.classList.add('view-enter');
    currentGame = game;
    backBtn.classList.remove('hidden');
    announceView(view, game);
    document.dispatchEvent(new CustomEvent(`start-${game}`));
  }

  function showMenu() {
    if (currentGame) document.dispatchEvent(new CustomEvent(`stop-${currentGame}`));
    Babi.hideWin();
    views.forEach(v => { v.classList.add('hidden'); v.setAttribute('aria-hidden', 'true'); });
    const menu = document.getElementById('menu');
    menu.classList.remove('hidden');
    menu.setAttribute('aria-hidden', 'false');
    backBtn.classList.add('hidden');
    currentGame = null;
    announceView(menu, null);
  }

  document.querySelectorAll('.game-card[data-game]').forEach(btn => {
    btn.addEventListener('click', () => { safeVibrate(18); showGame(btn.dataset.game); });
    btn.addEventListener('pointermove', e => {
      if (reducedMotion || e.pointerType === 'touch') return;
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
      btn.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
    });
    btn.addEventListener('pointerleave', () => {
      btn.style.removeProperty('--mx'); btn.style.removeProperty('--my');
    });
  });

  backBtn.addEventListener('click', () => { safeVibrate(18); showMenu(); });
  homeBtn.addEventListener('click', showMenu);
  document.getElementById('win-menu')?.addEventListener('click', showMenu);
  document.getElementById('win-replay')?.addEventListener('click', () => {
    const game = overlay?.dataset.game;
    if (game) showGame(game);
  });

  document.querySelectorAll('.level-switch').forEach(sw => sw.addEventListener('click', e => {
    const button = e.target.closest('button[data-level]');
    if (!button) return;
    sw.querySelectorAll('button').forEach(x => x.classList.toggle('selected', x === button));
    document.dispatchEvent(new CustomEvent(`set-level-${sw.dataset.game}`, { detail: { level: button.dataset.level } }));
  }));

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferredPrompt = e; installBtn.classList.remove('hidden');
  });
  installBtn?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try { await deferredPrompt.userChoice; } catch (_) {}
    deferredPrompt = null;
    installBtn.classList.add('hidden');
  });
  window.addEventListener('appinstalled', () => installBtn?.classList.add('hidden'));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (overlay && !overlay.classList.contains('hidden')) Babi.hideWin();
      else if (currentGame) showMenu();
    }
  });

  overlay?.addEventListener('click', e => {
    if (e.target === overlay) Babi.hideWin();
  });
  overlay?.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const focusables = [...overlay.querySelectorAll('button:not([disabled])')];
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  document.addEventListener('click', e => {
    const button = e.target.closest('button');
    if (!button || reducedMotion || button.closest('#win-overlay')) return;
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.left = `${e.clientX ? e.clientX - rect.left : rect.width / 2}px`;
    ripple.style.top = `${e.clientY ? e.clientY - rect.top : rect.height / 2}px`;
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 480);
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }

  announceView(document.getElementById('menu'), null);
})();
