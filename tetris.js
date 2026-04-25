/**
 * NEON TETRIS - Modular Logic
 */
const TetrisGame = {
    gameRunning: false,
    gamePaused: false,
    arena: [],
    player: {
        pos: { x: 0, y: 0 },
        matrix: null,
        next: null,
        score: 0,
        lines: 0,
        level: 1,
    },
    colors: [
        null,
        '#FF0D72', // T
        '#0DC2FF', // I
        '#0DFF72', // S
        '#F538FF', // Z
        '#FF8E0D', // L
        '#FFE138', // O
        '#3877FF', // J
    ],
    dropCounter: 0,
    dropInterval: 1000,
    lastTime: 0,
    blockSize: 0,

    init() {
        this.arena = this.createMatrix(12, 20);
        this.resize();
    },

    resize() {
        this.blockSize = canvas.height / 20;
    },

    createMatrix(w, h) {
        const matrix = [];
        while (h--) {
            matrix.push(new Array(w).fill(0));
        }
        return matrix;
    },

    createPiece(type) {
        if (type === 'I') {
            return [
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 1, 0, 0],
            ];
        } else if (type === 'L') {
            return [[0, 2, 0], [0, 2, 0], [0, 2, 2]];
        } else if (type === 'J') {
            return [[0, 3, 0], [0, 3, 0], [3, 3, 0]];
        } else if (type === 'O') {
            return [[4, 4], [4, 4]];
        } else if (type === 'Z') {
            return [[5, 5, 0], [0, 5, 5], [0, 0, 0]];
        } else if (type === 'S') {
            return [[0, 6, 6], [6, 6, 0], [0, 0, 0]];
        } else if (type === 'T') {
            return [[0, 7, 0], [7, 7, 7], [0, 0, 0]];
        }
    },

    start() {
        this.arena.forEach(row => row.fill(0));
        this.player.score = 0;
        this.player.lines = 0;
        this.player.level = 1;
        this.player.next = null;
        this.dropInterval = 1000;
        this.gameRunning = true;
        this.gamePaused = false;
        
        // UI
        document.getElementById('start-overlay').classList.add('hidden');
        document.getElementById('game-over-overlay').classList.add('hidden');
        document.getElementById('game-title').textContent = 'NEON TETRIS';
        
        this.playerReset();
        this.updateScoreDisplay();
        
        this.lastTime = performance.now();
        this.loop();
    },

    stop() {
        this.gameRunning = false;
    },

    collide(arena, player) {
        const [m, o] = [player.matrix, player.pos];
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 &&
                   (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    },

    merge(arena, player) {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    arena[y + player.pos.y][x + player.pos.x] = value;
                }
            });
        });
    },

    rotate(matrix, dir) {
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
            }
        }
        if (dir > 0) matrix.forEach(row => row.reverse());
        else matrix.reverse();
    },

    playerDrop() {
        this.player.pos.y++;
        if (this.collide(this.arena, this.player)) {
            this.player.pos.y--;
            this.merge(this.arena, this.player);
            this.playerReset();
            this.arenaSweep();
            this.updateScoreDisplay();
        }
        this.dropCounter = 0;
    },

    playerMove(dir) {
        this.player.pos.x += dir;
        if (this.collide(this.arena, this.player)) {
            this.player.pos.x -= dir;
        }
    },

    playerReset() {
        const pieces = 'ILJOTSZ';
        if (!this.player.next) {
            this.player.next = this.createPiece(pieces[pieces.length * Math.random() | 0]);
        }
        this.player.matrix = this.player.next;
        this.player.next = this.createPiece(pieces[pieces.length * Math.random() | 0]);
        this.player.pos.y = 0;
        this.player.pos.x = (this.arena[0].length / 2 | 0) - (this.player.matrix[0].length / 2 | 0);

        if (this.collide(this.arena, this.player)) {
            this.gameOver();
        }
    },

    playerRotate(dir) {
        const pos = this.player.pos.x;
        let offset = 1;
        this.rotate(this.player.matrix, dir);
        while (this.collide(this.arena, this.player)) {
            this.player.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > this.player.matrix[0].length) {
                this.rotate(this.player.matrix, -dir);
                this.player.pos.x = pos;
                return;
            }
        }
    },

    arenaSweep() {
        let rowCount = 1;
        outer: for (let y = this.arena.length - 1; y > 0; --y) {
            for (let x = 0; x < this.arena[y].length; ++x) {
                if (this.arena[y][x] === 0) continue outer;
            }
            const row = this.arena.splice(y, 1)[0].fill(0);
            this.arena.unshift(row);
            ++y;
            this.player.score += rowCount * 10;
            rowCount *= 2;
        }
    },

    handleInput(keys, key, type) {
        if (!this.gameRunning || type !== 'keydown') return;
        const k = key.toLowerCase();
        
        if (k === 'arrowleft' || k === 'a') this.playerMove(-1);
        if (k === 'arrowright' || k === 'd') this.playerMove(1);
        if (k === 'arrowdown' || k === 's') this.playerDrop();
        if (k === 'arrowup' || k === 'w') this.playerRotate(1);
        if (k === ' ' || k === 'space') {
            while (!this.collide(this.arena, this.player)) {
                this.player.pos.y++;
            }
            this.player.pos.y--;
            this.merge(this.arena, this.player);
            this.playerReset();
            this.arenaSweep();
            this.updateScoreDisplay();
        }
    },

    update(time) {
        if (this.gamePaused) return;
        const deltaTime = time - this.lastTime;
        this.lastTime = time;

        this.dropCounter += deltaTime;
        if (this.dropCounter > this.dropInterval) {
            this.playerDrop();
        }
    },

    draw() {
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        // Center the board
        const boardWidth = 12 * this.blockSize;
        const offsetX = (canvas.width - boardWidth) / 2;
        ctx.translate(offsetX, 0);

        // Draw Arena
        this.drawMatrix(this.arena, { x: 0, y: 0 });
        // Draw Player
        this.drawMatrix(this.player.matrix, this.player.pos);

        // Draw Next Piece (Miniature on the side)
        this.drawNextPiece(this.player.next);

        ctx.restore();
    },

    drawMatrix(matrix, offset) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = this.colors[value];
                    ctx.fillStyle = this.colors[value];
                    ctx.fillRect((x + offset.x) * this.blockSize, (y + offset.y) * this.blockSize, this.blockSize - 1, this.blockSize - 1);
                    ctx.shadowBlur = 0;
                }
            });
        });
    },

    drawNextPiece(matrix) {
        if (!matrix) return;
        const nextX = 13; // To the right of the board
        const nextY = 2;
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.font = '12px Orbitron';
        ctx.fillText('NEXT', nextX * this.blockSize, (nextY - 0.5) * this.blockSize);
        
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    ctx.fillStyle = this.colors[value];
                    ctx.fillRect((x + nextX) * this.blockSize, (y + nextY) * this.blockSize, this.blockSize * 0.8, this.blockSize * 0.8);
                }
            });
        });
    },

    updateScoreDisplay() {
        document.getElementById('score').textContent = this.player.score.toString().padStart(3, '0');
    },

    gameOver() {
        this.gameRunning = false;
        document.getElementById('final-score').textContent = this.player.score;
        document.getElementById('game-over-overlay').classList.remove('hidden');
    },

    loop(timestamp) {
        if (!this.gameRunning) return;
        this.update(timestamp);
        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    }
};
