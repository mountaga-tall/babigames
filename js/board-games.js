// --- Drag and Drop & Touch Logic (Wow Effect Mobile Fix) ---
let draggedPiece = null;
let touchOffsetX = 0;
let touchOffsetY = 0;

function enableDragAndDrop(containerId) {
    const container = document.getElementById(containerId);
    
    // Support Souris (PC)
    container.addEventListener('dragstart', (e) => {
        if(e.target.classList.contains('piece') || e.target.classList.contains('checker')){
            draggedPiece = e.target;
            if(navigator.vibrate) navigator.vibrate(15);
        }
    });

    container.addEventListener('dragover', (e) => e.preventDefault());

    container.addEventListener('drop', (e) => {
        e.preventDefault();
        handleDrop(e.target);
    });

    // Support Tactile (Mobile) avec animation de lévitation
    container.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        
        if(target && (target.classList.contains('piece') || target.classList.contains('checker'))){
            draggedPiece = target;
            const rect = draggedPiece.getBoundingClientRect();
            touchOffsetX = touch.clientX - rect.left;
            touchOffsetY = touch.clientY - rect.top;
            
            // Effet Wow: lévitation et agrandissement de la pièce
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
        
        // Réinitialisation du style de la pièce
        draggedPiece.style.position = '';
        draggedPiece.style.zIndex = '';
        draggedPiece.style.transform = '';
        draggedPiece.style.pointerEvents = 'auto';
        
        const targetSquare = document.elementFromPoint(touch.clientX, touch.clientY);
        handleDrop(targetSquare);
        draggedPiece = null;
    });

    function movePiece(x, y) {
        draggedPiece.style.left = (x - touchOffsetX) + 'px';
        draggedPiece.style.top = (y - touchOffsetY) + 'px';
    }

    function handleDrop(target) {
        if(!target || !draggedPiece) return;
        let targetSquare = target.classList.contains('square') ? target : target.parentElement;
        
        if (targetSquare && targetSquare.classList.contains('square')) {
            // Remove existing piece if captured
            if(targetSquare.firstChild && targetSquare.firstChild !== draggedPiece) {
                targetSquare.removeChild(targetSquare.firstChild);
                if(navigator.vibrate) navigator.vibrate([30, 30]); // Capture haptic
                // Flash rouge sur la case pour confirmer la capture
                targetSquare.style.boxShadow = "inset 0 0 20px rgba(255, 0, 0, 0.7)"; 
                setTimeout(() => targetSquare.style.boxShadow = "", 300);
            } else {
                if(navigator.vibrate) navigator.vibrate(20); // Move haptic
            }
            targetSquare.appendChild(draggedPiece);
        }
    }
}

// --- Chess Initializer ---
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
    const board = document.getElementById('chess-board');
    board.innerHTML = '';
    let isLight = true;
    for(let r=0; r<8; r++) {
        for(let c=0; c<8; c++) {
            const sq = document.createElement('div');
            sq.className = `square ${isLight ? 'light' : 'dark'}`;
            if(chessInitialLayout[r][c]) {
                const piece = document.createElement('div');
                piece.className = 'piece';
                piece.innerHTML = chessInitialLayout[r][c];
                piece.draggable = true;
                // Colorize black and white pieces
                piece.style.color = (r <= 1) ? '#000' : '#fff'; 
                sq.appendChild(piece);
            }
            board.appendChild(sq);
            isLight = !isLight;
        }
        isLight = !isLight;
    }
    enableDragAndDrop('chess-board');
}

// --- Checkers Initializer ---
function initCheckers() {
    const board = document.getElementById('checkers-board');
    board.innerHTML = '';
    let isLight = true;
    for(let r=0; r<8; r++) {
        for(let c=0; c<8; c++) {
            const sq = document.createElement('div');
            sq.className = `square ${isLight ? 'light' : 'dark'}`;
            
            if(!isLight) {
                if(r < 3) {
                    const chk = document.createElement('div');
                    chk.className = 'checker red piece';
                    chk.draggable = true;
                    sq.appendChild(chk);
                } else if(r > 4) {
                    const chk = document.createElement('div');
                    chk.className = 'checker black piece';
                    chk.draggable = true;
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
