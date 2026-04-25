/**
 * NEON TIC TAC TOE - Jogo da Velha
 */

const TicTacToeGame = {
    board: [],
    turn: 'X',
    gameRunning: false,
    tileSize: 0,
    cursor: { x: 1, y: 1 },
    winner: null,
    vsComputer: true,
    difficulty: 'easy',

    init() {
        this.resize();
        this.resetBoard();
        
        const settingsHtml = `
            <div class="setting-group" style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: #00f2fe; font-family: 'Orbitron', sans-serif;">Modo de Jogo:</label>
                <select id="ttto-mode" style="width: 100%; padding: 8px; background: rgba(0, 0, 0, 0.5); border: 1px solid #00f2fe; color: white; border-radius: 4px; font-family: 'Inter', sans-serif;">
                    <option value="1">1 Jogador (vs PC)</option>
                    <option value="2">2 Jogadores</option>
                </select>
            </div>
            <div class="setting-group" id="ttto-diff-group" style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: #ff0080; font-family: 'Orbitron', sans-serif;">Dificuldade:</label>
                <select id="ttto-diff" style="width: 100%; padding: 8px; background: rgba(0, 0, 0, 0.5); border: 1px solid #ff0080; color: white; border-radius: 4px; font-family: 'Inter', sans-serif;">
                    <option value="easy">Fácil</option>
                    <option value="hard">Difícil</option>
                </select>
            </div>
        `;
        document.getElementById('game-settings').innerHTML = settingsHtml;
        
        document.getElementById('ttto-mode').addEventListener('change', (e) => {
            document.getElementById('ttto-diff-group').style.display = e.target.value === '1' ? 'block' : 'none';
        });
    },

    resize() {
        this.tileSize = canvas.width / 3;
    },

    resetBoard() {
        this.board = Array(3).fill(null).map(() => Array(3).fill(null));
        this.turn = 'X';
        this.winner = null;
        this.cursor = { x: 1, y: 1 };
    },

    start() {
        this.resetBoard();
        
        const modeSelect = document.getElementById('ttto-mode');
        const diffSelect = document.getElementById('ttto-diff');
        
        if (modeSelect) this.vsComputer = modeSelect.value === '1';
        if (diffSelect) this.difficulty = diffSelect.value;
        
        this.gameRunning = true;

        document.getElementById('start-overlay').classList.add('hidden');
        document.getElementById('game-over-overlay').classList.add('hidden');
        
        document.getElementById('game-title').textContent = 'JOGO DA VELHA';
        document.getElementById('controls-text').textContent = 'Use as setas para mover o cursor, ESPAÇO para marcar';
        document.getElementById('dynamic-controls').innerHTML = '<span>SETAS / WASD</span><span class="separator">|</span><span>ESPAÇO (AÇÃO)</span>';
        
        this.updateScoreDisplay();
        this.draw();
    },

    stop() {
        this.gameRunning = false;
    },

    handleInput(keys, key, type) {
        if (!this.gameRunning || type !== 'keydown') return;
        if (this.vsComputer && this.turn === 'O') return; // Ignore input during computer's turn
        
        const k = key.toLowerCase();
        
        // Navigation
        if (k === 'arrowup' || k === 'w') {
            this.cursor.y = Math.max(0, this.cursor.y - 1);
        } else if (k === 'arrowdown' || k === 's') {
            this.cursor.y = Math.min(2, this.cursor.y + 1);
        } else if (k === 'arrowleft' || k === 'a') {
            this.cursor.x = Math.max(0, this.cursor.x - 1);
        } else if (k === 'arrowright' || k === 'd') {
            this.cursor.x = Math.min(2, this.cursor.x + 1);
        }
        
        // Action
        if (k === ' ' || k === 'enter') {
            this.markSquare(this.cursor.x, this.cursor.y);
        }

        this.draw();
    },

    markSquare(x, y) {
        if (this.board[y][x] || this.winner) return;

        this.board[y][x] = this.turn;
        
        if (this.checkWin(this.turn)) {
            this.winner = this.turn;
            this.draw();
            setTimeout(() => this.gameOver(this.winner), 500);
            return;
        }

        if (this.checkDraw()) {
            this.winner = 'Draw';
            this.draw();
            setTimeout(() => this.gameOver('Draw'), 500);
            return;
        }

        this.turn = this.turn === 'X' ? 'O' : 'X';
        this.updateScoreDisplay();
        
        if (this.vsComputer && this.turn === 'O') {
            setTimeout(() => this.makeAIMove(), 500);
        }
    },

    makeAIMove() {
        if (!this.gameRunning || this.winner) return;
        
        let move;
        if (this.difficulty === 'hard') {
            move = this.getBestMove();
        } else {
            move = this.getRandomMove();
        }
        
        if (move) {
            this.markSquare(move.x, move.y);
        }
    },
    
    getRandomMove() {
        const empty = [];
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (!this.board[r][c]) empty.push({x: c, y: r});
            }
        }
        if (empty.length === 0) return null;
        return empty[Math.floor(Math.random() * empty.length)];
    },
    
    getBestMove() {
        let bestScore = -Infinity;
        let move = null;
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (!this.board[i][j]) {
                    this.board[i][j] = 'O';
                    let score = this.minimax(this.board, 0, false);
                    this.board[i][j] = null;
                    if (score > bestScore) {
                        bestScore = score;
                        move = { x: j, y: i };
                    }
                }
            }
        }
        return move || this.getRandomMove();
    },
    
    minimax(board, depth, isMaximizing) {
        if (this.checkWin('O')) return 10 - depth;
        if (this.checkWin('X')) return depth - 10;
        if (this.checkDraw()) return 0;
        
        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    if (!board[i][j]) {
                        board[i][j] = 'O';
                        let score = this.minimax(board, depth + 1, false);
                        board[i][j] = null;
                        bestScore = Math.max(score, bestScore);
                    }
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    if (!board[i][j]) {
                        board[i][j] = 'X';
                        let score = this.minimax(board, depth + 1, true);
                        board[i][j] = null;
                        bestScore = Math.min(score, bestScore);
                    }
                }
            }
            return bestScore;
        }
    },

    checkWin(player) {
        const b = this.board;
        // Rows
        for (let r = 0; r < 3; r++) {
            if (b[r][0] === player && b[r][1] === player && b[r][2] === player) return true;
        }
        // Cols
        for (let c = 0; c < 3; c++) {
            if (b[0][c] === player && b[1][c] === player && b[2][c] === player) return true;
        }
        // Diagonals
        if (b[0][0] === player && b[1][1] === player && b[2][2] === player) return true;
        if (b[0][2] === player && b[1][1] === player && b[2][0] === player) return true;
        
        return false;
    },

    checkDraw() {
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (!this.board[r][c]) return false;
            }
        }
        return true;
    },

    draw() {
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (let i = 1; i < 3; i++) {
            ctx.moveTo(i * this.tileSize, 0);
            ctx.lineTo(i * this.tileSize, canvas.height);
            ctx.moveTo(0, i * this.tileSize);
            ctx.lineTo(canvas.width, i * this.tileSize);
        }
        ctx.stroke();

        // Draw X and O
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                const val = this.board[r][c];
                if (val) {
                    this.drawSymbol(c, r, val);
                }

                // Highlight cursor
                if (this.cursor.x === c && this.cursor.y === r) {
                    const rx = c * this.tileSize;
                    const ry = r * this.tileSize;
                    ctx.strokeStyle = 'rgba(0, 242, 254, 0.5)';
                    ctx.lineWidth = 4;
                    ctx.strokeRect(rx + 10, ry + 10, this.tileSize - 20, this.tileSize - 20);
                }
            }
        }
    },

    drawSymbol(x, y, type) {
        const cx = x * this.tileSize + this.tileSize / 2;
        const cy = y * this.tileSize + this.tileSize / 2;
        const size = this.tileSize * 0.3;

        ctx.save();
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 15;

        if (type === 'X') {
            ctx.strokeStyle = '#ff0080';
            ctx.shadowColor = '#ff0080';
            ctx.beginPath();
            ctx.moveTo(cx - size, cy - size);
            ctx.lineTo(cx + size, cy + size);
            ctx.moveTo(cx + size, cy - size);
            ctx.lineTo(cx - size, cy + size);
            ctx.stroke();
        } else if (type === 'O') {
            ctx.strokeStyle = '#00f2fe';
            ctx.shadowColor = '#00f2fe';
            ctx.beginPath();
            ctx.arc(cx, cy, size, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    },

    updateScoreDisplay() {
        document.getElementById('score').textContent = 'Vez de: ' + this.turn;
        document.getElementById('high-score').textContent = '-';
    },

    gameOver(winner) {
        this.gameRunning = false;
        if (winner === 'Draw') {
            document.getElementById('game-over-title').textContent = 'EMPATE!';
        } else {
            document.getElementById('game-over-title').textContent = winner + ' VENCEU!';
        }
        document.getElementById('final-score').textContent = 'FIM';
        document.getElementById('game-over-overlay').classList.remove('hidden');
    }
};
