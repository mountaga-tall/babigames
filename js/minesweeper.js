(() => {
  const rows = 10, cols = 10, totalMines = 15;
  const grid = document.getElementById('minesweeper-grid');
  if (!grid) return;
  const leftEl = document.getElementById('mines-left');
  const scoreEl = document.getElementById('mines-score');
  const bestEl = document.getElementById('mines-highscore');
  const statusEl = document.getElementById('mines-status');
  let board = [], flags = 0, ended = false, started = false, score = 0, startTime = 0, pressTimer = null;
  let best = Babi.getBest('minesweeper');
  bestEl.textContent = best;
  const inside = (r,c) => r >= 0 && r < rows && c >= 0 && c < cols;
  function neighbors(r,c) { const out=[]; for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++) if((dr||dc)&&inside(r+dr,c+dc)) out.push([r+dr,c+dc]); return out; }
  function build(safeR=4, safeC=4) {
    board = Array.from({length:rows},()=>Array.from({length:cols},()=>({mine:false,revealed:false,flagged:false,n:0})));
    const forbidden = new Set([[safeR,safeC], ...neighbors(safeR,safeC)].map(([r,c])=>r*cols+c));
    let placed=0;
    while(placed<totalMines){const r=Math.floor(Math.random()*rows),c=Math.floor(Math.random()*cols),id=r*cols+c;if(forbidden.has(id)||board[r][c].mine)continue;board[r][c].mine=true;placed++;}
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)if(!board[r][c].mine)board[r][c].n=neighbors(r,c).filter(([rr,cc])=>board[rr][cc].mine).length;
  }
  function init(){
    clearTimeout(pressTimer);
    flags=0; ended=false; started=false; score=0; startTime=0; board=[];
    scoreEl.textContent='0'; leftEl.textContent=String(totalMines); statusEl.textContent='Touchez une case • appui long / clic droit = drapeau';
    render();
  }
  function render(){grid.innerHTML='';grid.style.gridTemplateColumns=`repeat(${cols},1fr)`;for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const cell=document.createElement('button');cell.type='button';cell.className='ms-cell';cell.dataset.r=r;cell.dataset.c=c;cell.setAttribute('aria-label',`Ligne ${r+1}, colonne ${c+1}`);bind(cell,r,c);grid.appendChild(cell);update(r,c);}}
  function bind(el,r,c){
    el.addEventListener('click',()=>{if(el.dataset.long==='1'){el.dataset.long='0';return;}reveal(r,c);});
    el.addEventListener('contextmenu',e=>{e.preventDefault();flag(r,c);});
    el.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'||ended)return;el.dataset.long='0';clearTimeout(pressTimer);pressTimer=setTimeout(()=>{el.dataset.long='1';flag(r,c);},430);});
    el.addEventListener('pointerup',()=>clearTimeout(pressTimer));el.addEventListener('pointercancel',()=>clearTimeout(pressTimer));
  }
  function update(r,c){const el=grid.children[r*cols+c],d=board[r][c];el.classList.toggle('revealed',d.revealed);el.classList.toggle('flagged',d.flagged);el.classList.toggle('mine',!!(d.revealed&&d.mine));if(d.revealed){el.textContent=d.mine?'💣':d.n?String(d.n):'';el.setAttribute('aria-label',d.mine?'Mine':'Case révélée');}else{el.textContent=d.flagged?'🚩':'';el.setAttribute('aria-label',d.flagged?'Case marquée d’un drapeau':'Case cachée');}}
  function reveal(r,c){
    if(ended||board[r][c].revealed||board[r][c].flagged)return;
    if(!started){
      started=true;
      startTime=performance.now();
      build(r,c);
      const first=board[r][c];
      first.revealed=true;
      score+=first.n?5:8;
      const q=[[r,c]],seen=new Set();
      while(q.length){
        const [rr,cc]=q.shift(),id=rr*cols+cc;
        if(seen.has(id)||!inside(rr,cc))continue;
        seen.add(id);
        const d=board[rr][cc];
        if(d.flagged)continue;
        if(!d.revealed)d.revealed=true;
        if(d.n===0)neighbors(rr,cc).forEach(v=>q.push(v));
      }
      render();
      scoreEl.textContent=String(score);
      checkWin();
      Babi.vibrate(8);
      return;
    }
    const q=[[r,c]],seen=new Set();
    while(q.length){const [rr,cc]=q.shift(),id=rr*cols+cc;if(seen.has(id)||!inside(rr,cc))continue;seen.add(id);const d=board[rr][cc];if(d.revealed||d.flagged)continue;d.revealed=true;score+=d.n?5:8;update(rr,cc);if(d.mine)return explode();if(d.n===0)neighbors(rr,cc).forEach(v=>q.push(v));}
    scoreEl.textContent=String(score);checkWin();Babi.vibrate(8);
  }
  function flag(r,c){if(ended||board[r][c].revealed)return;if(!board[r][c].flagged&&flags>=totalMines){Babi.toast('🚩 Maximum de drapeaux atteint');return;}board[r][c].flagged=!board[r][c].flagged;flags+=board[r][c].flagged?1:-1;leftEl.textContent=String(totalMines-flags);update(r,c);Babi.vibrate(20);}
  function explode(){ended=true;board.flat().forEach(d=>{if(d.mine)d.revealed=true;});for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)update(r,c);statusEl.textContent='💥 Mine déclenchée. Rejouez !';Babi.vibrate([100,50,100]);Babi.win('minesweeper','BOOM !',`Score ${score} • Meilleur ${best}`,'💣');}
  function checkWin(){const safe=rows*cols-totalMines,revealed=board.flat().filter(d=>d.revealed&&!d.mine).length;if(revealed!==safe)return;ended=true;const elapsed=Math.max(1,(performance.now()-startTime)/1000);const bonus=Math.max(0,Math.round(500-elapsed*8));score+=bonus;scoreEl.textContent=String(score);best=Babi.setBest('minesweeper',score);bestEl.textContent=String(best);statusEl.textContent=`🎉 Victoire en ${elapsed.toFixed(1)} s`;Babi.vibrate([40,50,80]);Babi.win('minesweeper','Grille nettoyée !',`Score ${score} • Bonus vitesse ${bonus}`,'🏆');}
  document.addEventListener('start-minesweeper',init);document.getElementById('reset-minesweeper')?.addEventListener('click',init);document.addEventListener('stop-minesweeper',()=>clearTimeout(pressTimer));init();
})();
