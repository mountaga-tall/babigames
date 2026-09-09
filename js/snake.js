const canvas = document.getElementById('snake-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('snake-score');
const highScoreEl = document.getElementById('snake-highscore');

let gridSize = 20; let tileCount = 20;
canvas.width = 400; canvas.height = 400;
if (window.innerWidth < 450) { canvas.width = 300; canvas.height = 300; gridSize = 15; }

let snake = []; let apple = {}; let particles = [];
let dx = 0; let dy = -1; let score = 0;
let highScore = localStorage.getItem('snake-highscore') || 0;
highScoreEl.innerText = highScore;
let gameLoop; let isPlaying = false;

function initSnake() {
    snake = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }]; // Vrai serpent long
    score = 0; scoreEl.innerText = score; dx = 0; dy = -1; particles = [];
    placeApple();
    if(gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, 100);
    isPlaying = true;
}

function placeApple() { apple = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) }; }

function update() {
    // Traverse l'écran (Wow Effect - Infini)
    let newX = (snake[0].x + dx + tileCount) % tileCount;
    let newY = (snake[0].y + dy + tileCount) % tileCount;
    const head = { x: newX, y: newY };
    
    // Collision avec lui-même
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) return gameOver();
    }
    snake.unshift(head);

    if (head.x === apple.x && head.y === apple.y) {
        if(navigator.vibrate) navigator.vibrate([20, 30, 20]);
        score += 10; scoreEl.innerText = score;
        for(let i = 0; i < 10; i++) {
            particles.push({ x: apple.x*gridSize+gridSize/2, y: apple.y*gridSize+gridSize/2, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8, life: 1, color: '#f1c40f' });
        }
        placeApple();
    } else {
        snake.pop();
    }
    draw();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Souris 🐁
    ctx.font = (gridSize * 0.9) + "px Arial";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText('🐁', apple.x * gridSize + gridSize/2, apple.y * gridSize + gridSize/2);

    // Vrai serpent vert (organique)
    ctx.shadowBlur = 10; ctx.shadowColor = "#2ecc71";
    snake.forEach((s, i) => {
        ctx.fillStyle = i === 0 ? '#1abc9c' : '#2ecc71'; 
        ctx.beginPath();
        ctx.arc(s.x * gridSize + gridSize/2, s.y * gridSize + gridSize/2, gridSize/2.2, 0, Math.PI * 2);
        ctx.fill();
        // Yeux sur la tête
        if(i === 0) {
            ctx.fillStyle = "black";
            ctx.beginPath(); ctx.arc(s.x * gridSize + gridSize/3, s.y * gridSize + gridSize/3, 2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(s.x * gridSize + gridSize/1.5, s.y * gridSize + gridSize/3, 2, 0, Math.PI * 2); ctx.fill();
        }
    });
    ctx.shadowBlur = 0;

    particles.forEach((p, index) => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.05;
        ctx.fillStyle = `rgba(241, 196, 15, ${p.life})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill();
        if(p.life <= 0) particles.splice(index, 1);
    });
}

function gameOver() {
    clearInterval(gameLoop);
    if(navigator.vibrate) navigator.vibrate(200);
    canvas.style.transform = "translate(10px, 10px)";
    setTimeout(() => canvas.style.transform = "translate(-10px, -10px)", 50);
    setTimeout(() => canvas.style.transform = "translate(10px, -10px)", 100);
    setTimeout(() => canvas.style.transform = "translate(0, 0)", 150);
    if (score > highScore) { highScore = score; localStorage.setItem('snake-highscore', highScore); highScoreEl.innerText = highScore; }
    setTimeout(initSnake, 1500);
}

document.addEventListener('keydown', e => {
    if(!isPlaying) return;
    if (e.key === 'ArrowUp' && dy === 0) { dx = 0; dy = -1; }
    if (e.key === 'ArrowDown' && dy === 0) { dx = 0; dy = 1; }
    if (e.key === 'ArrowLeft' && dx === 0) { dx = -1; dy = 0; }
    if (e.key === 'ArrowRight' && dx === 0) { dx = 1; dy = 0; }
});

let touchStartX = 0; let touchStartY = 0;
canvas.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; touchStartY = e.changedTouches[0].screenY; }, {passive: true});
canvas.addEventListener('touchend', e => {
    if(!isPlaying) return;
    let deltaX = e.changedTouches[0].screenX - touchStartX; let deltaY = e.changedTouches[0].screenY - touchStartY;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 30 && dx === 0) { dx = 1; dy = 0; } else if (deltaX < -30 && dx === 0) { dx = -1; dy = 0; }
    } else {
        if (deltaY > 30 && dy === 0) { dx = 0; dy = 1; } else if (deltaY < -30 && dy === 0) { dx = 0; dy = -1; }
    }
}, {passive: true});

document.addEventListener('start-snake', initSnake);
document.addEventListener('stop-snake', () => { clearInterval(gameLoop); isPlaying = false; });
