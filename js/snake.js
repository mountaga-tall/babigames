
const canvas = document.getElementById('snake-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('snake-score');
const highScoreEl = document.getElementById('snake-highscore');

// Responsive Canvas
let gridSize = 20;
let tileCount = 20;
canvas.width = 400; canvas.height = 400;
if (window.innerWidth < 450) { canvas.width = 300; canvas.height = 300; gridSize = 15; }

let snake = [];
let apple = {};
let dx = 0; let dy = -1;
let score = 0;
let highScore = localStorage.getItem('snake-highscore') || 0;
highScoreEl.innerText = highScore;
let gameLoop;
let isPlaying = false;

function initSnake() {
    snake = [{ x: 10, y: 10 }];
    score = 0; scoreEl.innerText = score;
    dx = 0; dy = -1;
    placeApple();
    if(gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, 100);
    isPlaying = true;
}

function placeApple() {
    apple = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) };
}

function update() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    
    // Wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) return gameOver();
    // Self collision
    for (let s of snake) if (head.x === s.x && head.y === s.y) return gameOver();

    snake.unshift(head);

    // Eat Apple
    if (head.x === apple.x && head.y === apple.y) {
        if(navigator.vibrate) navigator.vibrate([20, 30, 20]); // Ripple haptic
        score += 10;
        scoreEl.innerText = score;
        placeApple();
    } else {
        snake.pop();
    }
    draw();
}

function draw() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apple (Neon effect)
    ctx.shadowBlur = 15; ctx.shadowColor = "#ff4757"; ctx.fillStyle = '#ff4757';
    ctx.fillRect(apple.x * gridSize, apple.y * gridSize, gridSize - 2, gridSize - 2);

    // Snake
    ctx.shadowBlur = 10; ctx.shadowColor = "#00f2fe"; ctx.fillStyle = '#00f2fe';
    snake.forEach((s, i) => {
        if(i === 0) ctx.fillStyle = '#4facfe'; // Head lighter
        else ctx.fillStyle = '#00f2fe';
        ctx.fillRect(s.x * gridSize, s.y * gridSize, gridSize - 2, gridSize - 2);
    });
    ctx.shadowBlur = 0;
}

function gameOver() {
    clearInterval(gameLoop);
    if(navigator.vibrate) navigator.vibrate(200); // Crash haptic
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snake-highscore', highScore);
        highScoreEl.innerText = highScore;
    }
    setTimeout(initSnake, 1500); // Restart auto
}

// Controls (Keyboard)
document.addEventListener('keydown', e => {
    if(!isPlaying) return;
    if (e.key === 'ArrowUp' && dy === 0) { dx = 0; dy = -1; }
    if (e.key === 'ArrowDown' && dy === 0) { dx = 0; dy = 1; }
    if (e.key === 'ArrowLeft' && dx === 0) { dx = -1; dy = 0; }
    if (e.key === 'ArrowRight' && dx === 0) { dx = 1; dy = 0; }
});

// Controls (Swipe / Touch)
let touchStartX = 0; let touchStartY = 0;
canvas.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; touchStartY = e.changedTouches[0].screenY; }, {passive: true});
canvas.addEventListener('touchend', e => {
    if(!isPlaying) return;
    let touchEndX = e.changedTouches[0].screenX; let touchEndY = e.changedTouches[0].screenY;
    let deltaX = touchEndX - touchStartX; let deltaY = touchEndY - touchStartY;
    if (Math.abs(deltaX) > Math.abs(deltaY)) { // Horizontal swipe
        if (deltaX > 30 && dx === 0) { dx = 1; dy = 0; }
        else if (deltaX < -30 && dx === 0) { dx = -1; dy = 0; }
    } else { // Vertical swipe
        if (deltaY > 30 && dy === 0) { dx = 0; dy = 1; }
        else if (deltaY < -30 && dy === 0) { dx = 0; dy = -1; }
    }
}, {passive: true});

// Listeners for view changes
document.addEventListener('start-snake', () => { initSnake(); });
document.addEventListener('stop-snake', () => { clearInterval(gameLoop); isPlaying = false; });
