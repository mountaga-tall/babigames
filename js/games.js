const GameEngine={};

GameEngine.snake=(mount,onScore,record)=>{
 let n=20,dir={x:1,y:0},next=dir,snake=[{x:10,y:10},{x:9,y:10}],food={x:15,y:10},score=0,running=true;
 mount.innerHTML=`<div class="snake-wrap"><div id="snakeBoard" class="snake-board"></div><div class="hint">Flèches / WASD • Espace pour pause</div><div class="game-controls"><button id="snakeStart">Recommencer</button></div></div>`;
 const board=$("#snakeBoard");function spawn(){do{food={x:Math.floor(Math.random()*n),y:Math.floor(Math.random()*n)}}while(snake.some(s=>s.x===food.x&&s.y===food.y))}
 function draw(){board.innerHTML="";for(let y=0;y<n;y++)for(let x=0;x<n;x++){let d=document.createElement("div");d.className="snake-cell";if(snake.some(s=>s.x===x&&s.y===y))d.classList.add("snake");if(food.x===x&&food.y===y)d.classList.add("food");board.appendChild(d)}onScore(score)}
 function reset(){dir={x:1,y:0};next=dir;snake=[{x:10,y:10},{x:9,y:10}];score=0;running=true;spawn();draw()}
 function tick(){if(!running)return;dir=next;let h={x:snake[0].x+dir.x,y:snake[0].y+dir.y};if(h.x<0||h.x>=n||h.y<0||h.y>=n||snake.some(s=>s.x===h.x&&s.y===h.y)){running=false;record(score);toast("💥 Game over — "+score);return}snake.unshift(h);if(h.x===food.x&&h.y===food.y){score+=10;spawn()}else snake.pop();draw()}
 function key(e){let k=e.key.toLowerCase();if((k==="arrowup"||k==="w")&&dir.y!==1)next={x:0,y:-1};if((k==="arrowdown"||k==="s")&&dir.y!==-1)next={x:0,y:1};if((k==="arrowleft"||k==="a")&&dir.x!==1)next={x:-1,y:0};if((k==="arrowright"||k==="d")&&dir.x!==-1)next={x:1,y:0};if(k===" ")running=!running}
 document.onkeydown=key;$("#snakeStart").onclick=reset;reset();let timer=setInterval(tick,115);
};

GameEngine.minesweeper=(mount,onScore,record)=>{
 let N=10,mines=15,opened=0,score=0,over=false,first=true,grid=[];
 mount.innerHTML=`<div class="mine-wrap"><div id="mineBoard" class="mines"></div><div class="hint">Clic gauche : révéler • Clic droit : drapeau</div><div class="game-controls"><button id="mineReset">Nouvelle partie</button></div></div>`;
 const board=$("#mineBoard");
 function build(){grid=Array.from({length:N*N},()=>({m:false,o:false,f:false,n:0}));let ids=[...Array(N*N).keys()];for(let i=ids.length-1;i;i--){let j=Math.floor(Math.random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]]}ids.slice(0,mines).forEach(i=>grid[i].m=true);for(let i=0;i<N*N;i++){let x=i%N,y=Math.floor(i/N);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){let xx=x+dx,yy=y+dy;if(xx>=0&&xx<N&&yy>=0&&yy<N&&grid[yy*N+xx].m)grid[i].n++}}opened=0;score=0;over=false;draw()}
 function reveal(i){if(over||grid[i].f||grid[i].o)return;if(grid[i].m){over=true;grid.forEach(c=>{if(c.m)c.o=true});draw();record(score);toast("💣 BOOM !");return}grid[i].o=true;opened++;score+=5;if(grid[i].n===0){let x=i%N,y=Math.floor(i/N);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){let xx=x+dx,yy=y+dy;if(xx>=0&&xx<N&&yy>=0&&yy<N)reveal(yy*N+xx)}}if(opened===N*N-mines){over=true;score+=100;record(score);toast("🏆 Champ !")}draw()}
 function draw(){board.innerHTML="";grid.forEach((c,i)=>{let b=document.createElement("button");b.className="mine-cell"+(c.o?" open":"")+(c.f?" flag":"");b.textContent=c.f&&!c.o?"⚑":c.o?(c.m?"💣":c.n||""):"";b.onclick=()=>reveal(i);b.oncontextmenu=e=>{e.preventDefault();if(!c.o&&!over){c.f=!c.f;draw()}};board.appendChild(b)});onScore(score)}
 $("#mineReset").onclick=build;build();
};

