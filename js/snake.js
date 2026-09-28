(() => {
  const canvas=document.getElementById('snake-canvas'); const ctx=canvas.getContext('2d');
  const scoreEl=document.getElementById('snake-score'), bestEl=document.getElementById('snake-highscore');
  let size=20, snake=[], apple={x:0,y:0}, score=0, best=Babi.getBest('snake'), timer=0, playing=false, raf=0, last=0, accumulator=0;
  let dir={x:0,y:-1}, queued=[], speed=105, particles=[], touchStart=null;
  bestEl.textContent=best;

  function resize(){const px=Math.min(Math.floor(window.innerWidth*.86),520); const dpr=Math.min(window.devicePixelRatio||1,2); canvas.style.width=`${px}px`; canvas.style.height=`${px}px`; canvas.width=px*dpr; canvas.height=px*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); size=Math.max(14,Math.floor(px/20));}
  function cellPx(){return Math.min(canvas.clientWidth,canvas.clientHeight)/size}
  function freeSpot(){const free=[]; for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(!snake.some(s=>s.x===x&&s.y===y))free.push({x,y}); return free[Math.floor(Math.random()*free.length)]||{x:0,y:0}}
  function newGame(){resize(); snake=[]; const m=Math.floor(size/2); for(let i=0;i<4;i++)snake.push({x:m,y:m+i}); dir={x:0,y:-1}; queued=[]; score=0; accumulator=0; particles=[]; apple=freeSpot(); scoreEl.textContent='0'; playing=true; cancelAnimationFrame(raf); last=performance.now(); raf=requestAnimationFrame(loop); draw()}
  function setDir(nx,ny){if(!playing)return; const base=queued.length?queued[queued.length-1]:dir; if(nx===-base.x&&ny===-base.y)return; if(nx===base.x&&ny===base.y)return; if(queued.length<2)queued.push({x:nx,y:ny}); Babi.vibrate(12)}
  function step(){if(queued.length)dir=queued.shift(); const head=snake[0]; const next={x:(head.x+dir.x+size)%size,y:(head.y+dir.y+size)%size}; const ate=next.x===apple.x&&next.y===apple.y; const bodyLimit=ate?snake.length:snake.length-1; for(let i=0;i<bodyLimit;i++)if(snake[i].x===next.x&&snake[i].y===next.y)return gameOver(); snake.unshift(next); if(ate){score+=10;scoreEl.textContent=score; Babi.vibrate([18,35,18]); const p=cellPx(); for(let i=0;i<18;i++)particles.push({x:apple.x*p+p/2,y:apple.y*p+p/2,vx:(Math.random()-.5)*5,vy:(Math.random()-.5)*5,life:1}); apple=freeSpot()}else snake.pop()}
  function draw(){const w=canvas.clientWidth,h=canvas.clientHeight,p=cellPx(); ctx.clearRect(0,0,w,h); ctx.fillStyle='rgba(5,9,17,.72)';ctx.fillRect(0,0,w,h); ctx.strokeStyle='rgba(255,255,255,.035)';ctx.lineWidth=1; for(let i=1;i<size;i++){ctx.beginPath();ctx.moveTo(i*p,0);ctx.lineTo(i*p,h);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i*p);ctx.lineTo(w,i*p);ctx.stroke()}
    ctx.font=`${p*.72}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🐁',apple.x*p+p/2,apple.y*p+p/2);
    snake.forEach((s,i)=>{ctx.fillStyle=i?'#39f3a3':'#35e8ff';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=i?8:16;ctx.beginPath();ctx.arc(s.x*p+p/2,s.y*p+p/2,p*.37,0,Math.PI*2);ctx.fill(); if(i===0){ctx.shadowBlur=0;ctx.fillStyle='#071018';const ex=s.x*p+p*(dir.x?0.63:.34),ey=s.y*p+p*(dir.y?0.63:.34);ctx.beginPath();ctx.arc(ex,ey,p*.055,0,Math.PI*2);ctx.fill()}});ctx.shadowBlur=0;
    
    // Correction du bug de scintillement des particules (itération inversée)
    for(let i=particles.length-1; i>=0; i--){
      const q = particles[i];
      q.x += q.vx; q.y += q.vy; q.life -= .05;
      ctx.fillStyle = `rgba(255,212,90,${Math.max(0, q.life)})`; // Sécurisation du canal alpha
      ctx.beginPath(); ctx.arc(q.x, q.y, 2.4, 0, Math.PI * 2); ctx.fill();
      if(q.life <= 0) particles.splice(i, 1);
    }
  }
  function loop(now){if(!playing)return; const dt=Math.min(50,now-last);last=now;accumulator+=dt; while(accumulator>=speed){accumulator-=speed;step();if(!playing)return} draw();raf=requestAnimationFrame(loop)}
  function gameOver(){playing=false;cancelAnimationFrame(raf);best=Babi.setBest('snake',score);bestEl.textContent=best;canvas.animate([{transform:'translate(0)'},{transform:'translate(9px,-5px)'},{transform:'translate(-8px,5px)'},{transform:'translate(0)'}],{duration:240});Babi.vibrate(180);Babi.win('snake','Game Over',`Score ${score} • Meilleur ${best}`,'🐍')}
  document.addEventListener('start-snake',newGame); document.getElementById('snake-reset').addEventListener('click',newGame); document.addEventListener('stop-snake',()=>{playing=false;cancelAnimationFrame(raf)}); window.addEventListener('resize',()=>{if(playing)resize()});
  document.addEventListener('keydown',e=>{if(!playing)return;const k={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[e.key];if(k){e.preventDefault();setDir(...k)}});
  canvas.addEventListener('touchstart',e=>{const t=e.changedTouches[0];touchStart={x:t.clientX,y:t.clientY}},{passive:true}); canvas.addEventListener('touchend',e=>{if(!touchStart)return;const t=e.changedTouches[0],dx=t.clientX-touchStart.x,dy=t.clientY-touchStart.y;touchStart=null;if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;if(Math.abs(dx)>Math.abs(dy))setDir(dx>0?1:-1,0);else setDir(0,dy>0?1:-1)},{passive:true});
})();
