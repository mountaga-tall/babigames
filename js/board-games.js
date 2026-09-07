
// --- Drag and Drop Logic ---
let draggedPiece = null;

function enableDragAndDrop(containerId) {
    const container = document.getElementById(containerId);
    
    container.addEventListener('dragstart', (e) => {
        if(e.target.classList.contains('piece') || e.target.classList.contains('checker')){
            draggedPiece = e.target;
            if(navigator.vibrate) navigator.vibrate(15);
        }
    });

    container.addEventListener('dragover', (e) => {
        e.preventDefault(); // allow drop
    });

    container.addEventListener('drop', (e) => {
        e.preventDefault();
        let targetSquare = e.target.classList.contains('square') ? e.target : e.target.parentElement;
        
        if (targetSquare.classList.contains('square') && draggedPiece) {
            // Remove existing piece if captured
            if(targetSquare.firstChild && targetSquare.firstChild !== draggedPiece) {
                targetSquare.removeChild(targetSquare.firstChild);
                if(navigator.vibrate) navigator.vibrate([30, 30]); // Capture haptic
            } else {
                if(navigator.vibrate) navigator.vibrate(20); // Move haptic
            }
            targetSquare.appendChild(draggedPiece);
        }
    });
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
