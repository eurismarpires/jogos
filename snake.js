/**
 * NEON SNAKE - Modular Logic
 */

const SnakeGame = {
    // State
    snake: [],
    food: { x: 5, y: 5 },
    direction: { x: 0, y: 0 },
    nextDirection: { x: 0, y: 0 },
    score: 0,
    gameRunning: false,
    gamePaused: false,
    lastTime: 0,
    speed: 4.9,
    particles: [],
    tileCount: 20,
    tileSize: 0,

    init() {
        this.resize();
        this.updateHighScoreDisplay();
        this.showSettings();
    },

    showSettings() {
        const settingsContainer = document.getElementById('game-settings');
        settingsContainer.innerHTML = `
            <div class="setting-item">
                <label>VELOCIDADE:</label>
                <input type="number" id="snake-speed-input" value="${this.speed}" min="1" max="20" step="0.1">
            </div>
        `;
    },

    resize() {
        this.tileSize = canvas.width / this.tileCount;
    },

    start() {
        const speedInput = document.getElementById('snake-speed-input');
        if (speedInput) {
            this.speed = parseFloat(speedInput.value) || 4.9;
        }

        this.snake = [
            { x: 10, y: 10 },
            { x: 10, y: 11 },
            { x: 10, y: 12 }
        ];
        this.direction = { x: 0, y: -1 };
        this.nextDirection = { x: 0, y: -1 };
        this.score = 0;
        this.speed = 4.9;
        this.particles = [];
        this.gameRunning = true;
        this.gamePaused = false;

        // Esconde overlays
        document.getElementById('start-overlay').classList.add('hidden');
        document.getElementById('game-over-overlay').classList.add('hidden');
        
        document.getElementById('game-title').textContent = 'NEON SNAKE';
        document.getElementById('controls-text').textContent = 'Use as setas ou WASD para mover';
        document.getElementById('dynamic-controls').innerHTML = '<span>SETAS / WASD</span><span class="separator">|</span><span>ESPAÇO (PAUSE)</span>';
        
        this.updateScoreDisplay();
        this.spawnFood();
        
        requestAnimationFrame((t) => this.loop(t));
    },

    stop() {
        this.gameRunning = false;
    },

    spawnFood() {
        this.food = {
            x: Math.floor(Math.random() * this.tileCount),
            y: Math.floor(Math.random() * this.tileCount)
        };
        for (let part of this.snake) {
            if (part.x === this.food.x && part.y === this.food.y) {
                this.spawnFood();
                break;
            }
        }
    },

    handleInput(keys, key, type) {
        if (!this.gameRunning || type !== 'keydown') return;
        const k = key.toLowerCase();
        if (k === ' ' || k === 'space') {
            this.gamePaused = !this.gamePaused;
            return;
        }

        // Up
        if ((k === 'arrowup' || k === 'w') && this.direction.y !== 1) {
            this.nextDirection = { x: 0, y: -1 };
        }
        // Down
        else if ((k === 'arrowdown' || k === 's') && this.direction.y !== -1) {
            this.nextDirection = { x: 0, y: 1 };
        }
        // Left
        else if ((k === 'arrowleft' || k === 'a') && this.direction.x !== 1) {
            this.nextDirection = { x: -1, y: 0 };
        }
        // Right
        else if ((k === 'arrowright' || k === 'd') && this.direction.x !== -1) {
            this.nextDirection = { x: 1, y: 0 };
        }
    },

    update() {
        if (this.gamePaused) return;

        this.direction = this.nextDirection;
        const head = { x: this.snake[0].x + this.direction.x, y: this.snake[0].y + this.direction.y };

        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }

        for (let part of this.snake) {
            if (head.x === part.x && head.y === part.y) {
                this.gameOver();
                return;
            }
        }

        this.snake.unshift(head);

        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            if (this.score % 50 === 0) this.speed += 0.5;
            this.updateScoreDisplay();
            this.createParticles(this.food.x * this.tileSize + this.tileSize / 2, this.food.y * this.tileSize + this.tileSize / 2);
            this.spawnFood();
        } else {
            this.snake.pop();
        }
    },

    draw() {
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= this.tileCount; i++) {
            ctx.beginPath();
            ctx.moveTo(i * this.tileSize, 0);
            ctx.lineTo(i * this.tileSize, canvas.height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * this.tileSize);
            ctx.lineTo(canvas.width, i * this.tileSize);
            ctx.stroke();
        }

        this.drawNeonRect(this.food.x, this.food.y, '#ff0080', true);

        this.snake.forEach((part, index) => {
            const isHead = index === 0;
            const color = isHead ? '#00f2fe' : '#4facfe';
            this.drawNeonRect(part.x, part.y, color, false, index);
        });

        this.updateParticles();
    },

    drawNeonRect(x, y, color, pulse = false, index = 0) {
        const padding = 2;
        const size = this.tileSize - padding * 2;
        const rx = x * this.tileSize + padding;
        const ry = y * this.tileSize + padding;

        ctx.save();
        ctx.shadowBlur = pulse ? 15 + Math.sin(Date.now() / 100) * 5 : 10;
        ctx.shadowColor = color;
        
        if (pulse) {
            const s = 1 + Math.sin(Date.now() / 150) * 0.1;
            ctx.translate(rx + size/2, ry + size/2);
            ctx.scale(s, s);
            ctx.translate(-(rx + size/2), -(ry + size/2));
        }

        if (index > 0) {
            ctx.globalAlpha = Math.max(0.3, 1 - (index / this.snake.length));
        }

        ctx.fillStyle = color;
        const r = 4;
        ctx.beginPath();
        ctx.moveTo(rx + r, ry);
        ctx.lineTo(rx + size - r, ry);
        ctx.quadraticCurveTo(rx + size, ry, rx + size, ry + r);
        ctx.lineTo(rx + size, ry + size - r);
        ctx.quadraticCurveTo(rx + size, ry + size, rx + size - r, ry + size);
        ctx.lineTo(rx + r, ry + size);
        ctx.quadraticCurveTo(rx, ry + size, rx, ry + size - r);
        ctx.lineTo(rx, ry + r);
        ctx.quadraticCurveTo(rx, ry, rx + r, ry);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    },

    createParticles(x, y) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1.0,
                color: '#ff0080'
            });
        }
    },

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    },

    loop(timestamp) {
        if (!this.gameRunning) return;
        const elapsed = timestamp - this.lastTime;
        const interval = 1000 / this.speed;
        if (elapsed > interval) {
            this.lastTime = timestamp - (elapsed % interval);
            this.update();
        }
        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    },

    updateScoreDisplay() {
        document.getElementById('score').textContent = this.score.toString().padStart(3, '0');
    },

    updateHighScoreDisplay() {
        const hs = localStorage.getItem('snakeHighScore') || 0;
        document.getElementById('high-score').textContent = hs.toString().padStart(3, '0');
    },

    gameOver() {
        this.gameRunning = false;
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over-overlay').classList.remove('hidden');
        
        const hs = localStorage.getItem('snakeHighScore') || 0;
        if (this.score > hs) {
            localStorage.setItem('snakeHighScore', this.score);
            this.updateHighScoreDisplay();
        }
    }
};
