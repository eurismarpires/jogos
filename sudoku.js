/**
 * NEON SUDOKU - Modular Logic
 */

const SudokuGame = {
    grid: [],
    solution: [],
    initial: [],
    selected: { r: -1, c: -1 },
    gameRunning: false,
    gamePaused: false,
    difficulty: 40, // Number of empty cells
    lastTime: 0,

    init() {
        this.resize();
        this.showSettings();
    },

    showSettings() {
        const settingsContainer = document.getElementById('game-settings');
        if (settingsContainer) {
            settingsContainer.innerHTML = `
                <div class="setting-item">
                    <label>DIFICULDADE:</label>
                    <select id="sudoku-diff-input" style="background: transparent; border: 1px solid #00f2fe; color: #00f2fe; padding: 5px; font-family: 'Orbitron', sans-serif;">
                        <option value="30" style="background: #0a0a0c;">FÁCIL</option>
                        <option value="45" style="background: #0a0a0c;" selected>MÉDIO</option>
                        <option value="55" style="background: #0a0a0c;">DIFÍCIL</option>
                    </select>
                </div>
            `;
        }
    },

    resize() {
        this.cellSize = Math.min(canvas.width, canvas.height) / 10;
    },

    start() {
        const diffInput = document.getElementById('sudoku-diff-input');
        this.difficulty = diffInput ? parseInt(diffInput.value) : 45;

        this.generateBoard();
        this.gameRunning = true;
        this.gamePaused = false;
        this.selected = { r: 4, c: 4 };

        document.getElementById('start-overlay').classList.add('hidden');
        document.getElementById('game-over-overlay').classList.add('hidden');
        document.getElementById('game-title').textContent = 'NEON SUDOKU';
        document.getElementById('controls-text').innerHTML = `
            Preencha cada linha, coluna e bloco 3x3 com números de 1 a 9 sem repetir.<br>
            <strong>Clique</strong> na célula e use <strong>1-9</strong>. <strong>Backspace/0</strong> para apagar.
        `;
        
        this.updateScoreDisplay();
        requestAnimationFrame((t) => this.loop(t));
    },

    stop() {
        this.gameRunning = false;
    },

    generateBoard() {
        // Create empty 9x9
        this.solution = Array.from({ length: 9 }, () => Array(9).fill(0));
        this.fillGrid(this.solution);
        
        // Copy to grid
        this.grid = this.solution.map(row => [...row]);
        this.initial = Array.from({ length: 9 }, () => Array(9).fill(false));

        // Remove elements
        let count = this.difficulty;
        while (count > 0) {
            let r = Math.floor(Math.random() * 9);
            let c = Math.floor(Math.random() * 9);
            if (this.grid[r][c] !== 0) {
                this.grid[r][c] = 0;
                count--;
            }
        }

        // Mark initial
        for(let r=0; r<9; r++) {
            for(let c=0; c<9; c++) {
                if (this.grid[r][c] !== 0) this.initial[r][c] = true;
            }
        }
    },

    fillGrid(grid) {
        let numberList = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        for (let i = 0; i < 81; i++) {
            let row = Math.floor(i / 9);
            let col = i % 9;
            if (grid[row][col] === 0) {
                this.shuffle(numberList);
                for (let num of numberList) {
                    if (this.isValid(grid, row, col, num)) {
                        grid[row][col] = num;
                        if (this.isFull(grid)) return true;
                        if (this.fillGrid(grid)) return true;
                    }
                }
                grid[row][col] = 0;
                return false;
            }
        }
        return true;
    },

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    },

    isValid(grid, r, c, num) {
        // Row
        for (let i = 0; i < 9; i++) if (grid[r][i] === num) return false;
        // Col
        for (let i = 0; i < 9; i++) if (grid[i][c] === num) return false;
        // Box
        let startRow = r - r % 3, startCol = c - c % 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (grid[i + startRow][j + startCol] === num) return false;
            }
        }
        return true;
    },

    isFull(grid) {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (grid[r][c] === 0) return false;
            }
        }
        return true;
    },

    handleInput(keys, key, type) {
        if (!this.gameRunning || type !== 'keydown') return;

        if (key === 'ArrowUp' && this.selected.r > 0) this.selected.r--;
        if (key === 'ArrowDown' && this.selected.r < 8) this.selected.r++;
        if (key === 'ArrowLeft' && this.selected.c > 0) this.selected.c--;
        if (key === 'ArrowRight' && this.selected.c < 8) this.selected.c++;

        if (key === 'Backspace' || key === 'Delete' || key === '0') {
            this.setNumber(0);
            return;
        }

        const num = parseInt(key);
        if (!isNaN(num) && num >= 1 && num <= 9) {
            this.setNumber(num);
        }
    },

    onClick(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const boardSize = this.cellSize * 9;
        const offsetX = (canvas.width - boardSize) / 2;
        const offsetY = (canvas.height - boardSize) / 2;

        const c = Math.floor((x - offsetX) / this.cellSize);
        const r = Math.floor((y - offsetY) / this.cellSize);

        if (r >= 0 && r < 9 && c >= 0 && c < 9) {
            this.selected = { r, c };
        }
    },

    setNumber(num) {
        if (this.selected.r === -1) return;
        if (this.initial[this.selected.r][this.selected.c]) return; // Cannot change initial
        
        this.grid[this.selected.r][this.selected.c] = num;
        
        if (this.isFull(this.grid)) {
            this.checkWin();
        }
    },

    checkWin() {
        let win = true;
        for(let r=0; r<9; r++) {
            for(let c=0; c<9; c++) {
                if (this.grid[r][c] !== this.solution[r][c]) win = false;
            }
        }
        if (win) {
            this.gameRunning = false;
            document.getElementById('game-over-title').textContent = '✨ SUDOKU RESOLVIDO!';
            document.getElementById('final-score').textContent = 'Mestre do Sudoku';
            document.getElementById('game-over-overlay').classList.remove('hidden');
        }
    },

    update() {
        // No real-time logic needed
    },

    draw() {
        const W = canvas.width, H = canvas.height;
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, 0, W, H);

        const boardSize = this.cellSize * 9;
        const offsetX = (W - boardSize) / 2;
        const offsetY = (H - boardSize) / 2;

        ctx.save();
        ctx.translate(offsetX, offsetY);

        // Highlight selected row/col/box (subtle)
        if (this.selected.r !== -1) {
            ctx.fillStyle = 'rgba(0, 242, 254, 0.05)';
            ctx.fillRect(0, this.selected.r * this.cellSize, boardSize, this.cellSize);
            ctx.fillRect(this.selected.c * this.cellSize, 0, this.cellSize, boardSize);
        }

        // Draw Cells
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const x = c * this.cellSize;
                const y = r * this.cellSize;

                // Cell background
                if (r === this.selected.r && c === this.selected.c) {
                    ctx.fillStyle = 'rgba(0, 242, 254, 0.2)';
                    ctx.fillRect(x, y, this.cellSize, this.cellSize);
                }

                // Grid lines
                ctx.strokeStyle = 'rgba(0, 242, 254, 0.1)';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, this.cellSize, this.cellSize);

                // Numbers
                const val = this.grid[r][c];
                if (val !== 0) {
                    ctx.font = `bold ${this.cellSize * 0.6}px Orbitron`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    if (this.initial[r][c]) {
                        ctx.fillStyle = '#00f2fe'; // Neon cyan for initial
                    } else {
                        ctx.fillStyle = '#f093fb'; // Pink for user input
                    }
                    
                    ctx.fillText(val, x + this.cellSize / 2, y + this.cellSize / 2);
                }
            }
        }

        // Bold lines for 3x3
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 3;
        for (let i = 0; i <= 9; i += 3) {
            ctx.beginPath();
            ctx.moveTo(i * this.cellSize, 0);
            ctx.lineTo(i * this.cellSize, boardSize);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i * this.cellSize);
            ctx.lineTo(boardSize, i * this.cellSize);
            ctx.stroke();
        }

        ctx.restore();
    },

    loop(timestamp) {
        if (!this.gameRunning) return;
        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    },

    updateScoreDisplay() {
        document.getElementById('score').textContent = '---';
    }
};
