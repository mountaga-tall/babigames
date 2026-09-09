// --- Drag and Drop, Touch Logic & IA ---
let draggedPiece = null;
let touchOffsetX = 0;
let touchOffsetY = 0;
let isAiThinking = false;

// Vérifie si la pièce appartient au joueur
function isPlayerPiece(element) {
    return element.classList.contains('white-piece') || element.classList.contains('red');
}

function enableDragAndDrop(containerId) {
    const container = document.getElementById(containerId);
    
    // Support PC
    container.addEventListener('dragstart', (e) => {
        if(isAiThinking) { e.preventDefault(); return; }
        if((e.target.classList.contains('piece') || e.target.classList.contains('checker')) && isPlayerPiece(e.target)){
            draggedPiece = e.target;
            if(navigator.vibrate) navigator.vibrate(15);
        } else {
            e.preventDefault(); // Empêche de bouger l'IA
        }
    });

    container.addEventListener('dragover', (e) => e.preventDefault());
    container.addEventListener('drop', (e) => {
        e.preventDefault();
        handleDrop(e.target, containerId);
    });

    // Support Mobile Touch
    container.addEventListener('touchstart', (e) => {
        if(isAiThinking) return;
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        
        if(target && (target.classList.contains('piece') || target.classList.contains('checker'))){
            if(!isPlayerPiece(target)) return; // Empêche de toucher les pièces IA
            
            draggedPiece = target;
            const rect = draggedPiece.getBoundingClientRect();
            touchOffsetX = touch.clientX - rect.left;
            touchOffsetY = touch.clientY - rect.top;
            
            draggedPiece.style.position = 'fixed';
            draggedPiece.style.zIndex = '1000';
            draggedPiece.style.transform = 'scale(1.3)'; 
            draggedPiece.style.pointerEvents = 'none'; 
            movePiece(touch.clientX, touch.clientY);
            
            if(navigator.vibrate) navigator.vibrate(15);
            e.preventDefault();
        }
    }, {passive: false});

    container.addEventListener('touchmove', (e) => {
        if(!draggedPiece) return;
        const touch = e.touches[0];
        movePiece(touch.clientX, touch.clientY);
        e.preventDefault();
    }, {passive: false});

    container.addEventListener('touchend', (e) => {
        if(!draggedPiece) return;
        const touch = e.changedTouches[0];
        
        draggedPiece.style.position = '';
        draggedPiece.style.zIndex = '';
        draggedPiece.style.transform = '';
        draggedPiece.style.pointerEvents = 'auto';
        
        const targetSquare = document.elementFromPoint(touch.clientX, touch.clientY);
        handleDrop(targetSquare, containerId);
        draggedPiece = null;
    });

    function movePiece(x, y) {
        draggedPiece.style.left = (x - touchOffsetX) + 'px';
        draggedPiece.style.top = (y - touchOffsetY) + 'px';
    }

    function handleDrop(target, boardId) {
        if(!target || !draggedPiece) return;
        let targetSquare = target.classList.contains('square') ? target : target.parentElement;
        
        if (targetSquare && targetSquare.classList.contains('square')) {
            // Empêche de manger ses propres pièces
            if(targetSquare.firstChild && isPlayerPiece(targetSquare.firstChild)) return;

            if(targetSquare.firstChild && targetSquare.firstChild !== draggedPiece) {
                targetSquare.removeChild(targetSquare.firstChild);
                if(navigator.vibrate) navigator.vibrate([30, 30]); 
                targetSquare.style.boxShadow = "inset 0 0 20px rgba(0, 242, 254, 0.7)"; 
                setTimeout(() => targetSquare.style.boxShadow = "", 300);
            } else {
                if(navigator.vibrate) navigator.vibrate(20);
            }
            targetSquare.appendChild(draggedPiece);

            // Déclenche le tour de l'IA
            isAiThinking = true;
            document.querySelector('.hint').innerText = "L'IA réfléchit...";
            setTimeout(() => {
                if(boardId === 'chess-board') playChessAI();
                else playCheckersAI();
            }, 800);
        }
    }
}

// --- Intelligence Artificielle (Wow Effect Animation) ---
function animateAIMove(piece, targetSquare) {
    const rect1 = piece.getBoundingClientRect();
    const rect2 = targetSquare.getBoundingClientRect();
    const tx = rect2.left - rect1.left;
    const ty = rect2.top - rect1.top;
    
    piece.classList.add('ai-moving');
    piece.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)';
    piece.style.transform = `translate(${tx}px, ${ty}px) scale(1.2)`;
    
    setTimeout(() => {
        piece.classList.remove('ai-moving');
        piece.style.transition = '';
        piece.style.transform = '';
        
        if(targetSquare.firstChild) {
            targetSquare.removeChild(targetSquare.firstChild);
            if(navigator.vibrate) navigator.vibrate([50, 50]); // IA capture haptic
            targetSquare.style.boxShadow = "inset 0 0 20px rgba(255, 71, 87, 0.8)"; // Rouge sang
            setTimeout(() => targetSquare.style.boxShadow = "", 300);
        } else {
            if(navigator.vibrate) navigator.vibrate(30);
        }
        
        targetSquare.appendChild(piece);
        isAiThinking = false;
        document.querySelector('.hint').innerText = "À votre tour !";
    }, 500);
}

