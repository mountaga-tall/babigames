(function(){
  const views=[...document.querySelectorAll('.view')];
  const backBtn=document.getElementById('back-btn');
  const homeBtn=document.getElementById('home-btn');
  const installBtn=document.getElementById('install-btn');
  let currentGame=null;
  let deferredPrompt=null;

  window.Babi={
    vibrate(ms=35){try{navigator.vibrate?.(ms)}catch(e){}},
    toast(message){
      const el=document.getElementById('toast'); if(!el)return;
      el.textContent=message; el.classList.add('show'); clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove('show'),1800);
    },
    scoreKey(game){return `babigames-best-${game}`},
    getBest(game){return Number(localStorage.getItem(this.scoreKey(game))||0)},
    setBest(game,score){const best=this.getBest(game); if(score>best){localStorage.setItem(this.scoreKey(game),String(score)); return score} return best},
    win(game,title,text,emoji='🏆'){
      this.vibrate([30,60,30]); this.wow();
      const ov=document.getElementById('win-overlay');
      document.getElementById('win-emoji').textContent=emoji; document.getElementById('win-title').textContent=title; document.getElementById('win-text').textContent=text;
      ov.dataset.game=game; ov.classList.remove('hidden');
    },
    hideWin(){document.getElementById('win-overlay').classList.add('hidden')},
    wow(){
      const n=26; for(let i=0;i<n;i++){
        const p=document.createElement('span'); p.className='wow-spark'; p.style.cssText=`position:fixed;left:50%;top:45%;width:7px;height:7px;border-radius:50%;background:${i%2?'#35e8ff':'#a56dff'};box-shadow:0 0 12px currentColor;z-index:80;pointer-events:none;`;
        const a=(Math.PI*2*i/n),d=80+Math.random()*180,dx=Math.cos(a)*d,dy=Math.sin(a)*d;
        p.animate([{transform:'translate(-50%,-50%) scale(.5)',opacity:1},{transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(0)`,opacity:0}],{duration:650+Math.random()*300,easing:'cubic-bezier(.2,.7,.2,1)'}).finished.then(()=>p.remove()).catch(()=>p.remove());
        document.body.appendChild(p);
      }
    }
  };

  function showGame(game){
    Babi.hideWin();
    views.forEach(v=>v.classList.add('hidden'));
    const view=document.getElementById(`${game}-view`); if(!view)return;
    view.classList.remove('hidden'); currentGame=game; backBtn.classList.remove('hidden');
    document.dispatchEvent(new CustomEvent(`start-${game}`));
  }
  function showMenu(){
    if(currentGame) document.dispatchEvent(new CustomEvent(`stop-${currentGame}`));
    Babi.hideWin(); views.forEach(v=>v.classList.add('hidden')); document.getElementById('menu').classList.remove('hidden'); backBtn.classList.add('hidden'); currentGame=null;
  }
  document.querySelectorAll('.game-card[data-game]').forEach(btn=>btn.addEventListener('click',()=>{Babi.vibrate();showGame(btn.dataset.game)}));
  backBtn.addEventListener('click',()=>{Babi.vibrate();showMenu()}); homeBtn.addEventListener('click',showMenu);
  document.getElementById('win-menu').addEventListener('click',showMenu);
  document.getElementById('win-replay').addEventListener('click',()=>{const g=document.getElementById('win-overlay').dataset.game; Babi.hideWin(); if(g)showGame(g)});

  document.querySelectorAll('.level-switch').forEach(sw=>sw.addEventListener('click',e=>{
    const b=e.target.closest('button'); if(!b)return;
    const game=sw.dataset.game; const level=b.dataset.level;
    sw.querySelectorAll('button').forEach(x=>x.classList.toggle('selected',x===b));
    document.dispatchEvent(new CustomEvent(`set-level-${game}`,{detail:{level}}));
  }));

  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault(); deferredPrompt=e; installBtn.classList.remove('hidden')});
  installBtn.addEventListener('click',async()=>{if(!deferredPrompt)return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; installBtn.classList.add('hidden')});

  if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}))}
})();
