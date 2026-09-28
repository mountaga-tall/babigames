(() => {
  const $ = id => document.getElementById(id);

  // ==========================================
  // 1. PUISSANCE 4 (Connect 4)
  // ==========================================
  const c4 = { board: [], turn: 1, playing: false };
  
  function c4Init() {
    c4.board = Array(42).fill(0);
    c4.turn = 1;
    c4.playing = true;
    if($('connect4-status'))$('connect4-status').textContent = 'À vous';
    c4Render();
  }

  function c4Drop(col, player) {
    for (let r = 5; r >= 0; r--) {
      if (!c4.board[r * 7 + col]) {
        c4.board[r * 7 + col] = player;
        return r * 7 + col;
      }
    }
    return -1;
  }

  function c4Winner() {
    const b = c4.board;
    const chk = (i, step) => b[i] && b[i]===b[i+step] && b[i]===b[i+2*step] && b[i]===b[i+3*step] ? {p:b[i]} : null;
    for(let r=0; r<6; r++) {
      for(let c=0; c<7; c++) {
        const i = r*7+c;
        const w = (c<4 && chk(i,1)) || (r<3 && chk(i,7)) || (r<3 && c<4 && chk(i,8)) || (r<3 && c>2 && chk(i,6));
        if(w) return w;
      }
    }
    return b.includes(0) ? null : {p: 0};
  }

  function c4Render() {
    const grid = $('connect4-grid');
    if(!grid) return;
    grid.innerHTML = '';
    for(let i=0; i<42; i++) {
      const cell = document.createElement('div');
      cell.className = 'c4-cell';
      if(c4.board[i]) cell.classList.add(`p${c4.board[i]}`);
      cell.addEventListener('click', () => {
        if(!c4.playing || c4.turn !== 1) return;
        if(c4Drop(i%7, 1) !== -1) {
          if(window.Babi) Babi.vibrate(10);
          c4Render();
          if(!c4Finish()) {
            c4.turn = 2;
            $('connect4-status').textContent = 'Réflexion de l\'IA...';
            setTimeout(c4AI, 500);
          }
        }
      });
      grid.appendChild(cell);
    }
  }

  function c4Finish() {
    const w = c4Winner();
    if(w) {
      c4.playing = false;
      $('connect4-status').textContent = w.p === 1 ? 'Victoire !' : (w.p === 2 ? 'Défaite' : 'Égalité');
      if(w.p === 1 && window.Babi) {
        Babi.vibrate([100,50,100]);
        Babi.win('connect4', 'Victoire', 'Vous avez battu l\'IA', '🎯');
      }
      return true;
    }
    return false;
  }

  function c4AI() {
    if(!c4.playing) return;
    let options=[];
    
    // 1. Chercher un coup gagnant pour l'IA
    for(let c=0; c<7; c++) {
      if(c4.board[c]) continue;
      const clone = [...c4.board];
      c4Drop(c, 2);
      if(c4Winner()?.p === 2) { options = [c]; break; }
      c4.board = clone; // annuler
    }
    
    // 2. Bloquer le joueur s'il peut gagner
    if(!options.length) {
      for(let c=0; c<7; c++) {
        if(c4.board[c]) continue;
        const clone = [...c4.board];
        c4Drop(c, 1);
        if(c4Winner()?.p === 1) { options = [c]; break; }
        c4.board = clone; // annuler
      }
    }
    
    // 3. Sinon, jouer au centre ou autour
    if(!options.length) {
      for(let i=0; i<7; i++) if(!c4.board[i]) options.push(i);
      options.sort((a,b) => Math.abs(3-a) - Math.abs(3-b));
      if(options.length > 1) options = options.slice(0, Math.min(3, options.length));
    }
    
    // Sélection finale (Correction du bug)
    const col = options.length ? options[Math.floor(Math.random() * options.length)] : 3;
    c4Drop(col, 2);
    if(window.Babi) Babi.vibrate(10);
    c4Render();
    if(!c4Finish()) {
      c4.turn = 1;
      $('connect4-status').textContent = 'À vous';
    }
  }

  document.addEventListener('start-connect4', c4Init);
  if($('reset-connect4'))$('reset-connect4').addEventListener('click', c4Init);


  // ==========================================
  // 2. 2048
  // ==========================================
  let board2048 = [], score2048 = 0, playing2048 = false;
  
  function init2048() {
    board2048 = Array(16).fill(0);
    score2048 = 0;
    playing2048 = true;
    if($('score-2048'))$('score-2048').textContent = '0';
    spawn2048(); spawn2048();
    render2048();
  }

  function spawn2048() {
    const empty = board2048.map((v, i) => v === 0 ? i : -1).filter(i => i !== -1);
    if(empty.length) board2048[empty[Math.floor(Math.random() * empty.length)]] = Math.random() < 0.9 ? 2 : 4;
  }

  function render2048() {
    const grid = $('grid-2048');
    if(!grid) return;
    grid.innerHTML = '';
    board2048.forEach(val => {
      const cell = document.createElement('div');
      cell.className = `g2048-cell val-${val}`;
      cell.textContent = val > 0 ? val : '';
      grid.appendChild(cell);
    });
  }

  function move2048(dir) {
    if(!playing2048) return;
    let moved = false;
    const size = 4;
    
    const slide = (row) => {
      let arr = row.filter(val => val);
      let missing = size - arr.length;
      let zeros = Array(missing).fill(0);
      return arr.concat(zeros);
    };
    
    const combine = (row) => {
      for(let i=0; i<size-1; i++) {
        if(row[i] !== 0 && row[i] === row[i+1]) {
          row[i] *= 2;
          score2048 += row[i];
          row[i+1] = 0;
        }
      }
      return row;
    };

    let newBoard = [...board2048];
    for(let i=0; i<size; i++) {
      let row = [];
      for(let j=0; j<size; j++) {
        let index = dir === 'LEFT' || dir === 'RIGHT' ? (i * size + j) : (j * size + i);
        row.push(newBoard[index]);
      }
      
      if(dir === 'RIGHT' || dir === 'DOWN') row.reverse();
      row = slide(row);
      row = combine(row);
      row = slide(row);
      if(dir === 'RIGHT' || dir === 'DOWN') row.reverse();
      
      for(let j=0; j<size; j++) {
        let index = dir === 'LEFT' || dir === 'RIGHT' ? (i * size + j) : (j * size + i);
        if(newBoard[index] !== row[j]) moved = true;
        newBoard[index] = row[j];
      }
    }
    
    if(moved) {
      board2048 = newBoard;
      spawn2048();
      if($('score-2048'))$('score-2048').textContent = score2048;
      render2048();
      if(window.Babi) Babi.vibrate(15);
      checkGameOver2048();
    }
  }

  function checkGameOver2048() {
    if(!board2048.includes(0)) {
      playing2048 = false;
      if(window.Babi) {
        const best = Babi.setBest('2048', score2048);
        Babi.win('2048', 'Game Over', `Score ${score2048} • Meilleur ${best}`, '🧩');
      }
    }
  }

  document.addEventListener('start-2048', init2048);
  if($('reset-2048'))$('reset-2048').addEventListener('click', init2048);
  
  // Contrôles 2048 (Clavier et Touch)
  document.addEventListener('keydown', e => {
    if(!playing2048) return;
    const map = {ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT'};
    if(map[e.key]) { e.preventDefault(); move2048(map[e.key]); }
  });
  
  let touchStart2048 = null;
  const c2048 = $('grid-2048');
  if(c2048) {
    c2048.addEventListener('touchstart', e => touchStart2048 = {x: e.touches[0].clientX, y: e.touches[0].clientY}, {passive:true});
    c2048.addEventListener('touchend', e => {
      if(!touchStart2048) return;
      const dx = e.changedTouches[0].clientX - touchStart2048.x;
      const dy = e.changedTouches[0].clientY - touchStart2048.y;
      if(Math.max(Math.abs(dx), Math.abs(dy)) > 30) {
        if(Math.abs(dx) > Math.abs(dy)) move2048(dx > 0 ? 'RIGHT' : 'LEFT');
        else move2048(dy > 0 ? 'DOWN' : 'UP');
      }
    }, {passive:true});
  }

  // ==========================================
  // 3. MEMORY
  // ==========================================
  const memIcons = ['🍎','🍌','🍇','🍉','🍓','🍒','🍍','🥝'];
  let memCards = [], memFlipped = [], memMatched = 0, memLock = false, memMoves = 0;

  function initMemory() {
    const grid = $('memory-grid');
    if(!grid) return;
    grid.innerHTML = '';
    memCards = [...memIcons, ...memIcons].sort(() => Math.random() - 0.5);
    memFlipped = []; memMatched = 0; memLock = false; memMoves = 0;
    if($('memory-moves'))$('memory-moves').textContent = '0';
    
    memCards.forEach((icon, i) => {
      const card = document.createElement('div');
      card.className = 'mem-card';
      card.dataset.icon = icon;
      card.dataset.index = i;
      card.addEventListener('click', () => flipMemory(card));
      grid.appendChild(card);
    });
  }

  function flipMemory(card) {
    if(memLock || card.classList.contains('flipped') || memFlipped.includes(card)) return;
    
    card.classList.add('flipped');
    card.textContent = card.dataset.icon;
    memFlipped.push(card);
    if(window.Babi) Babi.vibrate(10);
    
    if(memFlipped.length === 2) {
      memMoves++;
      if($('memory-moves'))$('memory-moves').textContent = memMoves;
      memLock = true;
      
      if(memFlipped[0].dataset.icon === memFlipped[1].dataset.icon) {
        memMatched += 2;
        memFlipped = [];
        memLock = false;
        if(memMatched === memCards.length && window.Babi) {
          Babi.vibrate([50, 50, 100]);
          Babi.win('memory', 'Félicitations', `Terminé en ${memMoves} coups`, '🧠');
        }
      } else {
        setTimeout(() => {
          memFlipped[0].classList.remove('flipped');
          memFlipped[0].textContent = '';
          memFlipped[1].classList.remove('flipped');
          memFlipped[1].textContent = '';
          memFlipped = [];
          memLock = false;
        }, 1000);
      }
    }
  }

  document.addEventListener('start-memory', initMemory);
  if($('reset-memory'))$('reset-memory').addEventListener('click', initMemory);


  // ==========================================
  // 4. TETRIS
  // ==========================================
  const tCanvas = $('tetris-canvas');
  const tCtx = tCanvas ? tCanvas.getContext('2d') : null;
  const ROWS = 20, COLS = 10, BLOCK_SIZE = 24;
  let tBoard = [], tPiece = null, tScore = 0, tDropCounter = 0, tLastTime = 0, tRaf = 0, tPlaying = false;
  
  const TETROMINOES = [
    { matrix: [[1,1,1,1]], color: '#00f0f0' }, // I
    { matrix: [[1,1],[1,1]], color: '#f0f000' }, // O
    { matrix: [[0,1,0],[1,1,1]], color: '#a000f0' }, // T
    { matrix: [[1,0,0],[1,1,1]], color: '#0000f0' }, // L
    { matrix: [[0,0,1],[1,1,1]], color: '#f0a000' }, // J
    { matrix: [[0,1,1],[1,1,0]], color: '#00f000' }, // S
    { matrix: [[1,1,0],[0,1,1]], color: '#f00000' }  // Z
  ];

  function initTetris() {
    if(!tCanvas) return;
    tCanvas.width = COLS * BLOCK_SIZE;
    tCanvas.height = ROWS * BLOCK_SIZE;
    tBoard = Array.from({length: ROWS}, () => Array(COLS).fill(0));
    tScore = 0;
    tPlaying = true;
    if($('tetris-score'))$('tetris-score').textContent = '0';
    spawnTetromino();
    cancelAnimationFrame(tRaf);
    tDropCounter = 0;
    tLastTime = performance.now();
    tRaf = requestAnimationFrame(updateTetris);
  }

  function spawnTetromino() {
    const rand = TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)];
    tPiece = { matrix: rand.matrix, color: rand.color, x: Math.floor(COLS/2)-1, y: 0 };
    if(collideTetris(tBoard, tPiece)) {
      tPlaying = false;
      cancelAnimationFrame(tRaf);
      if(window.Babi) {
        const best = Babi.setBest('tetris', tScore);
        Babi.win('tetris', 'Game Over', `Score ${tScore} • Meilleur ${best}`, '🧱');
      }
    }
  }

  function drawTetris() {
    tCtx.fillStyle = '#050911';
    tCtx.fillRect(0, 0, tCanvas.width, tCanvas.height);
    
    // Draw board
    tBoard.forEach((row, y) => {
      row.forEach((value, x) => {
        if(value) { tCtx.fillStyle = value; tCtx.fillRect(x*BLOCK_SIZE, y*BLOCK_SIZE, BLOCK_SIZE-1, BLOCK_SIZE-1); }
      });
    });
    
    // Draw active piece
    if(tPiece) {
      tCtx.fillStyle = tPiece.color;
      tPiece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
          if(value) tCtx.fillRect((tPiece.x + x)*BLOCK_SIZE, (tPiece.y + y)*BLOCK_SIZE, BLOCK_SIZE-1, BLOCK_SIZE-1);
        });
      });
    }
  }

  function collideTetris(board, piece) {
    for(let y=0; y<piece.matrix.length; y++) {
      for(let x=0; x<piece.matrix[y].length; x++) {
        if(piece.matrix[y][x] && (board[piece.y + y] && board[piece.y + y][piece.x + x]) !== 0) return true;
      }
    }
    return false;
  }

  function mergeTetris() {
    tPiece.matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if(value) tBoard[tPiece.y + y][tPiece.x + x] = tPiece.color;
      });
    });
  }

  function clearLines() {
    let linesCleared = 0;
    outer: for(let y=ROWS-1; y>=0; y--) {
      for(let x=0; x<COLS; x++) if(tBoard[y][x] === 0) continue outer;
      const row = tBoard.splice(y, 1)[0].fill(0);
      tBoard.unshift(row);
      y++; linesCleared++;
    }
    if(linesCleared > 0) {
      tScore += linesCleared * 100;
      if($('tetris-score'))$('tetris-score').textContent = tScore;
      if(window.Babi) Babi.vibrate(20 * linesCleared);
    }
  }

  function movePieceTetris(dir) {
    if(!tPlaying) return;
    tPiece.x += dir;
    if(collideTetris(tBoard, tPiece)) tPiece.x -= dir;
  }

  function dropPieceTetris() {
    if(!tPlaying) return;
    tPiece.y++;
    if(collideTetris(tBoard, tPiece)) {
      tPiece.y--;
      mergeTetris();
      clearLines();
      spawnTetromino();
    }
    tDropCounter = 0;
  }

  function rotatePieceTetris() {
    if(!tPlaying) return;
    const oldMatrix = tPiece.matrix;
    tPiece.matrix = tPiece.matrix[0].map((_, i) => tPiece.matrix.map(row => row[i]).reverse());
    if(collideTetris(tBoard, tPiece)) tPiece.matrix = oldMatrix;
  }

  function updateTetris(time = 0) {
    if(!tPlaying) return;
    const dt = time - tLastTime;
    tLastTime = time;
    tDropCounter += dt;
    if(tDropCounter > 800) dropPieceTetris();
    drawTetris();
    tRaf = requestAnimationFrame(updateTetris);
  }

  document.addEventListener('start-tetris', initTetris);
  if($('reset-tetris'))$('reset-tetris').addEventListener('click', initTetris);
  
  document.addEventListener('keydown', e => {
    if(!tPlaying) return;
    if(e.key === 'ArrowLeft') { movePieceTetris(-1); e.preventDefault(); }
    else if(e.key === 'ArrowRight') { movePieceTetris(1); e.preventDefault(); }
    else if(e.key === 'ArrowDown') { dropPieceTetris(); e.preventDefault(); }
    else if(e.key === 'ArrowUp') { rotatePieceTetris(); e.preventDefault(); }
  });

})();
