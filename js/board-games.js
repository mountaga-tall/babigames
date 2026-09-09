let draggedPiece = null;
let touchOffsetX = 0; let touchOffsetY = 0;
let isAiThinking = false;
let startSquare = null;

function getPos(square) {
    const idx = Array.from(square.parentElement.children).indexOf(square);
    return { r: Math.floor(idx / 8), c: idx % 8 };
}

// Validation Stricte des Échecs
function isValidChessMove(piece, startSq, endSq) {
    const start = getPos(startSq); const end = getPos(endSq);
    const dr = end.r - start.r; const dc = end.c - start.c;
    const type = piece.innerHTML; const isWhite = piece.classList.contains('white-piece');
    const dir = isWhite ? -1 : 1;
    
    if (endSq.firstChild && endSq.firstChild.classList.contains(isWhite ? 'white-piece' : 'black-piece')) return false;

    // Collisions (sauf Cavalier)
    if (!['♞','♘'].includes(type)) {
        const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
        const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
        let cr = start.r + stepR; let cc = start.c + stepC;
        while(cr !== end.r || cc !== end.c) {
            if (startSq.parentElement.children[cr*8+cc].firstChild) return false;
            cr += stepR; cc += stepC;
        }
    }

    if (['♙','♟'].includes(type)) { // Pions
        if (dc === 0 && !endSq.firstChild) {
            if (dr === dir) return true;
            if (dr === 2*dir && start.r === (isWhite ? 6 : 1)) return true;
        } else if (Math.abs(dc) === 1 && dr === dir && endSq.firstChild) return true;
        return false;
    }
    if (['♖','♜'].includes(type)) return dr === 0 || dc === 0;
    if (['♝','♗'].includes(type)) return Math.abs(dr) === Math.abs(dc);
    if (['♛','♕'].includes(type)) return (dr === 0 || dc === 0) || (Math.abs(dr) === Math.abs(dc));
    if (['♚','♔'].includes(type)) return Math.abs(dr) <= 1 && Math.abs(dc) <= 1;
    if (['♞','♘'].includes(type)) return (Math.abs(dr)===2 && Math.abs(dc)===1) || (Math.abs(dr)===1 && Math.abs(dc)===2);
    return false;
}

// Validation Stricte des Dames (Avec sauts obligatoires)
function isValidCheckersMove(piece, startSq, endSq) {
    const start = getPos(startSq); const end = getPos(endSq);
    const dr = end.r - start.r; const dc = end.c - start.c;
    const isRed = piece.classList.contains('red');
    const isKing = piece.classList.contains('king');
    const dir = isRed ? -1 : 1;

    if (endSq.firstChild) return false;
    if (start.r % 2 === start.c % 2) return false; // Seulement cases foncées

    // Mouvement simple
    if ((dr === dir || (isKing && Math.abs(dr) === 1)) && Math.abs(dc) === 1) return true;
    
    // Saut (Capture)
    if ((dr === 2*dir || (isKing && Math.abs(dr) === 2)) && Math.abs(dc) === 2) {
        const midR = start.r + dr/2; const midC = start.c + dc/2;
        const midSq = startSq.parentElement.children[midR*8 + midC];
        if (midSq.firstChild && !midSq.firstChild.classList.contains(isRed ? 'red' : 'black')) {
            midSq.firstChild.classList.add('dead'); // Marque pour suppression
            return true;
        }
    }
    return false;
}

