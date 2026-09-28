(() => {
  const canvas = document.getElementById('snake-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  const scoreEl = document.getElementById('snake-score');
  const bestEl = document.getElementById('snake-highscore');
  const hintEl = document.getElementById('snake-hint');
  const GRID = 20;
  let snake = [], food = { x: 0, y: 0 }, score = 0, best = Babi.getBest('snake');
  let direction = { x: 0, y: -1 }, queue = [], speed = 120;
  let playing = false, paused = false, raf = 0, last = 0, accumulator = 0;
  let particles = [], touchStart = null;
  bestEl.textContent = best;

  function resize() {
    const px = Math.max(260, Math.min(Math.floor(window.innerWidth * 0.86), 520));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = `${px}px`;
    canvas.style.height = `${px}px`;
    canvas.width = Math.round(px * dpr);
    canvas.height = Math.round(px * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  function cellPx() { return canvas.clientWidth / GRID; }
  function freeSpot() {
    const occupied = new Set(snake.map(s => `${s.x}:${s.y}`));
    const free = [];
    for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) if (!occupied.has(`${x}:${y}`)) free.push({ x, y });
    return free[Math.floor(Math.random() * free.length)] || { x: 0, y: 0 };
  }
  function reset() {
    cancelAnimationFrame(raf);
    resize();
    const m = Math.floor(GRID / 2);
    snake = [{ x: m, y: m + 2 }, { x: m, y: m + 1 }, { x: m, y: m }, { x: m, y: m - 1 }];
    food = freeSpot(); direction = { x: 0, y: -1 }; queue = [];
    score = 0; speed = 120; accumulator = 0; particles = [];
    playing = true; paused = false; last = performance.now();
    scoreEl.textContent = '0'; hintEl.textContent = 'Swipe, flèches ou pavé tactile • traverse les bords • mange le 🐁';
    raf = requestAnimationFrame(loop);
    draw();
  }
  function setDirection(nx, ny) {
    if (!playing || paused) return;
    const base = queue.length ? queue[queue.length - 1] : direction;
    if (nx === -base.x && ny === -base.y) return;
    if (nx === base.x && ny === base.y) return;
    if (queue.length < 2) queue.push({ x: nx, y: ny });
    Babi.vibrate(8);
  }
  function togglePause() {
    if (!playing) return;
    paused = !paused;
    hintEl.textContent = paused ? '⏸️ Pause — utilisez le bouton central pour reprendre.' : 'Swipe, flèches ou pavé tactile • traverse les bords • mange le 🐁';
    Babi.vibrate(12);
    if (!paused) { last = performance.now(); raf = requestAnimationFrame(loop); }
    draw();
  }
  function step() {
    if (queue.length) direction = queue.shift();
    const head = snake[0];
    const next = { x: (head.x + direction.x + GRID) % GRID, y: (head.y + direction.y + GRID) % GRID };
    const ate = next.x === food.x && next.y === food.y;
    const limit = ate ? snake.length : snake.length - 1;
    for (let i = 0; i < limit; i++) if (snake[i].x === next.x && snake[i].y === next.y) return end();
    snake.unshift(next);
    if (ate) {
      score += 10;
      speed = Math.max(62, 120 - Math.floor(score / 40) * 4);
      scoreEl.textContent = score;
      Babi.vibrate([12, 24, 12]);
      const p = cellPx();
      for (let i = 0; i < 16; i++) particles.push({ x: food.x * p + p / 2, y: food.y * p + p / 2, vx: (Math.random() - .5) * 4.5, vy: (Math.random() - .5) * 4.5, life: 1 });
      food = freeSpot();
      if (score % 50 === 0) Babi.toast(`🔥 Combo +50 — vitesse ${Math.round(120 / speed * 100)}%`);
    } else snake.pop();
  }
  function end() {
    playing = false; paused = false; cancelAnimationFrame(raf);
    best = Babi.setBest('snake', score); bestEl.textContent = best;
    canvas.animate([{ transform: 'translateX(0)' }, { transform: 'translate(8px,-4px)' }, { transform: 'translate(-7px,4px)' }, { transform: 'translateX(0)' }], { duration: 260 });
    Babi.vibrate(180);
    Babi.win('snake', 'Game Over', `Score ${score} • Meilleur ${best}`, '🐍');
  }
  function draw() {
    const w = canvas.clientWidth || 320, h = canvas.clientHeight || w, p = w / GRID;
    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createRadialGradient(w * .2, h * .16, 10, w * .65, h * .75, w * .8);
    bg.addColorStop(0, 'rgba(53,232,255,.13)'); bg.addColorStop(.55, 'rgba(13,22,44,.74)'); bg.addColorStop(1, 'rgba(4,7,14,.96)');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,.035)'; ctx.lineWidth = 1;
    for (let i = 1; i < GRID; i++) { ctx.beginPath(); ctx.moveTo(i*p, 0); ctx.lineTo(i*p, h); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i*p); ctx.lineTo(w, i*p); ctx.stroke(); }
    ctx.font = `${p*.72}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🐁', food.x*p+p/2, food.y*p+p/2);
    snake.forEach((s, i) => {
      const x = s.x*p+p/2, y = s.y*p+p/2, r = p*(i ? .35 : .39);
      const g = ctx.createRadialGradient(x-r*.25, y-r*.35, 1, x, y, r*1.5);
      if (i === 0) { g.addColorStop(0, '#8fffff'); g.addColorStop(1, '#35e8ff'); } else { g.addColorStop(0, '#8cf9d0'); g.addColorStop(1, '#39f3a3'); }
      ctx.fillStyle = g; ctx.shadowColor = i ? 'rgba(57,243,163,.7)' : 'rgba(53,232,255,.9)'; ctx.shadowBlur = i ? 10 : 18;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      if (i === 0) { ctx.fillStyle = '#08121c'; const ex = x + (direction.x ? direction.x*p*.16 : -p*.13), ey = y + (direction.y ? direction.y*p*.16 : -p*.13); ctx.beginPath(); ctx.arc(ex, ey, p*.055, 0, Math.PI*2); ctx.fill(); }
    });
    for (let i = particles.length - 1; i >= 0; i--) { const q = particles[i]; q.x += q.vx; q.y += q.vy; q.life -= .055; ctx.fillStyle = `rgba(255,212,90,${Math.max(0,q.life)})`; ctx.beginPath(); ctx.arc(q.x, q.y, 2.3, 0, Math.PI*2); ctx.fill(); if (q.life <= 0) particles.splice(i,1); }
    if (paused) { ctx.fillStyle = 'rgba(4,8,16,.62)'; ctx.fillRect(0,0,w,h); ctx.fillStyle = '#fff'; ctx.font = '900 24px system-ui'; ctx.fillText('PAUSE', w/2, h/2); }
  }
  function loop(now) {
    if (!playing || paused) return;
    const dt = Math.min(50, now - last); last = now; accumulator += dt;
    while (accumulator >= speed) { accumulator -= speed; step(); if (!playing) return; }
    draw(); raf = requestAnimationFrame(loop);
  }
  document.addEventListener('start-snake', reset);
  document.addEventListener('stop-snake', () => { playing = false; cancelAnimationFrame(raf); });
  document.getElementById('snake-reset')?.addEventListener('click', reset);
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('keydown', e => {
    if (!playing) return;
    const map = { ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0] };
    if (map[e.key]) { e.preventDefault(); setDirection(...map[e.key]); }
    if (e.code === 'Space') { e.preventDefault(); togglePause(); }
  });
  canvas.addEventListener('touchstart', e => { const t = e.changedTouches[0]; touchStart = { x:t.clientX, y:t.clientY }; }, { passive:true });
  canvas.addEventListener('touchend', e => {
    if (!touchStart) return; const t = e.changedTouches[0]; const dx=t.clientX-touchStart.x, dy=t.clientY-touchStart.y; touchStart=null;
    if (Math.max(Math.abs(dx),Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) setDirection(dx > 0 ? 1 : -1, 0); else setDirection(0, dy > 0 ? 1 : -1);
  }, { passive:true });
  document.querySelectorAll('[data-snake-dir]').forEach(btn => btn.addEventListener('pointerdown', e => {
    e.preventDefault(); const d = btn.dataset.snakeDir;
    if (d === 'pause') togglePause(); else ({up:()=>setDirection(0,-1),down:()=>setDirection(0,1),left:()=>setDirection(-1,0),right:()=>setDirection(1,0)}[d] || (()=>{}))();
  }));
  resize();
})();