function playChessAI() {
    const board = document.getElementById('chess-board');
    const aiPieces = Array.from(board.querySelectorAll('.black-piece'));
    if(aiPieces.length === 0) return;

    const allSquares = Array.from(board.querySelectorAll('.square'));
    
    // Filtre les pièces de l'IA qui ont des mouvements valides vers l'avant (vers le bas)
    let validMoves = [];
    aiPieces.forEach(piece => {
        const currentIndex = allSquares.indexOf(piece.parentElement);
        const r1 = Math.floor(currentIndex / 8);
        const c1 = currentIndex % 8;

        allSquares.forEach((sq, idx) => {
            const r2 = Math.floor(idx / 8);
            const c2 = idx % 8;
            // Simplification : l'IA avance de 1 ou 2 cases vers le joueur
            if(r2 > r1 && r2 <= r1 + 2 && Math.abs(c2 - c1) <= 1) {
                if(!sq.firstChild || sq.firstChild.classList.contains('white-piece')) {
                    validMoves.push({ piece, target: sq });
                }
            }
        });
    });

    if(validMoves.length > 0) {
        // Priorise les captures (Wow Effect)
        let captures = validMoves.filter(m => m.target.firstChild);
        let finalMove = captures.length > 0 ? captures[Math.floor(Math.random() * captures.length)] : validMoves[Math.floor(Math.random() * validMoves.length)];
        animateAIMove(finalMove.piece, finalMove.target);
    } else {
        isAiThinking = false; // Plus de mouvements
    }
}

function playCheckersAI() {
    const board = document.getElementById('checkers-board');
    const aiPieces = Array.from(board.querySelectorAll('.checker.black'));
    if(aiPieces.length === 0) return;

    const allSquares = Array.from(board.querySelectorAll('.square'));
    
    let validMoves = [];
    aiPieces.forEach(piece => {
        const currentIndex = allSquares.indexOf(piece.parentElement);
        const r1 = Math.floor(currentIndex / 8);
        const c1 = currentIndex % 8;

        allSquares.forEach((sq, idx) => {
            const r2 = Math.floor(idx / 8);
            const c2 = idx % 8;
            // Dames : Mouvement diagonal vers l'avant
            if(r2 === r1 + 1 && Math.abs(c2 - c1) === 1) {
                if(!sq.firstChild || sq.firstChild.classList.contains('red')) {
                    validMoves.push({ piece, target: sq });
                }
            }
        });
    });

    if(validMoves.length > 0) {
        let captures = validMoves.filter(m => m.target.firstChild);
        let finalMove = captures.length > 0 ? captures[Math.floor(Math.random() * captures.length)] : validMoves[Math.floor(Math.random() * validMoves.length)];
        animateAIMove(finalMove.piece, finalMove.target);
    } else {
        isAiThinking = false;
    }
}

// --- Initializers ---
const chessInitialLayout = [
    ['♜','♞','♝','♛','♚','♝','♞','♜'],
    ['♟','♟','♟','♟','♟','♟','♟','♟'],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['♙','♙','♙','♙','♙','♙','♙','♙'],
    ['♖','♘','♗','♕','♔','♗','♘','♖']
];

function initChess() {
    isAiThinking = false;
    const board = document.getElementById('chess-board');
    board.innerHTML = '';
    document.querySelector('#chess-view .hint').innerText = "Vous jouez les Blancs. Glissez une pièce !";
    
    let isLight = true;
    for(let r=0; r<8; r++) {
        for(let c=0; c<8; c++) {
            const sq = document.createElement('div');
            sq.className = `square ${isLight ? 'light' : 'dark'}`;
            if(chessInitialLayout[r][c]) {
                const piece = document.createElement('div');
                // Ajout des classes IA (Noir) et Joueur (Blanc)
                const isBlack = (r <= 1);
                piece.className = `piece ${isBlack ? 'black-piece' : 'white-piece'}`;
                piece.innerHTML = chessInitialLayout[r][c];
                piece.style.color = isBlack ? '#000' : '#fff'; 
                sq.appendChild(piece);
            }
            board.appendChild(sq);
            isLight = !isLight;
        }
        isLight = !isLight;
    }
    enableDragAndDrop('chess-board');
}

function initCheckers() {
    isAiThinking = false;
    const board = document.getElementById('checkers-board');
    board.innerHTML = '';
    document.querySelector('#checkers-view .hint').innerText = "Vous jouez les Rouges. Glissez un pion !";
    
    let isLight = true;
    for(let r=0; r<8; r++) {
        for(let c=0; c<8; c++) {
            const sq = document.createElement('div');
            sq.className = `square ${isLight ? 'light' : 'dark'}`;
            
            if(!isLight) {
                if(r < 3) { // IA (Noir) en haut
                    const chk = document.createElement('div');
                    chk.className = 'checker black piece';
                    sq.appendChild(chk);
                } else if(r > 4) { // Joueur (Rouge) en bas
                    const chk = document.createElement('div');
                    chk.className = 'checker red piece';
                    sq.appendChild(chk);
                }
            }
            board.appendChild(sq);
            isLight = !isLight;
        }
        isLight = !isLight;
    }
    enableDragAndDrop('checkers-board');
}

document.addEventListener('start-chess', initChess);
document.addEventListener('start-checkers', initCheckers);