function enableDragAndDrop(containerId) {
    const container = document.getElementById(containerId);
    
    container.addEventListener('touchstart', (e) => {
        if(isAiThinking) return;
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        
        if(target && (target.classList.contains('piece') || target.classList.contains('checker'))){
            if(!(target.classList.contains('white-piece') || target.classList.contains('red'))) return; 
            
            draggedPiece = target;
            startSquare = draggedPiece.parentElement;
            const rect = draggedPiece.getBoundingClientRect();
            touchOffsetX = touch.clientX - rect.left; touchOffsetY = touch.clientY - rect.top;
            
            draggedPiece.style.position = 'fixed'; draggedPiece.style.zIndex = '1000';
            draggedPiece.style.transform = 'scale(1.3)'; draggedPiece.style.pointerEvents = 'none'; 
            
            if(navigator.vibrate) navigator.vibrate(15);
            e.preventDefault();
        }
    }, {passive: false});

    container.addEventListener('touchmove', (e) => {
        if(!draggedPiece) return;
        draggedPiece.style.left = (e.touches[0].clientX - touchOffsetX) + 'px';
        draggedPiece.style.top = (e.touches[0].clientY - touchOffsetY) + 'px';
        e.preventDefault();
    }, {passive: false});

    container.addEventListener('touchend', (e) => {
        if(!draggedPiece) return;
        draggedPiece.style.position = ''; draggedPiece.style.zIndex = '';
        draggedPiece.style.transform = ''; draggedPiece.style.pointerEvents = 'auto';
        
        const targetSquare = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        let actualSq = targetSquare?.classList.contains('square') ? targetSquare : targetSquare?.parentElement;
        
        let isValid = false;
        if(actualSq && actualSq.classList.contains('square')) {
            isValid = containerId === 'chess-board' ? isValidChessMove(draggedPiece, startSquare, actualSq) : isValidCheckersMove(draggedPiece, startSquare, actualSq);
        }

        if (isValid) {
            if(actualSq.firstChild) actualSq.removeChild(actualSq.firstChild); // Capture Echecs
            
            // Capture Dames
            const deadPieces = document.querySelectorAll('.dead');
            deadPieces.forEach(p => p.parentElement.removeChild(p));
            
            actualSq.appendChild(draggedPiece);
            
            // Promotion Dames
            if(containerId === 'checkers-board' && getPos(actualSq).r === 0) draggedPiece.classList.add('king');

            isAiThinking = true; document.querySelector('.hint').innerText = "L'IA réfléchit...";
            setTimeout(() => { containerId === 'chess-board' ? playChessAI() : playCheckersAI(); }, 500);
        } else {
            startSquare.appendChild(draggedPiece); // Retour à la case départ
        }
        draggedPiece = null;
    });

    // Support PC Drag&Drop (Simplifié avec validation)
    container.addEventListener('dragstart', (e) => {
        if(isAiThinking || !(e.target.classList.contains('white-piece') || e.target.classList.contains('red'))) return e.preventDefault();
        draggedPiece = e.target; startSquare = draggedPiece.parentElement;
    });
    container.addEventListener('dragover', (e) => e.preventDefault());
    container.addEventListener('drop', (e) => {
        e.preventDefault();
        let actualSq = e.target.classList.contains('square') ? e.target : e.target.parentElement;
        if(!actualSq || !actualSq.classList.contains('square')) return;
        
        let isValid = containerId === 'chess-board' ? isValidChessMove(draggedPiece, startSquare, actualSq) : isValidCheckersMove(draggedPiece, startSquare, actualSq);
        if (isValid) {
            if(actualSq.firstChild) actualSq.removeChild(actualSq.firstChild);
            const deadPieces = document.querySelectorAll('.dead');
            deadPieces.forEach(p => p.parentElement.removeChild(p));
            actualSq.appendChild(draggedPiece);
            if(containerId === 'checkers-board' && getPos(actualSq).r === 0) draggedPiece.classList.add('king');
            
            isAiThinking = true; document.querySelector('.hint').innerText = "L'IA réfléchit...";
            setTimeout(() => { containerId === 'chess-board' ? playChessAI() : playCheckersAI(); }, 500);
        }
    });
}

