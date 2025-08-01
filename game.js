const BOARD_SIZE = 8;
const BLACK = 'black';
const WHITE = 'white';
const EMPTY = null;

let board = [];
let currentPlayer = BLACK;
let soundEnabled = true;
let validMoves = [];

const osakaMessages = {
    black_turn: ["黒たこ焼きの番やで！", "ほな、黒いきまっせ〜", "黒の出番やで！"],
    white_turn: ["白たこ焼きの番や！", "白、いくで〜", "白の番きたで！"],
    black_win: ["黒たこ焼きの勝ちや！めっちゃうまいやん！", "黒の圧勝やな！おめでとさん！"],
    white_win: ["白たこ焼きの勝ちやで！やるやん！", "白の勝利！ええ感じやったで！"],
    tie: ["引き分けかい！どっちもようやったで！", "同点や！仲良うしよな！"],
    no_moves: ["置けるとこないで！パスや！", "あかん、パスするしかないわ"],
    good_move: ["ええ手やん！", "なかなかやるやん！", "おお、ナイスたこ焼き！"],
    flip_many: ["めっちゃひっくり返ったで！", "うわ〜、ようけ返ったな！", "すごいやん！たこ焼き祭りや！"]
};

function initializeBoard() {
    board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(EMPTY));
    board[3][3] = WHITE;
    board[3][4] = BLACK;
    board[4][3] = BLACK;
    board[4][4] = WHITE;
}

function createBoardElement() {
    const boardElement = document.getElementById('game-board');
    boardElement.innerHTML = '';
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.addEventListener('click', handleCellClick);
            boardElement.appendChild(cell);
        }
    }
}

function updateBoard() {
    const cells = document.querySelectorAll('.cell');
    
    cells.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const piece = board[row][col];
        
        cell.innerHTML = '';
        cell.classList.remove('valid-move');
        
        if (piece) {
            const takoyaki = document.createElement('div');
            takoyaki.className = `takoyaki-piece ${piece}`;
            takoyaki.textContent = piece === BLACK ? '🍙' : '🥟';
            cell.appendChild(takoyaki);
        }
    });
    
    updateValidMoves();
    updateScore();
}

function isValidPosition(row, col) {
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function checkDirection(row, col, dRow, dCol, player) {
    const opponent = player === BLACK ? WHITE : BLACK;
    let r = row + dRow;
    let c = col + dCol;
    let foundOpponent = false;
    
    while (isValidPosition(r, c) && board[r][c] === opponent) {
        foundOpponent = true;
        r += dRow;
        c += dCol;
    }
    
    if (!foundOpponent || !isValidPosition(r, c) || board[r][c] !== player) {
        return [];
    }
    
    const flipped = [];
    r -= dRow;
    c -= dCol;
    
    while (r !== row || c !== col) {
        flipped.push([r, c]);
        r -= dRow;
        c -= dCol;
    }
    
    return flipped;
}

function getValidMoves(player) {
    const moves = [];
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === EMPTY) {
                const flipped = getFlippedPieces(row, col, player);
                if (flipped.length > 0) {
                    moves.push({ row, col, flipped });
                }
            }
        }
    }
    
    return moves;
}

function getFlippedPieces(row, col, player) {
    if (board[row][col] !== EMPTY) return [];
    
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];
    
    const allFlipped = [];
    
    directions.forEach(([dRow, dCol]) => {
        const flipped = checkDirection(row, col, dRow, dCol, player);
        allFlipped.push(...flipped);
    });
    
    return allFlipped;
}

function updateValidMoves() {
    validMoves = getValidMoves(currentPlayer);
    
    document.querySelectorAll('.cell').forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        const isValid = validMoves.some(move => move.row === row && move.col === col);
        if (isValid) {
            cell.classList.add('valid-move');
        }
    });
}

