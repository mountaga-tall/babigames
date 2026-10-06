(() => {
  const LEVELS = {
    easy: { label:'Facile', seconds:22, chessDepth:1, checkersDepth:1, aiDelay:420 },
    medium: { label:'Moyen', seconds:16, chessDepth:2, checkersDepth:2, aiDelay:560 },
    hard: { label:'Expert', seconds:11, chessDepth:3, checkersDepth:3, aiDelay:760 }
  };
  const CHESS_SYMBOL = { w:{k:'♔',q:'♕',r:'♖',b:'♗',n:'♘',p:'♙'}, b:{k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'} };
  const PIECE_VALUES = { p:100, n:320, b:330, r:500, q:900, k:20000 };
  const DIR4 = [[1,1],[1,-1],[-1,1],[-1,-1]];
  const idx = (r,c) => r*8+c;
  const rc = i => [Math.floor(i/8), i%8];
  const inside = (r,c) => r>=0 && r<8 && c>=0 && c<8;

  const chess = { level:'medium', state:null, selected:null, gameOver:false, timer:0, aiTimer:0, aiStepTimer:0, timeLeft:0, score:0, best:Babi.getBest('chess') };
  const checkers = { level:'medium', state:null, selected:null, mustContinue:null, gameOver:false, timer:0, aiTimer:0, aiStepTimer:0, timeLeft:0, score:0, best:Babi.getBest('checkers') };
  document.getElementById('chess-highscore').textContent = chess.best;
  document.getElementById('checkers-highscore').textContent = checkers.best;

  // ========================= ÉCHECS =========================
  function cloneChess(s){ return { board:s.board.map(p=>p?{...p}:null), turn:s.turn, ep:s.ep?{...s.ep}:null, castling:{...s.castling} }; }
  function initialChess(){
    const b=Array(64).fill(null), back=['r','n','b','q','k','b','n','r'];
    for(let c=0;c<8;c++){b[idx(0,c)]={color:'b',type:back[c],moved:false};b[idx(1,c)]={color:'b',type:'p',moved:false};b[idx(6,c)]={color:'w',type:'p',moved:false};b[idx(7,c)]={color:'w',type:back[c],moved:false};}
    return {board:b,turn:'w',ep:null,castling:{wK:true,wQ:true,bK:true,bQ:true}};
  }
  function pseudoChessMoves(s,from,attacksOnly=false){
    const p=s.board[from]; if(!p)return[];
    const [r,c]=rc(from), moves=[];
    const add=(rr,cc,o={})=>{
      if(!inside(rr,cc))return;
      const target=s.board[idx(rr,cc)];
      if(!attacksOnly && target?.type==='k')return;
      moves.push({from,to:idx(rr,cc),...o});
    };
    if(p.type==='p'){
      const d=p.color==='w'?-1:1, start=p.color==='w'?6:1;
      if(attacksOnly){for(const dc of [-1,1])if(inside(r+d,c+dc))add(r+d,c+dc,{attack:true});return moves;}
      if(inside(r+d,c)&&!s.board[idx(r+d,c)]){add(r+d,c);if(r===start&&!s.board[idx(r+2*d,c)])add(r+2*d,c,{double:true});}
      for(const dc of [-1,1]){const rr=r+d,cc=c+dc;if(!inside(rr,cc))continue;const t=s.board[idx(rr,cc)];if(t&&t.color!==p.color&&t.type!=='k')add(rr,cc,{capture:true});else if(s.ep&&s.ep.r===rr&&s.ep.c===cc)add(rr,cc,{capture:true,enPassant:true});}
    } else if(p.type==='n'){
      for(const [dr,dc] of [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]]){const rr=r+dr,cc=c+dc;if(!inside(rr,cc))continue;const t=s.board[idx(rr,cc)];if(attacksOnly||!t|| (t.color!==p.color&&t.type!=='k'))add(rr,cc,{capture:!!t&&!attacksOnly});}
    } else if(['b','r','q'].includes(p.type)){
      const dirs=p.type==='b'?DIR4:p.type==='r'?[[1,0],[-1,0],[0,1],[0,-1]]:[...DIR4,[1,0],[-1,0],[0,1],[0,-1]];
      for(const [dr,dc] of dirs)for(let n=1;n<8;n++){
        const rr=r+dr*n,cc=c+dc*n;if(!inside(rr,cc))break;const t=s.board[idx(rr,cc)];
        if(attacksOnly){moves.push({from,to:idx(rr,cc),attack:true});if(t)break;continue;}
        if(!t){add(rr,cc);continue;}
        if(t.color!==p.color&&t.type!=='k')add(rr,cc,{capture:true});break;
      }
    } else if(p.type==='k'){
      for(const [dr,dc] of [...DIR4,[1,0],[-1,0],[0,1],[0,-1]]){const rr=r+dr,cc=c+dc;if(!inside(rr,cc))continue;const t=s.board[idx(rr,cc)];if(attacksOnly||!t||(t.color!==p.color&&t.type!=='k'))add(rr,cc,{capture:!!t&&!attacksOnly});}
      if(!attacksOnly&&!p.moved&&!isSquareAttacked(s,from,p.color==='w'?'b':'w')){
        const enemy=p.color==='w'?'b':'w';
        const rookK=s.board[idx(r,7)], rookQ=s.board[idx(r,0)];
        if(s.castling[`${p.color}K`]&&rookK?.color===p.color&&rookK.type==='r'&&!rookK.moved&&!s.board[idx(r,5)]&&!s.board[idx(r,6)]&&!isSquareAttacked(s,idx(r,5),enemy)&&!isSquareAttacked(s,idx(r,6),enemy))add(r,6,{castle:'K'});
        if(s.castling[`${p.color}Q`]&&rookQ?.color===p.color&&rookQ.type==='r'&&!rookQ.moved&&!s.board[idx(r,1)]&&!s.board[idx(r,2)]&&!s.board[idx(r,3)]&&!isSquareAttacked(s,idx(r,3),enemy)&&!isSquareAttacked(s,idx(r,2),enemy))add(r,2,{castle:'Q'});
      }
    }
    return moves;
  }
  function isSquareAttacked(s,sq,byColor){for(let i=0;i<64;i++){const p=s.board[i];if(p&&p.color===byColor&&pseudoChessMoves(s,i,true).some(m=>m.to===sq))return true;}return false;}
  function findKing(s,color){return s.board.findIndex(p=>p&&p.color===color&&p.type==='k');}
  function chessApply(s,m){
    const n=cloneChess(s), p={...n.board[m.from]};
    n.board[m.from]=null; n.ep=null;
    if(m.enPassant){const [r,c]=rc(m.to);n.board[idx(p.color==='w'?r+1:r-1,c)]=null;}
    if(m.castle){const [r,c]=rc(m.to);const rookFrom=m.castle==='K'?idx(r,7):idx(r,0),rookTo=m.castle==='K'?idx(r,5):idx(r,3);if(n.board[rookFrom]){n.board[rookTo]={...n.board[rookFrom],moved:true};n.board[rookFrom]=null;}}
    if(p.type==='p'&&Math.abs(m.to-m.from)===16){const [fromR]=rc(m.from),[toR,c]=rc(m.to);n.ep={r:(fromR+toR)/2,c};}
    const destinationRow=rc(m.to)[0];if(p.type==='p'&&destinationRow===(p.color==='w'?0:7))p.type='q';
    const home=p.color==='w'?7:0;
    if(p.type==='k'){n.castling[`${p.color}K`]=false;n.castling[`${p.color}Q`]=false;}
    if(p.type==='r'){if(m.from===idx(home,0))n.castling[`${p.color}Q`]=false;if(m.from===idx(home,7))n.castling[`${p.color}K`]=false;}
    const other=p.color==='w'?'b':'w', otherHome=other==='w'?7:0;
    if(m.to===idx(otherHome,0))n.castling[`${other}Q`]=false;
    if(m.to===idx(otherHome,7))n.castling[`${other}K`]=false;
    p.moved=true;n.board[m.to]=p;n.turn=other;return n;
  }
  function legalChessMoves(s,color=s.turn){
    const out=[];for(let i=0;i<64;i++){if(!s.board[i]||s.board[i].color!==color)continue;for(const m of pseudoChessMoves(s,i)){const n=chessApply(s,m),k=findKing(n,color);if(k>=0&&!isSquareAttacked(n,k,color==='w'?'b':'w'))out.push(m);}}
    return out;
  }
  function chessEndCheck(s,side){const moves=legalChessMoves(s,side);if(moves.length)return null;const king=findKing(s,side);if(king>=0&&isSquareAttacked(s,king,side==='w'?'b':'w'))return 'checkmate';return 'stalemate';}
  function chessEval(s){let v=0;for(const p of s.board)if(p)v+=(p.color==='b'?1:-1)*PIECE_VALUES[p.type];const bk=findKing(s,'b'),wk=findKing(s,'w');if(bk>=0&&isSquareAttacked(s,bk,'w'))v-=35;if(wk>=0&&isSquareAttacked(s,wk,'b'))v+=35;return v;}
  function chessSearch(s,depth,alpha=-Infinity,beta=Infinity){
    if(depth<=0)return chessEval(s);
    const moves=legalChessMoves(s,s.turn);if(!moves.length){const k=findKing(s,s.turn);return k>=0&&isSquareAttacked(s,k,s.turn==='w'?'b':'w')?(s.turn==='b'?-999999:999999):0;}
    const maximizing=s.turn==='b';let best=maximizing?-Infinity:Infinity;
    for(const m of moves){const val=chessSearch(chessApply(s,m),depth-1,alpha,beta);if(maximizing){if(val>best)best=val;if(best>alpha)alpha=best;}else{if(val<best)best=val;if(best<beta)beta=best;}if(beta<=alpha)break;}
    return best;
  }
  function bestChessMove(s,depth){
    const moves=legalChessMoves(s,'b');if(!moves.length)return null;
    const ordered=[...moves].sort((a,b)=>Number(b.capture||b.enPassant)-Number(a.capture||a.enPassant));
    if(depth<=1){const captures=ordered.filter(m=>m.capture||m.enPassant);return (captures.length?captures:ordered)[Math.floor(Math.random()*(captures.length?captures.length:ordered.length))];}
    let best=-Infinity,choice=ordered[0];for(const m of ordered){const value=chessSearch(chessApply(s,m),depth-1,-Infinity,Infinity);if(value>best){best=value;choice=m;}}return choice;
  }
  function chessRender(){
    const board=document.getElementById('chess-board');if(!board||!chess.state)return;board.innerHTML='';
    const legal=chess.selected!==null?legalChessMoves(chess.state,'w').filter(m=>m.from===chess.selected):[];const map=new Map(legal.map(m=>[m.to,m]));const checked=findKing(chess.state,'w');const blackChecked=findKing(chess.state,'b');
    for(let i=0;i<64;i++){const sq=document.createElement('button');sq.type='button';const [r,c]=rc(i);sq.className=`square ${(r+c)%2?'dark':'light'}`;sq.setAttribute('role','gridcell');sq.setAttribute('aria-label',`${String.fromCharCode(97+c)}${8-r}`);if(i===chess.selected)sq.classList.add('selected');if(i===checked&&isSquareAttacked(chess.state,checked,'b'))sq.classList.add('in-check');if(i===blackChecked&&isSquareAttacked(chess.state,blackChecked,'w'))sq.classList.add('in-check-enemy');if(map.has(i))sq.classList.add(map.get(i).capture||map.get(i).enPassant?'capture':'legal');const p=chess.state.board[i];if(p){const piece=document.createElement('span');piece.className=`piece ${p.color==='w'?'white-piece':'black-piece'}`;piece.textContent=CHESS_SYMBOL[p.color][p.type];sq.appendChild(piece);}sq.addEventListener('click',()=>chessClick(i));board.appendChild(sq);}
  }
  function chessClick(i){
    if(chess.gameOver||chess.state.turn!=='w')return;const p=chess.state.board[i];
    if(chess.selected===null){if(p?.color==='w'){chess.selected=i;chessRender();Babi.vibrate(12);}return;}
    if(i===chess.selected){chess.selected=null;chessRender();return;}
    const move=legalChessMoves(chess.state,'w').find(m=>m.from===chess.selected&&m.to===i);
    if(move)makeChessHuman(move);else if(p?.color==='w'){chess.selected=i;chessRender();}else Babi.toast('Déplacement illégal');
  }
  function chessScore(add){
    chess.score=Math.max(0,chess.score+(Number(add)||0));document.getElementById('chess-score').textContent=chess.score;
    if(chess.score>chess.best){chess.best=Babi.setBest('chess',chess.score);document.getElementById('chess-highscore').textContent=chess.best;}
  }
  function startChessTimer(){clearInterval(chess.timer);chess.timeLeft=LEVELS[chess.level].seconds;document.getElementById('chess-timer').textContent=chess.timeLeft;chess.timer=setInterval(()=>{if(chess.gameOver||chess.state?.turn!=='w'){clearInterval(chess.timer);return;}chess.timeLeft--;document.getElementById('chess-timer').textContent=chess.timeLeft;if(chess.timeLeft<=0){clearInterval(chess.timer);document.getElementById('chess-status').textContent='⏱️ Temps écoulé';chess.state.turn='b';chess.selected=null;chessRender();Babi.vibrate(150);scheduleChessAI();}},1000);}
  function finishChess(title,text,won,emoji){chess.gameOver=true;clearInterval(chess.timer);clearTimeout(chess.aiTimer);clearTimeout(chess.aiStepTimer);if(won){chess.best=Babi.setBest('chess',chess.score);document.getElementById('chess-highscore').textContent=chess.best;}Babi.win('chess',title,text,emoji);}
  function scheduleChessAI(){clearInterval(chess.timer);clearTimeout(chess.aiTimer);document.getElementById('chess-status').textContent='🤖 IA en réflexion…';chess.state.turn='b';chess.aiTimer=setTimeout(playChessAI,LEVELS[chess.level].aiDelay);}
  function makeChessHuman(m){
    clearInterval(chess.timer);const moving=chess.state.board[m.from],target=m.enPassant?{type:'p'}:chess.state.board[m.to];const before=moving.type;
    chess.state=chessApply(chess.state,m);chess.selected=null;chessScore(10);if(target)chessScore(Math.max(25,Math.round((PIECE_VALUES[target.type]||0)/6)));if(before==='p'&&chess.state.board[m.to]?.type==='q')chessScore(80);chessRender();
    const end=chessEndCheck(chess.state,'b');if(end==='checkmate'){chessScore(500);finishChess('ÉCHEC ET MAT !',`Victoire • Score ${chess.score}`,true,'♛');return;}if(end==='stalemate'){finishChess('PAT',`Partie nulle • Score ${chess.score}`,false,'🤝');return;}
    document.getElementById('chess-status').textContent=isSquareAttacked(chess.state,findKing(chess.state,'b'),'w')?'⚡ Échec — IA doit répondre':'🤖 À l’IA';scheduleChessAI();
  }
  function playChessAI(){
    if(chess.gameOver||chess.state?.turn!=='b')return;const m=bestChessMove(chess.state,LEVELS[chess.level].chessDepth);if(!m){const end=chessEndCheck(chess.state,'b');if(end==='checkmate')finishChess('ÉCHEC ET MAT',`L’IA gagne • Score ${chess.score}`,false,'🤖');else finishChess('PAT',`Partie nulle • Score ${chess.score}`,false,'🤝');return;}
    const from=m.from,to=m.to;chess.state=chessApply(chess.state,m);const oldPiece=document.querySelector(`#chess-board .square:nth-child(${from+1}) .piece`);oldPiece?.classList.add('ai-moving');
    chess.aiStepTimer=setTimeout(()=>{chess.aiStepTimer=0;if(chess.gameOver)return;chessRender();const end=chessEndCheck(chess.state,'w');if(end==='checkmate'){finishChess('ÉCHEC ET MAT',`L’IA gagne • Score ${chess.score}`,false,'🤖');return;}if(end==='stalemate'){finishChess('PAT',`Partie nulle • Score ${chess.score}`,false,'🤝');return;}chess.state.turn='w';document.getElementById('chess-status').textContent=isSquareAttacked(chess.state,findKing(chess.state,'w'),'b')?'⚡ Échec — à vous':'À votre tour';startChessTimer();},170);
  }
  function initChess(){clearInterval(chess.timer);clearTimeout(chess.aiTimer);clearTimeout(chess.aiStepTimer);chess.state=initialChess();chess.selected=null;chess.gameOver=false;chess.score=0;document.getElementById('chess-score').textContent='0';document.getElementById('chess-highscore').textContent=chess.best;document.getElementById('chess-status').textContent=`${LEVELS[chess.level].label} • À votre tour`;chessRender();startChessTimer();}

  // ========================= DAMES =========================
  function initialCheckers(){const b=Array(64).fill(null);for(let r=0;r<3;r++)for(let c=0;c<8;c++)if((r+c)%2===1)b[idx(r,c)]={color:'b',king:false};for(let r=5;r<8;r++)for(let c=0;c<8;c++)if((r+c)%2===1)b[idx(r,c)]={color:'r',king:false};return {board:b,turn:'r'};}
  function cloneCheckers(s){return {board:s.board.map(p=>p?{...p}:null),turn:s.turn};}
  function checkersCaptureSteps(s,from,color){
    const p=s.board[from];if(!p)return[];const [r,c]=rc(from),out=[];
    if(p.king){for(const [dr,dc] of DIR4){let rr=r+dr,cc=c+dc,enemy=-1;while(inside(rr,cc)){const v=s.board[idx(rr,cc)];if(!v){if(enemy>=0)out.push({from,to:idx(rr,cc),capture:enemy});rr+=dr;cc+=dc;continue;}if(v.color===color||enemy>=0)break;enemy=idx(rr,cc);rr+=dr;cc+=dc;}}}
    else{for(const [dr,dc] of DIR4){const mr=r+dr,mc=c+dc,tr=r+2*dr,tc=c+2*dc;if(!inside(tr,tc)||!inside(mr,mc))continue;const mid=s.board[idx(mr,mc)];if(mid&&mid.color!==color&&!s.board[idx(tr,tc)])out.push({from,to:idx(tr,tc),capture:idx(mr,mc)});}}
    return out;
  }
  function checkersSimpleMoves(s,from,color){
    const p=s.board[from],out=[];if(!p)return out;const [r,c]=rc(from);
    if(p.king){for(const [dr,dc] of DIR4)for(let n=1;n<8;n++){const rr=r+dr*n,cc=c+dc*n;if(!inside(rr,cc)||s.board[idx(rr,cc)])break;out.push({from,to:idx(rr,cc)});}}
    else{const d=color==='r'?-1:1;for(const dc of [-1,1]){const rr=r+d,cc=c+dc;if(inside(rr,cc)&&!s.board[idx(rr,cc)])out.push({from,to:idx(rr,cc)});}}
    return out;
  }
  function applyCheckerStep(s,m){const n=cloneCheckers(s),p={...n.board[m.from]};n.board[m.from]=null;if(m.capture!==undefined)n.board[m.capture]=null;n.board[m.to]=p;const r=rc(m.to)[0];if(!p.king&&((p.color==='r'&&r===0)||(p.color==='b'&&r===7)))p.king=true;n.board[m.to]=p;return n;}
  function expandCaptureSequences(s,from,color){
    const first=checkersCaptureSteps(s,from,color),results=[];function dfs(state,current,seq){const next=checkersCaptureSteps(state,current,color);if(!next.length){results.push(seq);return;}for(const m of next)dfs(applyCheckerStep(state,m),m.to,[...seq,m]);}
    for(const m of first)dfs(applyCheckerStep(s,m),m.to,[m]);return results;
  }
  function allTurnCheckersSequences(s,color=s.turn){
    const captures=[];for(let i=0;i<64;i++)if(s.board[i]?.color===color)captures.push(...expandCaptureSequences(s,i,color));if(captures.length)return captures;
    const moves=[];for(let i=0;i<64;i++)if(s.board[i]?.color===color)moves.push(...checkersSimpleMoves(s,i,color).map(m=>[m]));return moves;
  }
  function checkersEval(s){let v=0;for(const p of s.board)if(p)v+=(p.color==='b'?1:-1)*(p.king?175:100);v+=(allTurnCheckersSequences(s,'b').length-allTurnCheckersSequences(s,'r').length)*6;return v;}
  function checkersSearch(s,depth,alpha=-Infinity,beta=Infinity){const moves=allTurnCheckersSequences(s,s.turn);if(!moves.length)return s.turn==='b'?-500000:500000;if(depth<=0)return checkersEval(s);const max=s.turn==='b';let best=max?-Infinity:Infinity;for(const seq of moves){let n=cloneCheckers(s);for(const m of seq)n=applyCheckerStep(n,m);n.turn=max?'r':'b';const v=checkersSearch(n,depth-1,alpha,beta);if(max){best=Math.max(best,v);alpha=Math.max(alpha,best);}else{best=Math.min(best,v);beta=Math.min(beta,best);}if(beta<=alpha)break;}return best;}
  function bestCheckersSequence(s,depth){const moves=allTurnCheckersSequences(s,'b');if(!moves.length)return null;if(depth<=1)return moves[Math.floor(Math.random()*moves.length)];let best=-Infinity,choice=moves[0];for(const seq of moves){let n=cloneCheckers(s);for(const m of seq)n=applyCheckerStep(n,m);n.turn='r';const v=checkersSearch(n,depth-1,-Infinity,Infinity);if(v>best){best=v;choice=seq;}}return choice;}
  function humanCheckersSequences(from){return allTurnCheckersSequences(checkers.state,'r').filter(seq=>seq[0].from===from);}
  function checkersRender(){
    const board=document.getElementById('checkers-board');if(!board||!checkers.state)return;board.innerHTML='';const forcedCapture=checkers.mustContinue!==null;const options=checkers.selected!==null?(forcedCapture?checkersCaptureSteps(checkers.state,checkers.selected,'r').map(step=>[step]):humanCheckersSequences(checkers.selected)):[];const targetMap=new Map(options.map(seq=>[seq[0].to,seq[0].capture!==undefined]));
    for(let i=0;i<64;i++){const sq=document.createElement('button');sq.type='button';const [r,c]=rc(i);sq.className=`square ${(r+c)%2?'dark':'light'}`;sq.setAttribute('role','gridcell');sq.setAttribute('aria-label',`Case ${String.fromCharCode(97+c)}${8-r}`);if((r+c)%2===0)sq.disabled=true;if(i===checkers.selected)sq.classList.add('selected');if(targetMap.has(i))sq.classList.add(targetMap.get(i)?'capture':'legal');const p=checkers.state.board[i];if(p){const disk=document.createElement('span');disk.className=`checker-piece ${p.color==='r'?'red':'black'} ${p.king?'king':''}`;sq.appendChild(disk);}sq.addEventListener('click',()=>checkersClick(i));board.appendChild(sq);}
  }
  function checkersClick(i){
    if(checkers.gameOver||checkers.state.turn!=='r')return;const p=checkers.state.board[i];
    if(checkers.mustContinue!==null&&i!==checkers.mustContinue){if(p?.color==='r'&&i!==checkers.mustContinue)Babi.toast('👑 Continuez la rafle avec la même pièce');return;}
    if(checkers.selected===null){if(p?.color==='r'){const choices=humanCheckersSequences(i);if(choices.length){checkers.selected=i;checkersRender();Babi.vibrate(12);}else Babi.toast('Cette pièce n’a aucun coup légal');}return;}
    if(i===checkers.selected){if(checkers.mustContinue===null){checkers.selected=null;checkersRender();}return;}
    if(p?.color==='r'&&checkers.mustContinue===null){checkers.selected=i;checkersRender();return;}
    const seq=checkers.mustContinue!==null?checkersCaptureSteps(checkers.state,checkers.selected,'r').find(step=>step.to===i):humanCheckersSequences(checkers.selected).find(x=>x[0].to===i);if(!seq){Babi.toast('Coup illégal');return;}makeCheckersHuman(Array.isArray(seq)?seq[0]:seq);
  }
  function checkersScore(add){checkers.score=Math.max(0,checkers.score+(Number(add)||0));document.getElementById('checkers-score').textContent=checkers.score;if(checkers.score>checkers.best){checkers.best=Babi.setBest('checkers',checkers.score);document.getElementById('checkers-highscore').textContent=checkers.best;}}
  function startCheckersTimer(){clearInterval(checkers.timer);checkers.timeLeft=LEVELS[checkers.level].seconds;document.getElementById('checkers-timer').textContent=checkers.timeLeft;checkers.timer=setInterval(()=>{if(checkers.gameOver||checkers.state?.turn!=='r'){clearInterval(checkers.timer);return;}checkers.timeLeft--;document.getElementById('checkers-timer').textContent=checkers.timeLeft;if(checkers.timeLeft<=0){clearInterval(checkers.timer);checkers.state.turn='b';checkers.selected=null;checkers.mustContinue=null;checkersRender();document.getElementById('checkers-status').textContent='⏱️ Temps écoulé';Babi.vibrate(150);startCheckersAI();}},1000);}
  function finishCheckers(title,text,won,emoji){checkers.gameOver=true;clearInterval(checkers.timer);clearTimeout(checkers.aiTimer);clearTimeout(checkers.aiStepTimer);if(won){checkers.best=Babi.setBest('checkers',checkers.score);document.getElementById('checkers-highscore').textContent=checkers.best;}Babi.win('checkers',title,text,emoji);}
  function startCheckersAI(){clearInterval(checkers.timer);clearTimeout(checkers.aiTimer);document.getElementById('checkers-status').textContent='🤖 IA en réflexion…';checkers.state.turn='b';checkers.aiTimer=setTimeout(playCheckersAI,LEVELS[checkers.level].aiDelay);}
  function makeCheckersHuman(step){
    clearInterval(checkers.timer);const wasKing=!!checkers.state.board[step.from]?.king;checkers.state=applyCheckerStep(checkers.state,step);checkers.selected=step.to;checkersScore(10);if(step.capture!==undefined)checkersScore(100);if(!wasKing&&checkers.state.board[step.to]?.king)checkersScore(60);checkersRender();
    const opponentMoves=allTurnCheckersSequences(checkers.state,'b');if(!opponentMoves.length){checkersScore(500);finishCheckers('DAMIER DOMINÉ !',`Victoire • Score ${checkers.score}`,true,'👑');return;}
    const more=step.capture!==undefined?checkersCaptureSteps(checkers.state,step.to,'r'):[];if(step.capture!==undefined&&more.length){checkers.mustContinue=step.to;checkers.selected=step.to;document.getElementById('checkers-status').textContent='🔥 Rafle continue — choisissez la deuxième prise';checkersRender();startCheckersTimer();return;}
    checkers.selected=null;checkers.mustContinue=null;checkers.state.turn='b';checkersRender();startCheckersAI();
  }
  function playCheckersAI(){
    if(checkers.gameOver||checkers.state?.turn!=='b')return;const seq=bestCheckersSequence(checkers.state,LEVELS[checkers.level].checkersDepth);if(!seq){finishCheckers('VOUS AVEZ GAGNÉ !',`Victoire • Score ${checkers.score}`,true,'🏆');return;}
    let i=0;const doStep=()=>{if(checkers.gameOver)return;if(i>=seq.length){checkers.state.turn='r';checkers.selected=null;checkers.mustContinue=null;document.getElementById('checkers-status').textContent='À votre tour';checkersRender();startCheckersTimer();return;}const step=seq[i++];checkers.state=applyCheckerStep(checkers.state,step);checkersRender();const target=document.querySelector(`#checkers-board .square:nth-child(${step.to+1}) .checker-piece`);target?.classList.add('ai-moving');if(i<seq.length)checkers.aiStepTimer=setTimeout(doStep,210);else{const end=allTurnCheckersSequences(checkers.state,'r');if(!end.length){finishCheckers('PARTIE TERMINÉE',`L’IA gagne • Score ${checkers.score}`,false,'🤖');return;}checkers.aiStepTimer=setTimeout(doStep,150);}};doStep();
  }
  function initCheckers(){clearInterval(checkers.timer);clearTimeout(checkers.aiTimer);clearTimeout(checkers.aiStepTimer);checkers.state=initialCheckers();checkers.selected=null;checkers.mustContinue=null;checkers.gameOver=false;checkers.score=0;document.getElementById('checkers-score').textContent='0';document.getElementById('checkers-highscore').textContent=checkers.best;document.getElementById('checkers-status').textContent=`${LEVELS[checkers.level].label} • À votre tour`;checkersRender();startCheckersTimer();}

  document.addEventListener('start-chess',initChess);document.addEventListener('stop-chess',()=>{clearInterval(chess.timer);clearTimeout(chess.aiTimer);clearTimeout(chess.aiStepTimer);chess.gameOver=true;});
  document.addEventListener('start-checkers',initCheckers);document.addEventListener('stop-checkers',()=>{clearInterval(checkers.timer);clearTimeout(checkers.aiTimer);clearTimeout(checkers.aiStepTimer);checkers.gameOver=true;});
  document.addEventListener('set-level-chess',e=>{if(LEVELS[e.detail.level]){chess.level=e.detail.level;initChess();}});
  document.addEventListener('set-level-checkers',e=>{if(LEVELS[e.detail.level]){checkers.level=e.detail.level;initCheckers();}});
  document.getElementById('chess-reset')?.addEventListener('click',initChess);
  document.getElementById('checkers-reset')?.addEventListener('click',initCheckers);
})();