function executeAIMove(piece, targetSquare, isCheckers = false) {
    piece.classList.add('ai-moving');
    
    if(targetSquare.firstChild && !isCheckers) targetSquare.removeChild(targetSquare.firstChild);
    if(isCheckers) {
        const deadPieces = document.querySelectorAll('.dead');
        deadPieces.forEach(p => p.parentElement.removeChild(p));
        if(getPos(targetSquare).r === 7) piece.classList.add('king');
    }
    
    targetSquare.appendChild(piece);
    piece.classList.remove('ai-moving');
    isAiThinking = false; document.querySelector('.hint').innerText = "À votre tour !";
}

function playChessAI() {
    const board = document.getElementById('chess-board');
    const aiPieces = Array.from(board.querySelectorAll('.black-piece'));
    const allSquares = Array.from(board.querySelectorAll('.square'));
    
    let validMoves = [];
    aiPieces.forEach(piece => {
        allSquares.forEach(sq => {
            if(isValidChessMove(piece, piece.parentElement, sq)) validMoves.push({piece, target: sq});
        });
    });

    if(validMoves.length > 0) {
        let captures = validMoves.filter(m => m.target.firstChild);
        let move = captures.length > 0 ? captures[0] : validMoves[Math.floor(Math.random() * validMoves.length)];
        executeAIMove(move.piece, move.target);
    } else { isAiThinking = false; document.querySelector('.hint').innerText = "Échec et Mat !"; }
}

function playCheckersAI() {
    const board = document.getElementById('checkers-board');
    const aiPieces = Array.from(board.querySelectorAll('.checker.black'));
    const allSquares = Array.from(board.querySelectorAll('.square'));
    
    let validMoves = []; let jumps = [];
    aiPieces.forEach(piece => {
        allSquares.forEach(sq => {
            if(isValidCheckersMove(piece, piece.parentElement, sq)) {
                document.querySelectorAll('.dead').length > 0 ? jumps.push({piece, target: sq}) : validMoves.push({piece, target: sq});
                document.querySelectorAll('.dead').forEach(d => d.classList.remove('dead')); // Reset virtual state
            }
        });
    });

    let moveList = jumps.length > 0 ? jumps : validMoves;
    if(moveList.length > 0) {
        let move = moveList[Math.floor(Math.random() * moveList.length)];
        isValidCheckersMove(move.piece, move.piece.parentElement, move.target); // Re-apply virtual state
        executeAIMove(move.piece, move.target, true);
    } else { isAiThinking = false; document.querySelector('.hint').innerText = "Vous avez gagné !"; }
}

function initBoard(containerId, isChess) {
    const board = document.getElementById(containerId); board.innerHTML = '';
    const initialChess = ['♜','♞','♝','♛','♚','♝','♞','♜', '♟','♟','♟','♟','♟','♟','♟','♟', '','','','','','','','', '','','','','','','','', '','','','','','','','', '','','','','','','','', '♙','♙','♙','♙','♙','♙','♙','♙', '♖','♘','♗','♕','♔','♗','♘','♖'];
    
    for(let i=0; i<64; i++) {
        const sq = document.createElement('div');
        const row = Math.floor(i / 8); const col = i % 8;
        sq.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
        
        if (isChess && initialChess[i]) {
            const piece = document.createElement('div');
            piece.className = `piece ${i < 16 ? 'black-piece' : 'white-piece'}`;
            piece.innerHTML = initialChess[i]; piece.draggable = i >= 48; // Blancs draggables
            sq.appendChild(piece);
        } else if (!isChess && (row + col) % 2 !== 0) {
            if (row < 3) { const checker = document.createElement('div'); checker.className = 'piece checker black'; checker.draggable = false; sq.appendChild(checker); } 
            else if (row > 4) { const checker = document.createElement('div'); checker.className = 'piece checker red'; checker.draggable = true; sq.appendChild(checker); }
        }
        board.appendChild(sq);
    }
    enableDragAndDrop(containerId);
}

document.addEventListener('start-chess', () => { isAiThinking = false; initBoard('chess-board', true); });
document.addEventListener('start-checkers', () => { isAiThinking = false; initBoard('checkers-board', false); });
