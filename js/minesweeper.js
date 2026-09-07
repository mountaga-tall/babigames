
const gridEl = document.getElementById('minesweeper-grid');
const minesLeftEl = document.getElementById('mines-left');
const rows = 10; const cols = 10; const totalMines = 15;
let board = []; let minesLeft = totalMines; let isGameOver = false;

function initMinesweeper() {
    board = [];
    isGameOver = false;
    minesLeft = totalMines;
    minesLeftEl.innerText = minesLeft;
    gridEl.style.gridTemplateColumns = `repeat(${cols}, 35px)`;
    gridEl.innerHTML = '';
    
    // Create Board Data
    for(let r=0; r<rows; r++){
        let row = [];
        for(let c=0; c<cols; c++) row.push({ mine: false, revealed: false, flagged: false, count: 0 });
        board.push(row);
    }

    // Place Mines
    let placed = 0;
    while(placed < totalMines){
        let r = Math.floor(Math.random() * rows);
        let c = Math.floor(Math.random() * cols);
        if(!board[r][c].mine){
            board[r][c].mine = true;
            placed++;
        }
    }

    // Calculate Numbers
    for(let r=0; r<rows; r++){
        for(let c=0; c<cols; c++){
            if(!board[r][c].mine){
                let count = 0;
                for(let i=-1; i<=1; i++)
                    for(let j=-1; j<=1; j++)
                        if(r+i>=0 && r+i<rows && c+j>=0 && c+j<cols && board[r+i][c+j].mine) count++;
                board[r][c].count = count;
            }
        }
    }

    renderMinesweeper();
}

function renderMinesweeper() {
    gridEl.innerHTML = '';
    for(let r=0; r<rows; r++){
        for(let c=0; c<cols; c++){
            const cell = document.createElement('div');
            cell.classList.add('ms-cell');
            cell.dataset.r = r; cell.dataset.c = c;
            
            // Left click (Reveal)
            cell.addEventListener('click', () => reveal(r, c));
            // Right click / Long press (Flag)
            cell.addEventListener('contextmenu', (e) => { e.preventDefault(); flag(r, c); });
            
            gridEl.appendChild(cell);
        }
    }
}

function updateCellDOM(r, c) {
    const idx = r * cols + c;
    const cellEl = gridEl.children[idx];
    const cellData = board[r][c];

    if(cellData.revealed) {
        cellEl.classList.add('revealed');
        if(cellData.mine) {
            cellEl.innerHTML = '💣';
            cellEl.classList.add('mine');
        } else if(cellData.count > 0) {
            cellEl.innerHTML = cellData.count;
            const colors = ['#3498db', '#2ecc71', '#e74c3c', '#9b59b6', '#f1c40f', '#1abc9c', '#34495e', '#7f8c8d'];
            cellEl.style.color = colors[cellData.count-1];
        }
    } else if(cellData.flagged) {
        cellEl.innerHTML = '🚩';
    } else {
        cellEl.innerHTML = '';
    }
}

function reveal(r, c) {
    if(isGameOver || board[r][c].revealed || board[r][c].flagged) return;
    if(navigator.vibrate) navigator.vibrate(15);
    
    board[r][c].revealed = true;
    updateCellDOM(r, c);

    if(board[r][c].mine) {
        isGameOver = true;
        if(navigator.vibrate) navigator.vibrate([100, 50, 100]); // Explosion
        // Reveal all mines
        for(let i=0; i<rows; i++) for(let j=0; j<cols; j++) 
            if(board[i][j].mine) { board[i][j].revealed = true; updateCellDOM(i, j); }
        return;
    }

    if(board[r][c].count === 0) {
        for(let i=-1; i<=1; i++){
            for(let j=-1; j<=1; j++){
                if(r+i>=0 && r+i<rows && c+j>=0 && c+j<cols) reveal(r+i, c+j);
            }
        }
    }
}

function flag(r, c) {
    if(isGameOver || board[r][c].revealed) return;
    if(navigator.vibrate) navigator.vibrate(30);
    
    board[r][c].flagged = !board[r][c].flagged;
    minesLeft += board[r][c].flagged ? -1 : 1;
    minesLeftEl.innerText = minesLeft;
    updateCellDOM(r, c);
}

document.getElementById('reset-minesweeper').addEventListener('click', initMinesweeper);
document.addEventListener('start-minesweeper', initMinesweeper);