function makeMove(row, col) {
    const move = validMoves.find(m => m.row === row && m.col === col);
    if (!move) return false;
    
    board[row][col] = currentPlayer;
    
    move.flipped.forEach(([r, c]) => {
        setTimeout(() => {
            const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
            const piece = cell.querySelector('.takoyaki-piece');
            if (piece) {
                piece.classList.add('flipping');
                setTimeout(() => {
                    board[r][c] = currentPlayer;
                    updateBoard();
                }, 400);
            }
        }, 100);
    });
    
    if (move.flipped.length > 3) {
        showMessage(getRandomMessage('flip_many'));
    } else {
        showMessage(getRandomMessage('good_move'));
    }
    
    playSound('flip');
    
    return true;
}

function switchPlayer() {
    currentPlayer = currentPlayer === BLACK ? WHITE : BLACK;
    const turnMessage = currentPlayer === BLACK ? 'black_turn' : 'white_turn';
    showMessage(getRandomMessage(turnMessage));
    document.getElementById('current-turn').textContent = getRandomMessage(turnMessage);
}

function handleCellClick(event) {
    const cell = event.currentTarget;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    
    if (makeMove(row, col)) {
        setTimeout(() => {
            switchPlayer();
            updateBoard();
            
            if (!checkGameEnd()) {
                if (validMoves.length === 0) {
                    showMessage(getRandomMessage('no_moves'));
                    setTimeout(() => {
                        switchPlayer();
                        updateBoard();
                        checkGameEnd();
                    }, 1500);
                }
            }
        }, 600);
    }
}

function updateScore() {
    let blackCount = 0;
    let whiteCount = 0;
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === BLACK) blackCount++;
            else if (board[row][col] === WHITE) whiteCount++;
        }
    }
    
    document.getElementById('score-black').textContent = blackCount;
    document.getElementById('score-white').textContent = whiteCount;
}

function checkGameEnd() {
    const blackMoves = getValidMoves(BLACK);
    const whiteMoves = getValidMoves(WHITE);
    
    if (blackMoves.length === 0 && whiteMoves.length === 0) {
        const blackCount = parseInt(document.getElementById('score-black').textContent);
        const whiteCount = parseInt(document.getElementById('score-white').textContent);
        
        let message;
        if (blackCount > whiteCount) {
            message = getRandomMessage('black_win');
        } else if (whiteCount > blackCount) {
            message = getRandomMessage('white_win');
        } else {
            message = getRandomMessage('tie');
        }
        
        showMessage(message);
        playSound('gameEnd');
        return true;
    }
    
    return false;
}

function showMessage(message) {
    document.getElementById('message-area').innerHTML = `<p>${message}</p>`;
}

function getRandomMessage(type) {
    const messages = osakaMessages[type];
    return messages[Math.floor(Math.random() * messages.length)];
}

function playSound(type) {
    if (!soundEnabled) return;
    
    const audio = new Audio();
    audio.volume = 0.3;
    
    switch(type) {
        case 'flip':
            audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDGH0fPTgjMGHm7A7+OZURE';
            break;
        case 'gameEnd':
            audio.src = 'data:audio/wav;base64,UklGRoYIAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQIIAACBg4aEaFVecZStsI9fMzRdm9HYpVoSBA9ltvLLdR0HG1+z69OTTg4MRpnd48p2IQgjWq3n1Z1bGxIyZZXU4sp8Kwo7bI7H2aR9UUBYb4vD06N/V0lggIqAkoyAg4aBg4aEaFVecZStsI9fMzRdm9HYpVoSBA9ltvLLdR0HG1+z69OTTg4MRpnd48p2IQgjWq3n1Z1bGxIyZZXU4sp8Kwo7bI7H2aR9UUBYb4vD06N/V0lggIqAkoyAg4aB';
            break;
    }
    
    audio.play().catch(() => {});
}

function resetGame() {
    initializeBoard();
    currentPlayer = BLACK;
    createBoardElement();
    updateBoard();
    showMessage(getRandomMessage('black_turn'));
    playSound('flip');
}

document.getElementById('reset-btn').addEventListener('click', resetGame);

document.getElementById('sound-toggle').addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    document.getElementById('sound-toggle').textContent = soundEnabled ? '音オン/オフ' : '音オフ→オン';
});

window.addEventListener('DOMContentLoaded', () => {
    resetGame();
});