GameEngine.checkers=(mount,onScore,record)=>{
 let board=Array(64).fill(null);for(let y=0;y<3;y++)for(let x=0;x<8;x++)if((x+y)%2)board[y*8+x]="b";for(let y=5;y<8;y++)for(let x=0;x<8;x++)if((x+y)%2)board[y*8+x]="r";let selected=-1,turn="r",score=0;
 mount.innerHTML=`<div class="checkers-wrap"><div id="checkBoard" class="checkers-board board"></div><div class="hint">Démo jouable : sélectionne une pièce et une case diagonale.</div><button id="checkReset" class="ghost">Recommencer</button></div>`;const el=$("#checkBoard");
 function draw(){el.innerHTML="";for(let i=0;i<64;i++){let c=document.createElement("div");c.className="cell "+(((Math.floor(i/8)+i)%2)?"dark":"light");c.onclick=()=>click(i);let p=board[i];if(p){let q=document.createElement("div");q.className="piece "+(p[0]==="r"?"red":"black")+(p.length>1?" king":"");c.appendChild(q)}if(i===selected)c.classList.add("selected");el.appendChild(c)}onScore(score)}
 function click(i){if(selected<0){if(board[i]?.[0]===turn)selected=i;draw();return}let sx=selected%8,sy=Math.floor(selected/8),tx=i%8,ty=Math.floor(i/8),dx=tx-sx,dy=ty-sy;if(!board[i]&&Math.abs(dx)===1&&Math.abs(dy)===1&&((turn==="r"&&dy===-1)||(turn==="b"&&dy===1)||board[selected].length>1)){board[i]=board[selected];board[selected]=null;selected=-1;turn=turn==="r"?"b":"r";score+=1}else if(board[i]?.[0]===turn)selected=i;else selected=-1;draw()}
 $("#checkReset").onclick=()=>{board.fill(null);for(let y=0;y<3;y++)for(let x=0;x<8;x++)if((x+y)%2)board[y*8+x]="b";for(let y=5;y<8;y++)for(let x=0;x<8;x++)if((x+y)%2)board[y*8+x]="r";selected=-1;turn="r";score=0;draw()};draw();
};

GameEngine.chess=(mount,onScore,record)=>{
 const back={};let pieces=["♜","♞","♝","♛","♚","♝","♞","♜","♟","♟","♟","♟","♟","♟","♟","♟",...Array(32).fill(""),"♙","♙","♙","♙","♙","♙","♙","♙","♖","♘","♗","♕","♔","♗","♘","♖"];let sel=-1,score=0;
 mount.innerHTML=`<div class="checkers-wrap"><div id="chessBoard" class="chess-board board"></div><div class="hint">Mode local : déplace les pièces librement pour tester le plateau.</div><button id="chessReset" class="ghost">Nouvelle partie</button></div>`;let el=$("#chessBoard");
 function draw(){el.innerHTML="";pieces.forEach((p,i)=>{let c=document.createElement("div");c.className="cell "+(((Math.floor(i/8)+i)%2)?"dark":"light");c.textContent=p;c.onclick=()=>click(i);if(i===sel)c.classList.add("selected");el.appendChild(c)});onScore(score)}
 function click(i){if(sel<0&&pieces[i]){sel=i;draw();return}if(sel>=0){if(i!==sel){pieces[i]=pieces[sel];pieces[sel]="";score++;sel=-1;record(score)}else sel=-1;draw()}}
 $("#chessReset").onclick=()=>{pieces=["♜","♞","♝","♛","♚","♝","♞","♜","♟","♟","♟","♟","♟","♟","♟","♟",...Array(32).fill(""),"♙","♙","♙","♙","♙","♙","♙","♙","♖","♘","♗","♕","♔","♗","♘","♖"];sel=-1;score=0;draw()};draw();
};
