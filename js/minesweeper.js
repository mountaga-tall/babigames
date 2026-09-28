(() => {
  const rows = 10, cols = 10, totalMines = 15;
  const grid = document.getElementById('minesweeper-grid');
  const leftEl = document.getElementById('mines-left');
  const scoreEl = document.getElementById('mines-score');
  const bestEl = document.getElementById('mines-highscore');
  const statusEl = document.getElementById('mines-status');
  
  let board = [], flags = 0, gameOver = false, started = false;
  let score = 0, timer = 0, startTime = 0, pressTimer = null;
  let best = window.Babi ? Babi.getBest('minesweeper') : 0;
  
  if (bestEl) bestEl.textContent = best;
  const inside = (r, c) => r >= 0 && r < rows && c >= 0 && c < cols;
  
  function neighbors(r, c) {
      const a = [];
      for (let dr = -1; dr <= 1; dr++)
          for (let dc = -1; dc <= 1; dc++)
              if (dr || dc) if (inside(r + dr, c + dc)) a.push([r + dr, c + dc]);
      return a;
  }

  function build(safeR = 0, safeC = 0) {
      board = Array.from({length: rows}, () => 
          Array.from({length: cols}, () => ({mine: false, revealed: false, flagged: false, n: 0}))
      );
      const forbidden = new Set([[safeR, safeC], ...neighbors(safeR, safeC)].map(([r, c]) => r * cols + c));
      let placed = 0;
      
      while (placed < totalMines) {
          const r = Math.floor(Math.random() * rows);
          const c = Math.floor(Math.random() * cols);
          const id = r * cols + c;
          if (forbidden.has(id) || board[r][c].mine) continue;
          board[r][c].mine = true;
          placed++;
      }
      
      for (let r = 0; r < rows; r++)
          for (let c = 0; c < cols; c++)
              if (!board[r][c].mine) 
                  board[r][c].n = neighbors(r, c).filter(([rr, cc]) => board[rr][cc].mine).length;
  }

  function init() {
      clearTimeout(pressTimer);
      flags = 0; gameOver = false; started = false; score = 0; timer = 0;
      if (scoreEl) scoreEl.textContent = '0';
      if (leftEl) leftEl.textContent = totalMines;
      if (statusEl) statusEl.textContent = 'Touchez une case • appui long / clic droit = drapeau';
      if (grid) grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      build(4, 4);
      render();
  }

  function render() {
      if (!grid) return;
      grid.innerHTML = '';
      for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
              const cell = document.createElement('button');
              cell.className = 'ms-cell';
              cell.dataset.r = r;
              cell.dataset.c = c;
              bindCell(cell, r, c);
              grid.appendChild(cell);
              update(r, c);
          }
      }
  }

  function bindCell(el, r, c) {
      el.addEventListener('click', e => {
          if (el.dataset.long === '1') { el.dataset.long = '0'; return; }
          reveal(r, c);
      });
      el.addEventListener('contextmenu', e => {
          e.preventDefault();
          flag(r, c);
      });
      el.addEventListener('pointerdown', e => {
          if (e.pointerType === 'touch') {
              el.dataset.long = '0';
              pressTimer = setTimeout(() => {
                  el.dataset.long = '1';
                  flag(r, c);
              }, 420);
          }
      });
      // Annulation du timer de drapeau si l'utilisateur scrolle ou bouge le doigt
      ['pointerup', 'pointercancel', 'pointerleave', 'pointermove'].forEach(t => 
          el.addEventListener(t, () => clearTimeout(pressTimer))
      );
  }

  function update(r, c) {
      if (!grid) return;
      const el = grid.children[r * cols + c], d = board[r][c];
      el.classList.toggle('revealed', d.revealed);
      el.classList.toggle('flagged', d.flagged);
      if (d.revealed) {
          el.innerHTML = d.mine ? '💣' : (d.n ? String(d.n) : '');
          el.classList.toggle('mine', d.mine);
      } else {
          el.innerHTML = d.flagged ? '🚩' : '';
      }
  }

  function reveal(r, c) {
      if (gameOver || board[r][c].revealed || board[r][c].flagged) return;
      if (!started) {
          started = true;
          startTime = performance.now();
          build(r, c);
          render();
          reveal(r, c);
          return;
      }
      
      const q = [[r, c]], seen = new Set();
      while (q.length) {
          const [rr, cc] = q.shift(), id = rr * cols + cc;
          if (seen.has(id) || !inside(rr, cc)) continue;
          seen.add(id);
          
          const d = board[rr][cc];
          if (d.revealed || d.flagged) continue;
          
          d.revealed = true;
          score += d.n ? 5 : 8;
          update(rr, cc);
          
          if (d.mine) { explode(); return; }
          if (d.n === 0) neighbors(rr, cc).forEach(x => q.push(x));
      }
      if (scoreEl) scoreEl.textContent = score;
      checkWin();
      if (window.Babi) Babi.vibrate(10);
  }

  function flag(r, c) {
      if (gameOver || board[r][c].revealed) return;
      if (!board[r][c].flagged && flags >= totalMines) return;
      board[r][c].flagged = !board[r][c].flagged;
      flags += board[r][c].flagged ? 1 : -1;
      if (leftEl) leftEl.textContent = totalMines - flags;
      update(r, c);
      if (window.Babi) Babi.vibrate(25);
  }

  function explode() {
      gameOver = true;
      board.flat().forEach(d => { if (d.mine) d.revealed = true; });
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) update(r, c);
      if (window.Babi) {
          Babi.vibrate([100, 50, 100]);
          Babi.win('minesweeper', 'BOOM !', `Score ${score} • Meilleur ${best}`, '💣');
      }
      if (statusEl) statusEl.textContent = '💥 Mine déclenchée. Rejouez !';
  }

  function checkWin() {
      const safe = rows * cols - totalMines;
      const revealed = board.flat().filter(d => d.revealed && !d.mine).length;
      if (revealed !== safe) return;
      
      gameOver = true;
      const elapsed = Math.max(1, (performance.now() - startTime) / 1000);
      const bonus = Math.max(0, Math.round(500 - elapsed * 8));
      score += bonus;
      
      if (scoreEl) scoreEl.textContent = score;
      if (window.Babi) {
          best = Babi.setBest('minesweeper', score);
          Babi.win('minesweeper', 'Grille nettoyée !', `Score ${score} • Bonus vitesse ${bonus}`, '🏆');
      }
      if (bestEl) bestEl.textContent = best;
      if (statusEl) statusEl.textContent = `🎉 Victoire en ${elapsed.toFixed(1)} s`;
  }

  document.addEventListener('start-minesweeper', init);
  if (document.getElementById('reset-minesweeper')) {
      document.getElementById('reset-minesweeper').addEventListener('click', init);
  }
})();
