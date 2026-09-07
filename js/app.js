const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const games=[
 {id:"chess",icon:"♟",name:"Échecs",desc:"Stratégie classique, duel local."},
 {id:"checkers",icon:"●",name:"Dames",desc:"Prends tout avant ton adversaire."},
 {id:"snake",icon:"🐍",name:"Snake",desc:"Mange, grandis, bats ton record."},
 {id:"minesweeper",icon:"💣",name:"Démineur",desc:"Révèle les cases sans exploser."}
];
let currentUser=localStorage.getItem("bg_current");
function users(){return JSON.parse(localStorage.getItem("bg_users")||"{}")}
function saveUsers(x){localStorage.setItem("bg_users",JSON.stringify(x))}
function toast(t){let e=$("#toast");e.textContent=t;e.className="show";setTimeout(()=>e.className="",2200)}
function showAuth(login=true){$("#auth").classList.remove("hidden");$("#app").classList.add("hidden");$("#loginForm").classList.toggle("hidden",!login);$("#signupForm").classList.toggle("hidden",login);$("#tabLogin").classList.toggle("active",login);$("#tabSignup").classList.toggle("active",!login)}
function enterApp(){if(!currentUser)return;$("#auth").classList.add("hidden");$("#app").classList.remove("hidden");$("#navUser").textContent=currentUser;$("#avatar").textContent=currentUser[0].toUpperCase();renderCards();renderProfile();showView("home")}
function showView(v){
 $$(".view").forEach(x=>x.classList.add("hidden")); $(`#${v}View`).classList.remove("hidden");
 $$(".nav").forEach(x=>x.classList.toggle("active",x.dataset.view===v));
 window.scrollTo(0,0);
}
function renderCards(){
 const html=games.map(g=>`<button class="game-card" data-game="${g.id}"><div class="game-icon">${g.icon}</div><h3>${g.name}</h3><p>${g.desc}</p><span class="play">→</span></button>`).join("");
 $("#homeGames").innerHTML=html;$("#allGames").innerHTML=html;
 $$(".game-card").forEach(b=>b.onclick=()=>startGame(b.dataset.game));
}
function getMe(){let u=users();return u[currentUser]}
function renderProfile(){
 let me=getMe()||{scores:{}};$("#profileName").textContent=currentUser;$("#profileAvatar").textContent=currentUser[0].toUpperCase();
 let scores=me.scores||{};let total=Object.values(scores).reduce((a,b)=>a+b,0);
 $("#stats").innerHTML=`<div class="stat"><b>${total}</b><span>Score total</span></div><div class="stat"><b>${games.length}</b><span>Jeux disponibles</span></div><div class="stat"><b>∞</b><span>Parties possibles</span></div>`;
 $("#scoreList").innerHTML=games.map(g=>`<div class="score-row"><span>${g.icon} ${g.name}</span><b>${scores[g.id]||0}</b></div>`).join("");
}
function setScore(game,score){let u=users();if(!u[currentUser])return;if(score>(u[currentUser].scores[game]||0)){u[currentUser].scores[game]=score;saveUsers(u);renderProfile();toast("🏆 Nouveau record !")}}
function startGame(id){showView("game");let g=games.find(x=>x.id===id);$("#gameTitle").textContent=g.name;$("#gameEyebrow").textContent="GAME CENTER";$("#gameScore").textContent="Score 0";GameEngine[id]($("#gameMount"),score=>$("#gameScore").textContent="Score "+score, s=>setScore(id,s))}
$("#tabLogin").onclick=()=>showAuth(true);$("#tabSignup").onclick=()=>showAuth(false);
$("#loginForm").onsubmit=e=>{e.preventDefault();let u=$("#loginUser").value.trim(),p=$("#loginPass").value,x=users();if(x[u]&&x[u].password===p){currentUser=u;localStorage.setItem("bg_current",u);$("#authMsg").textContent="";enterApp()}else $("#authMsg").textContent="Pseudo ou mot de passe incorrect."};
$("#signupForm").onsubmit=e=>{e.preventDefault();let u=$("#signupUser").value.trim(),p=$("#signupPass").value,x=users();if(x[u])return $("#authMsg").textContent="Ce pseudo existe déjà.";x[u]={password:p,scores:{}};saveUsers(x);currentUser=u;localStorage.setItem("bg_current",u);enterApp()};
$("#logout").onclick=()=>{localStorage.removeItem("bg_current");currentUser=null;showAuth(true);toast("À bientôt 👋")};
$$("[data-view]").forEach(b=>b.onclick=()=>showView(b.dataset.view));
$("#backGames").onclick=()=>showView("games");
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js").catch(()=>{}));
if(currentUser)enterApp();else showAuth(true);
