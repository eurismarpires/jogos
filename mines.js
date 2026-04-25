/**
 * NEON MINES (Campo Minado) - Modular Logic
 */

const MinesGame = {
    grid: [],
    size: 10,
    minesCount: 15,
    gameRunning: false,
    gameOverState: false,
    flagMode: false,

    init() {
        this.resize();
        this.showSettings();
    },

    showSettings() {
        const settingsContainer = document.getElementById('game-settings');
        if (settingsContainer) {
            settingsContainer.innerHTML = `
                <div class="setting-item" style="cursor: pointer; user-select: none;" id="mine-flag-toggle">
                    <label>MODO:</label>
                    <span id="flag-status" style="color: #00f2fe; font-weight: bold;">REVELAR</span>
                </div>
            `;
            document.getElementById('mine-flag-toggle').onclick = () => {
                this.flagMode = !this.flagMode;
                document.getElementById('flag-status').textContent = this.flagMode ? 'MARCAR' : 'REVELAR';
                document.getElementById('flag-status').style.color = this.flagMode ? '#ff0080' : '#00f2fe';
            };
        }
    },

    resize() {
        this.boardSize = Math.min(canvas.width, canvas.height) * 0.9;
        this.cellSize = this.boardSize / this.size;
    },

    start() {
        this.grid = Array.from({ length: this.size }, () => 
            Array.from({ length: this.size }, () => ({
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0
            }))
        );

        // Place mines
        let placed = 0;
        while (placed < this.minesCount) {
            let r = Math.floor(Math.random() * this.size);
            let c = Math.floor(Math.random() * this.size);
            if (!this.grid[r][c].isMine) {
                this.grid[r][c].isMine = true;
                placed++;
            }
        }

        // Calculate neighbors
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c].isMine) continue;
                let count = 0;
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        let nr = r + i, nc = c + j;
                        if (nr >= 0 && nr < this.size && nc >= 0 && nc < this.size) {
                            if (this.grid[nr][nc].isMine) count++;
                        }
                    }
                }
                this.grid[r][c].neighborMines = count;
            }
        }

        this.gameRunning = true;
        this.gameOverState = false;

        document.getElementById('start-overlay').classList.add('hidden');
        document.getElementById('game-over-overlay').classList.add('hidden');
        document.getElementById('game-title').textContent = 'NEON MINES';
        document.getElementById('controls-text').textContent = 'Clique para abrir. Use o botão de FLAG (ou clique longo) para marcar.';
        
        this.updateScoreDisplay();
        requestAnimationFrame((t) => this.loop(t));
    },

    onClick(e) {
        if (!this.gameRunning || this.gameOverState) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const offsetX = (canvas.width - this.boardSize) / 2;
        const offsetY = (canvas.height - this.boardSize) / 2;

        const c = Math.floor((x - offsetX) / this.cellSize);
        const r = Math.floor((y - offsetY) / this.cellSize);

        if (r >= 0 && r < this.size && c >= 0 && c < this.size) {
            // Se flagMode estiver ativo ou botão direito/shift
            if (this.flagMode || e.button === 2 || e.shiftKey) {
                this.toggleFlag(r, c);
            } else {
                this.reveal(r, c);
            }
        }
    },

    toggleFlag(r, c) {
        const cell = this.grid[r][c];
        if (!cell.isRevealed) {
            cell.isFlagged = !cell.isFlagged;
        }
    },

    reveal(r, c) {
        const cell = this.grid[r][c];
        if (cell.isRevealed || cell.isFlagged) return;

        cell.isRevealed = true;

        if (cell.isMine) {
            this.gameOver(false);
            return;
        }

        if (cell.neighborMines === 0) {
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    let nr = r + i, nc = c + j;
                    if (nr >= 0 && nr < this.size && nc >= 0 && nc < this.size) {
                        this.reveal(nr, nc);
                    }
                }
            }
        }

        this.checkWin();
    },

    checkWin() {
        let revealedCount = 0;
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c].isRevealed) revealedCount++;
            }
        }
        if (revealedCount === this.size * this.size - this.minesCount) {
            this.gameOver(true);
        }
    },

    gameOver(win) {
        this.gameOverState = true;
        this.gameRunning = false;
        
        // Reveal all mines
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c].isMine) this.grid[r][c].isRevealed = true;
            }
        }

        document.getElementById('game-over-title').textContent = win ? 'MISSÃO CUMPRIDA!' : 'SISTEMA CORROMPIDO!';
        document.getElementById('final-score').textContent = win ? 'Hacker Elite' : 'Glitch Detectado';
        document.getElementById('game-over-overlay').classList.remove('hidden');
    },

    draw() {
        const W = canvas.width, H = canvas.height;
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, 0, W, H);

        const offsetX = (W - this.boardSize) / 2;
        const offsetY = (H - this.boardSize) / 2;

        ctx.save();
        ctx.translate(offsetX, offsetY);

        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const cell = this.grid[r][c];
                const x = c * this.cellSize;
                const y = r * this.cellSize;
                const padding = 2;

                if (cell.isRevealed) {
                    ctx.fillStyle = cell.isMine ? '#ff0080' : '#1a1a2e';
                    ctx.fillRect(x + padding, y + padding, this.cellSize - padding*2, this.cellSize - padding*2);
                    
                    if (!cell.isMine && cell.neighborMines > 0) {
                        ctx.fillStyle = this.getNumberColor(cell.neighborMines);
                        ctx.font = `bold ${this.cellSize * 0.6}px Orbitron`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(cell.neighborMines, x + this.cellSize/2, y + this.cellSize/2);
                    } else if (cell.isMine) {
                        ctx.fillStyle = '#fff';
                        ctx.fillText('👾', x + this.cellSize/2, y + this.cellSize/2);
                    }
                } else {
                    ctx.fillStyle = 'rgba(0, 242, 254, 0.1)';
                    ctx.strokeStyle = 'rgba(0, 242, 254, 0.3)';
                    ctx.strokeRect(x + padding, y + padding, this.cellSize - padding*2, this.cellSize - padding*2);
                    ctx.fillRect(x + padding, y + padding, this.cellSize - padding*2, this.cellSize - padding*2);

                    if (cell.isFlagged) {
                        ctx.fillStyle = '#ff0080';
                        ctx.font = `${this.cellSize * 0.5}px Orbitron`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('🚩', x + this.cellSize/2, y + this.cellSize/2);
                    }
                }
            }
        }

        ctx.restore();
    },

    getNumberColor(n) {
        const colors = ['#00f2fe', '#4facfe', '#43e97b', '#fee140', '#fa709a', '#f5576c', '#ff0844', '#ff0080'];
        return colors[n-1] || '#fff';
    },

    loop(timestamp) {
        if (!this.gameRunning && !this.gameOverState) return;
        this.draw();
        if (this.gameRunning) requestAnimationFrame((t) => this.loop(t));
    },

    updateScoreDisplay() {
        document.getElementById('score').textContent = '---';
    }
};
