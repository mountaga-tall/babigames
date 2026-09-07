
// --- Haptic Feedback (Vibration) ---
const vibrate = (ms = 50) => {
    if (navigator.vibrate) navigator.vibrate(ms);
};

// --- Navigation ---
const views = document.querySelectorAll('.view');
const backBtn = document.getElementById('back-btn');
let currentGame = null;

document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
        vibrate();
        const game = card.dataset.game;
        openGame(game);
    });
});

backBtn.addEventListener('click', () => {
    vibrate(30);
    closeGame();
});

function openGame(gameId) {
    views.forEach(v => v.classList.remove('active'));
    views.forEach(v => v.classList.add('hidden'));
    
    document.getElementById(gameId + '-view').classList.remove('hidden');
    document.getElementById(gameId + '-view').classList.add('active');
    
    backBtn.classList.remove('hidden');
    currentGame = gameId;

    // Dispatch custom event to init game
    document.dispatchEvent(new CustomEvent(`start-${gameId}`));
}

function closeGame() {
    views.forEach(v => v.classList.remove('active'));
    views.forEach(v => v.classList.add('hidden'));
    
    document.getElementById('menu').classList.remove('hidden');
    document.getElementById('menu').classList.add('active');
    
    backBtn.classList.add('hidden');
    
    if(currentGame) {
        document.dispatchEvent(new CustomEvent(`stop-${currentGame}`));
        currentGame = null;
    }
}

// --- PWA Installation ---
let deferredPrompt;
const installBtn = document.getElementById('install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.classList.remove('hidden');
});

installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            installBtn.classList.add('hidden');
        }
        deferredPrompt = null;
    }
});

// --- Service Worker Registration ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            console.log('Service Worker enregistré', reg);
        }).catch(err => {
            console.log('Erreur SW', err);
        });
    });
}
