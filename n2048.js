/**
 * NEON 2048 - Modular Logic
 */

const N2048Game = {
    grid: [],
    size: 4,
    score: 0,
    gameRunning: false,
    moving: false,
    lastTime: 0,
    animations: [],

    init() {
        this.resize();
    },

    resize() {
        this.boardSize = Math.min(canvas.width, canvas.height) * 0.9;
        this.cellSize = this.boardSize / this.size;
    },

    start() {
        this.grid = Array.from({ length: this.size }, () => Array(this.size).fill(0));
        this.score = 0;
        this.animations = [];
        this.addRandomTile();
        this.addRandomTile();
        this.gameRunning = true;

        document.getElementById('start-overlay').classList.add('hidden');
        document.getElementById('game-over-overlay').classList.add('hidden');
        document.getElementById('game-title').textContent = 'NEON 2048';
        document.getElementById('controls-text').textContent = 'Use as SETAS ou WASD para deslizar os blocos.';
        
        this.updateScoreDisplay();
        requestAnimationFrame((t) => this.loop(t));
    },

    stop() {
        this.gameRunning = false;
    },

    addRandomTile() {
        let empty = [];
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === 0) empty.push({ r, c });
            }
        }
        if (empty.length > 0) {
            let { r, c } = empty[Math.floor(Math.random() * empty.length)];
            this.grid[r][c] = Math.random() < 0.9 ? 2 : 4;
            // Animation for new tile
            this.animations.push({ type: 'new', r, c, scale: 0 });
        }
    },

    handleInput(keys, key, type) {
        if (!this.gameRunning || type !== 'keydown' || this.moving) return;

        let moved = false;
        const k = key.toLowerCase();

        if (k === 'arrowup' || k === 'w') moved = this.move('up');
        if (k === 'arrowdown' || k === 's') moved = this.move('down');
        if (k === 'arrowleft' || k === 'a') moved = this.move('left');
        if (k === 'arrowright' || k === 'd') moved = this.move('right');

        if (moved) {
            this.moving = true;
            setTimeout(() => {
                this.addRandomTile();
                this.moving = false;
                if (this.isGameOver()) this.gameOver();
            }, 150);
        }
    },

    move(dir) {
        let moved = false;
        let newGrid = Array.from({ length: this.size }, () => Array(this.size).fill(0));

        if (dir === 'left' || dir === 'right') {
            for (let r = 0; r < this.size; r++) {
                let row = this.grid[r].filter(v => v !== 0);
                if (dir === 'right') row.reverse();
                
                let mergedRow = [];
                for (let i = 0; i < row.length; i++) {
                    if (i + 1 < row.length && row[i] === row[i + 1]) {
                        let val = row[i] * 2;
                        mergedRow.push(val);
                        this.score += val;
                        this.animations.push({ type: 'merge', r, c: dir === 'right' ? (this.size - 1 - mergedRow.length + 1) : (mergedRow.length - 1), val });
                        i++;
                        moved = true;
                    } else {
                        mergedRow.push(row[i]);
                    }
                }
                while (mergedRow.length < this.size) mergedRow.push(0);
                if (dir === 'right') mergedRow.reverse();
                
                if (JSON.stringify(this.grid[r]) !== JSON.stringify(mergedRow)) moved = true;
                newGrid[r] = mergedRow;
            }
        } else {
            // Up / Down
            for (let c = 0; c < this.size; c++) {
                let col = [];
                for (let r = 0; r < this.size; r++) if (this.grid[r][c] !== 0) col.push(this.grid[r][c]);
                if (dir === 'down') col.reverse();

                let mergedCol = [];
                for (let i = 0; i < col.length; i++) {
                    if (i + 1 < col.length && col[i] === col[i + 1]) {
                        let val = col[i] * 2;
                        mergedCol.push(val);
                        this.score += val;
                        this.animations.push({ type: 'merge', r: dir === 'down' ? (this.size - 1 - mergedCol.length + 1) : (mergedCol.length - 1), c, val });
                        i++;
                        moved = true;
                    } else {
                        mergedCol.push(col[i]);
                    }
                }
                while (mergedCol.length < this.size) mergedCol.push(0);
                if (dir === 'down') mergedCol.reverse();

                for (let r = 0; r < this.size; r++) {
                    if (this.grid[r][c] !== mergedCol[r]) moved = true;
                    newGrid[r][c] = mergedCol[r];
                }
            }
        }

        if (moved) {
            this.grid = newGrid;
            this.updateScoreDisplay();
        }
        return moved;
    },

    isGameOver() {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === 0) return false;
                if (c + 1 < this.size && this.grid[r][c] === this.grid[r][c + 1]) return false;
                if (r + 1 < this.size && this.grid[r][c] === this.grid[r + 1][c]) return false;
            }
        }
        return true;
    },

    gameOver() {
        this.gameRunning = false;
        document.getElementById('game-over-title').textContent = 'FIM DE JOGO';
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over-overlay').classList.remove('hidden');
    },

    update() {
        // Handle animations
        this.animations.forEach((anim, i) => {
            if (anim.type === 'new') {
                anim.scale += 0.1;
                if (anim.scale >= 1) this.animations.splice(i, 1);
            } else if (anim.type === 'merge') {
                anim.scale = (anim.scale || 1) + 0.1;
                if (anim.scale >= 1.3) this.animations.splice(i, 1);
            }
        });
    },

    draw() {
        const W = canvas.width, H = canvas.height;
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, 0, W, H);

        const offsetX = (W - this.boardSize) / 2;
        const offsetY = (H - this.boardSize) / 2;

        ctx.save();
        ctx.translate(offsetX, offsetY);

        // Board Background
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(0, 0, this.boardSize, this.boardSize);

        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                this.drawTile(r, c, this.grid[r][c]);
            }
        }

        ctx.restore();
    },

    drawTile(r, c, val) {
        const padding = 10;
        const x = c * this.cellSize + padding;
        const y = r * this.cellSize + padding;
        const w = this.cellSize - padding * 2;
        const h = this.cellSize - padding * 2;

        if (val === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fillRect(x, y, w, h);
            return;
        }

        const colors = {
            2: '#00f2fe', 4: '#4facfe', 8: '#f093fb', 16: '#f5576c',
            32: '#ff0844', 64: '#ffb199', 128: '#fa709a', 256: '#fee140',
            512: '#43e97b', 1024: '#38f9d7', 2048: '#ff0080'
        };

        const color = colors[val] || '#fff';
        
        ctx.save();
        
        // Find animation for this tile
        const anim = this.animations.find(a => a.r === r && a.c === c);
        if (anim) {
            ctx.translate(x + w/2, y + h/2);
            ctx.scale(anim.scale, anim.scale);
            ctx.translate(-(x + w/2), -(y + h/2));
        }

        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#0a0a0c';
        ctx.font = `bold ${this.cellSize * 0.4}px Orbitron`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(val, x + w / 2, y + h / 2);
        
        ctx.restore();
    },

    loop(timestamp) {
        if (!this.gameRunning) return;
        this.update();
        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    },

    updateScoreDisplay() {
        document.getElementById('score').textContent = this.score.toString().padStart(3, '0');
    }
};
