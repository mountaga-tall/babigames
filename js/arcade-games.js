// Extrait corrigé pour arcade-games.js -> Remplacer la fonction c4AI existante
  function c4AI(){
    if(!c4.playing)return;
    let options=[];
    for(let c=0;c<7;c++){
        if(c4.board[c])continue;
        const clone=[...c4.board];
        const i=c4Drop(c,2);
        const w=c4Winner();
        c4.board=clone;
        if(w?.p===2){options=[c];break}
    }
    if(!options.length){
        for(let c=0;c<7;c++){
            if(c4.board[c])continue;
            const clone=[...c4.board];
            c4Drop(c,1);
            const w=c4Winner();
            c4.board=clone;
            if(w?.p===1){options=[c];break}
        }
    }
    if(!options.length){
        for(let i=0;i<7;i++)if(!c4.board[i])options.push(i);
        options.sort((a,b)=>Math.abs(3-a)-Math.abs(3-b));
        if(options.length>1)options=options.slice(0,Math.min(3,options.length));
    }
    // Correction du bug d'affectation : l'IA choisit maintenant correctement son coup
    const col = options.length ? options[Math.floor(Math.random() * options.length)] : 3;
    
    c4Drop(col,2);
    c4Render();
    if(c4Finish())return;
    c4.turn=1;
    document.getElementById('connect4-status').textContent='À vous';
  }
