/**
 * NEON INVADERS - Modular Logic
 */

const InvadersGame = {
    player: { x: 0, y: 0, width: 40, height: 20 },
    enemies: [],
    bullets: [],
    enemyBullets: [],
    score: 0,
    gameRunning: false,
    gamePaused: false,
    direction: 1, // 1 for right, -1 for left
    moveDown: false,
    movingLeft: false,
    movingRight: false,
    lastTime: 0,
    enemySpeed: 1,
    lastFireTime: 0,
    enemyFireRate: 0.01,
    particles: [],

    init() {
        this.resize();
        this.updateHighScoreDisplay();
        this.showSettings();
    },

    showSettings() {
        const settingsContainer = document.getElementById('game-settings');
        if (settingsContainer) {
            settingsContainer.innerHTML = `
                <div class="setting-item">
                    <label>VELOCIDADE (x):</label>
                    <input type="number" id="invaders-speed-input" value="1.0" min="0.1" max="5.0" step="0.1">
                </div>
            `;
        }
    },

    resize() {
        this.player.width = canvas.width / 12;
        this.player.height = this.player.width / 2;
        this.player.y = canvas.height - this.player.height - 20;
    },

    start() {
        const speedInput = document.getElementById('invaders-speed-input');
        this.speedMultiplier = speedInput ? (parseFloat(speedInput.value) || 1.0) : 1.0;

        this.score = 0;
        this.enemies = [];
        this.bulletSpeed = 10 * this.speedMultiplier; 
        this.fireCooldown = 150 / this.speedMultiplier; 
        this.bullets = [];
        this.enemyBullets = [];
        this.particles = [];
        this.direction = 1;
        this.enemySpeed = 1;
        this.gameRunning = true;
        this.gamePaused = false;
        this.player.x = canvas.width / 2 - this.player.width / 2;

        // Esconde overlays
        document.getElementById('start-overlay').classList.add('hidden');
        document.getElementById('game-over-overlay').classList.add('hidden');

        document.getElementById('game-title').textContent = 'NEON INVADERS';
        document.getElementById('controls-text').textContent = 'Use as setas ou AD para mover e ESPAÇO para atirar';
        document.getElementById('dynamic-controls').innerHTML = '<span>SETAS / AD</span><span class="separator">|</span><span>ESPAÇO (TIRO)</span>';

        this.createEnemies();
        this.updateScoreDisplay();
        
        requestAnimationFrame((t) => this.loop(t));
    },

    stop() {
        this.gameRunning = false;
    },

    createEnemies() {
        const rows = 4;
        const cols = 8;
        const spacing = canvas.width / 12;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                this.enemies.push({
                    x: c * spacing + spacing,
                    y: r * spacing + spacing,
                    width: spacing * 0.7,
                    height: spacing * 0.5,
                    alive: true,
                    type: r // different colors per row
                });
            }
        }
    },

    handleInput(keys, key, type) {
        const k = key.toLowerCase();
        if (type === 'keydown') {
            if (k === 'arrowleft' || k === 'a') this.movingLeft = true;
            if (k === 'arrowright' || k === 'd') this.movingRight = true;
            if (k === ' ' || k === 'space') this.fire();
        } else if (type === 'keyup') {
            if (k === 'arrowleft' || k === 'a') this.movingLeft = false;
            if (k === 'arrowright' || k === 'd') this.movingRight = false;
        }
    },

    fire() {
        const now = Date.now();
        if (now - this.lastFireTime > this.fireCooldown) {
            this.bullets.push({
                x: this.player.x + this.player.width / 2 - 2,
                y: this.player.y,
                width: 4,
                height: 15
            });
            this.lastFireTime = now;
        }
    },

    update() {
        if (this.gamePaused) return;

        // Move Player
        const playerSpeed = 4;
        if (this.movingLeft && this.player.x > 0) this.player.x -= playerSpeed;
        if (this.movingRight && this.player.x < canvas.width - this.player.width) this.player.x += playerSpeed;

        // Move Enemies
        let hitWall = false;
        const currentEnemySpeed = this.enemySpeed * 0.5 * this.speedMultiplier;
        this.enemies.forEach(e => {
            if (!e.alive) return;
            e.x += this.direction * currentEnemySpeed;
            if (e.x + e.width > canvas.width || e.x < 0) hitWall = true;
            
            // Check if enemies reached player
            if (e.y + e.height > this.player.y) this.gameOver();
            
            // Random enemy fire
            if (Math.random() < this.enemyFireRate * this.speedMultiplier) {
                this.enemyBullets.push({
                    x: e.x + e.width / 2,
                    y: e.y + e.height,
                    width: 4,
                    height: 10
                });
            }
        });

        if (hitWall) {
            this.direction *= -1;
            this.enemies.forEach(e => e.y += 20);
            this.enemySpeed += 0.1;
        }

        // Update Bullets
        this.bullets.forEach((b, i) => {
            b.y -= this.bulletSpeed;
            if (b.y < 0) this.bullets.splice(i, 1);

            // Collision with enemies
            this.enemies.forEach(e => {
                if (e.alive && b.x < e.x + e.width && b.x + b.width > e.x && b.y < e.y + e.height && b.y + b.height > e.y) {
                    e.alive = false;
                    this.bullets.splice(i, 1);
                    this.score += 20;
                    this.updateScoreDisplay();
                    this.createParticles(e.x + e.width / 2, e.y + e.height / 2, '#00f2fe');
                    
                    // Win condition
                    if (this.enemies.every(en => !en.alive)) {
                        this.enemySpeed += 1;
                        this.createEnemies();
                    }
                }
            });
        });

        // Update Enemy Bullets
        this.enemyBullets.forEach((b, i) => {
            b.y += 5 * this.speedMultiplier;
            if (b.y > canvas.height) this.enemyBullets.splice(i, 1);

            // Collision with player
            if (b.x < this.player.x + this.player.width && b.x + b.width > this.player.x && b.y < this.player.y + this.player.height && b.y + b.height > this.player.y) {
                this.gameOver();
            }
        });

        this.updateParticles();
    },

    draw() {
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Player
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00f2fe';
        ctx.fillStyle = '#00f2fe';
        ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        ctx.restore();

        // Draw Enemies
        this.enemies.forEach(e => {
            if (!e.alive) return;
            const colors = ['#ff0080', '#4facfe', '#00f2fe', '#f093fb'];
            const color = colors[e.type % colors.length];
            
            ctx.save();
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
            ctx.fillStyle = color;
            // Simple alien shape
            ctx.fillRect(e.x, e.y, e.width, e.height);
            ctx.fillRect(e.x + e.width * 0.2, e.y + e.height, e.width * 0.1, 5);
            ctx.fillRect(e.x + e.width * 0.7, e.y + e.height, e.width * 0.1, 5);
            ctx.restore();
        });

        // Draw Bullets
        ctx.fillStyle = '#fff';
        this.bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));
        
        ctx.fillStyle = '#ff0080';
        this.enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));

        this.drawParticles();
    },

    createParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 1.0,
                color
            });
        }
    },

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx; p.y += p.vy; p.life -= 0.03;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    },

    drawParticles() {
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, 3, 3);
        });
        ctx.globalAlpha = 1.0;
    },

    loop(timestamp) {
        if (!this.gameRunning) return;

        const elapsed = timestamp - this.lastTime;
        const interval = 1000 / 60; // Cap at 60 FPS

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
        const hs = localStorage.getItem('invadersHighScore') || 0;
        document.getElementById('high-score').textContent = hs.toString().padStart(3, '0');
    },

    gameOver() {
        this.gameRunning = false;
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over-overlay').classList.remove('hidden');
        
        const hs = localStorage.getItem('invadersHighScore') || 0;
        if (this.score > hs) {
            localStorage.setItem('invadersHighScore', this.score);
            this.updateHighScoreDisplay();
        }
    }
};
