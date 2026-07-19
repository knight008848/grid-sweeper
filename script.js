// =========================================
// 扫雷完整逻辑（包含难度切换与自定义弹窗）
// =========================================

const DIFFICULTIES = {
    level1: { rows: 9, cols: 9, mines: 10 },
    level2: { rows: 12, cols: 12, mines: 22 },
    level3: { rows: 16, cols: 16, mines: 40 },
    level4: { rows: 16, cols: 20, mines: 60 },
    level5: { rows: 16, cols: 30, mines: 99 }
};

let ROWS = 9;
let COLS = 9;
let MINES_COUNT = 10;

const NUM_COLORS = [
    '',
    '#3498db',
    '#2ecc71',
    '#e74c3c',
    '#9b59b6',
    '#f1c40f',
    '#e67e22',
    '#34495e',
    '#7f8c8d'
];

let board = [];
let isFirstClick = true;
let isGameOver = false;
let revealedCount = 0;
let timerInterval = null;
let timeElapsed = 0;

// 获取 DOM 元素
const gridElement = document.getElementById('grid');
const mineCountElement = document.getElementById('mine-count');
const restartBtn = document.getElementById('restart-btn');
const timerElement = document.getElementById('timer');
const difficultySelect = document.getElementById('difficulty');

// 弹窗相关 DOM 元素
const resultModal = document.getElementById('result-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalBtn = document.getElementById('modal-btn');

// 初始化游戏面板
function initGame() {
    // 隐藏弹窗
    resultModal.style.display = 'none';

    gridElement.style.gridTemplateColumns = `repeat(${COLS}, 30px)`;
    gridElement.innerHTML = '';
    board = [];
    isFirstClick = true;
    isGameOver = false;
    revealedCount = 0;

    restartBtn.textContent = '😊';
    mineCountElement.textContent = MINES_COUNT;

    clearInterval(timerInterval);
    timeElapsed = 0;
    timerElement.textContent = '000';

    for (let r = 0; r < ROWS; r++) {
        let rowArray = [];
        for (let c = 0; c < COLS; c++) {
            rowArray.push(0);
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.addEventListener('click', handleLeftClick);
            cell.addEventListener('contextmenu', handleRightClick);
            gridElement.appendChild(cell);
        }
        board.push(rowArray);
    }
}

function changeDifficulty() {
    const mode = difficultySelect.value;
    ROWS = DIFFICULTIES[mode].rows;
    COLS = DIFFICULTIES[mode].cols;
    MINES_COUNT = DIFFICULTIES[mode].mines;
    initGame();
}

function placeMines(firstRow, firstCol) {
    let minesPlaced = 0;
    while (minesPlaced < MINES_COUNT) {
        let r = Math.floor(Math.random() * ROWS);
        let c = Math.floor(Math.random() * COLS);
        if (board[r][c] !== -1 && !(r === firstRow && c === firstCol)) {
            board[r][c] = -1;
            minesPlaced++;
        }
    }
}

function calculateNumbers() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board[r][c] === -1) continue;
            let minesAround = 0;
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    let nr = r + i;
                    let nc = c + j;
                    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                        if (board[nr][nc] === -1) minesAround++;
                    }
                }
            }
            board[r][c] = minesAround;
        }
    }
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeElapsed++;
        if (timeElapsed > 999) timeElapsed = 999;
        timerElement.textContent = timeElapsed.toString().padStart(3, '0');
    }, 1000);
}

function handleLeftClick(e) {
    if (isGameOver) return;
    const r = parseInt(e.target.dataset.row);
    const c = parseInt(e.target.dataset.col);

    if (e.target.classList.contains('flagged')) return;

    if (isFirstClick) {
        placeMines(r, c);
        calculateNumbers();
        startTimer();
        isFirstClick = false;
    }
    revealCell(r, c);
}

function revealCell(r, c) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;

    const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
    if (!cell || cell.classList.contains('revealed') || cell.classList.contains('flagged')) return;

    cell.classList.add('revealed');
    revealedCount++;

    if (board[r][c] === -1) {
        cell.textContent = '💣';
        cell.style.background = '#ff003c';
        gameOver(false);
    } else if (board[r][c] > 0) {
        cell.textContent = board[r][c];
        cell.style.color = NUM_COLORS[board[r][c]];
        checkWin();
    } else {
        checkWin();
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                revealCell(r + i, c + j);
            }
        }
    }
}

function handleRightClick(e) {
    e.preventDefault();
    if (isGameOver || isFirstClick) return;

    const cell = e.target;
    if (cell.classList.contains('revealed')) return;

    let currentMines = parseInt(mineCountElement.textContent);
    if (cell.classList.contains('flagged')) {
        cell.classList.remove('flagged');
        cell.textContent = '';
        mineCountElement.textContent = currentMines + 1;
    } else {
        if (currentMines > 0) {
            cell.classList.add('flagged');
            cell.textContent = '🚩';
            mineCountElement.textContent = currentMines - 1;
        }
    }
}

function checkWin() {
    if (revealedCount === ROWS * COLS - MINES_COUNT) {
        gameOver(true);
    }
}

// 核心修改：使用自定义模态框代替系统 alert()
function gameOver(win) {
    isGameOver = true;
    clearInterval(timerInterval);
    restartBtn.textContent = win ? '😎' : '😵';

    // 延迟 500 毫秒弹出结果，让玩家看清棋盘上的炸弹
    setTimeout(() => {
        if (win) {
            modalTitle.textContent = '🎉 挑战成功！';
            modalTitle.style.color = '#2ecc71';
            modalMessage.textContent = `太棒了！你在 ${timeElapsed} 秒内排除了所有地雷！`;
            modalBtn.textContent = '再玩一把';
        } else {
            modalTitle.textContent = '💥 游戏结束';
            modalTitle.style.color = '#ff003c';
            modalMessage.textContent = '你不小心踩到了地雷...';
            modalBtn.textContent = '不服，再来！';
        }
        // 显示弹出层
        resultModal.style.display = 'flex';
    }, 500);

    if (!win) {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (board[r][c] === -1) {
                    const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
                    if (!cell.classList.contains('flagged')) {
                        cell.classList.add('revealed');
                        cell.textContent = '💣';
                    }
                }
            }
        }
    }
}

// 绑定各种重置按钮事件
restartBtn.addEventListener('click', initGame);
modalBtn.addEventListener('click', initGame); // 弹窗里的按钮也能重新开始

difficultySelect.addEventListener('change', changeDifficulty);

window.onload = () => {
    initGame();
};
