/**
 * NEON ASTEROIDS - Modular Logic
 */

const AsteroidsGame = {
    // State
    player: {
        x: 0,
        y: 0,
        r: 15,
        a: -Math.PI / 2, // angle in radians
        rot: 0, // rotation speed
        thrusting: false,
        thrust: { x: 0, y: 0 }
    },
    asteroids: [],
    bullets: [],
    particles: [],
    score: 0,
    level: 0,
    gameRunning: false,
    lastTime: 0,
    
    // Constants
    FPS: 60,
    FRICTION: 0.7, // friction coefficient (0 = none, 1 = lots)
    SHIP_SIZE: 20,
    SHIP_THRUST: 5, // acceleration
    SHIP_TURN_SPEED: 360, // degrees per second
    ASTEROIDS_NUM: 3, // starting number of asteroids
    ASTEROIDS_SPEED: 50, // max starting speed in pixels per second
    ASTEROIDS_SIZE: 100, // starting size in pixels
    ASTEROIDS_VERT: 10, // average number of vertices on each asteroid
    ASTEROIDS_JAG: 0.4, // jaggedness (0 = none, 1 = lots)
    BULLET_MAX: 10, // max bullets on screen
    BULLET_SPEED: 500, // speed in pixels per second
    BULLET_DIST: 0.6, // max distance bullet can travel (fraction of screen width)

    init() {
        this.resize();
        this.updateHighScoreDisplay();
    },

    resize() {
        // Handle canvas size if needed, but main controller does this
    },

    start() {
        this.score = 0;
        this.level = 0;
        this.bullets = [];
        this.particles = [];
        this.gameRunning = true;
        this.resetShip();
        this.newLevel();
        
        // UI
        document.getElementById('start-overlay').classList.add('hidden');
        document.getElementById('game-over-overlay').classList.add('hidden');
        document.getElementById('game-title').textContent = 'NEON ASTEROIDS';
        document.getElementById('controls-text').textContent = 'Setas/WASD para mover, ESPAÇO para atirar';
        document.getElementById('dynamic-controls').innerHTML = '<span>SETAS / WASD</span><span class="separator">|</span><span>ESPAÇO (TIRO)</span>';
        
        this.updateScoreDisplay();
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    },

    stop() {
        this.gameRunning = false;
    },

    resetShip() {
        this.player = {
            x: canvas.width / 2,
            y: canvas.height / 2,
            r: this.SHIP_SIZE / 2,
            a: -Math.PI / 2,
            rot: 0,
            thrusting: false,
            thrust: { x: 0, y: 0 }
        };
    },

    newLevel() {
        this.level++;
        this.asteroids = [];
        let x, y;
        for (let i = 0; i < this.ASTEROIDS_NUM + this.level; i++) {
            do {
                x = Math.floor(Math.random() * canvas.width);
                y = Math.floor(Math.random() * canvas.height);
            } while (this.distBetweenPoints(this.player.x, this.player.y, x, y) < this.ASTEROIDS_SIZE * 2 + this.player.r);
            this.asteroids.push(this.newAsteroid(x, y, Math.ceil(this.ASTEROIDS_SIZE / 2)));
        }
    },

    newAsteroid(x, y, r) {
        const lvlMult = 1 + 0.1 * this.level;
        const ast = {
            x: x,
            y: y,
            xv: Math.random() * this.ASTEROIDS_SPEED * lvlMult / this.FPS * (Math.random() < 0.5 ? 1 : -1),
            yv: Math.random() * this.ASTEROIDS_SPEED * lvlMult / this.FPS * (Math.random() < 0.5 ? 1 : -1),
            r: r,
            a: Math.random() * Math.PI * 2,
            vert: Math.floor(Math.random() * (this.ASTEROIDS_VERT + 1) + this.ASTEROIDS_VERT / 2),
            offs: []
        };
        for (let i = 0; i < ast.vert; i++) {
            ast.offs.push(Math.random() * this.ASTEROIDS_JAG * 2 + 1 - this.ASTEROIDS_JAG);
        }
        return ast;
    },

    handleInput(keys, key, type) {
        if (!this.gameRunning) return;
        
        const isDown = type === 'keydown';
        const k = key.toLowerCase();

        if (k === 'arrowleft' || k === 'a') {
            this.player.rot = isDown ? this.SHIP_TURN_SPEED / 180 * Math.PI / this.FPS : 0;
        } else if (k === 'arrowright' || k === 'd') {
            this.player.rot = isDown ? -this.SHIP_TURN_SPEED / 180 * Math.PI / this.FPS : 0;
        } else if (k === 'arrowup' || k === 'w') {
            this.player.thrusting = isDown;
        } else if (k === ' ' || k === 'space') {
            if (isDown) this.shoot();
        }
    },

    shoot() {
        if (this.bullets.length < this.BULLET_MAX) {
            this.bullets.push({
                x: this.player.x + 4 / 3 * this.player.r * Math.cos(this.player.a),
                y: this.player.y - 4 / 3 * this.player.r * Math.sin(this.player.a),
                xv: this.BULLET_SPEED * Math.cos(this.player.a) / this.FPS,
                yv: -this.BULLET_SPEED * Math.sin(this.player.a) / this.FPS,
                dist: 0
            });
        }
    },

    update() {
        // Move Ship
        if (this.player.thrusting) {
            this.player.thrust.x += this.SHIP_THRUST * Math.cos(this.player.a) / this.FPS;
            this.player.thrust.y -= this.SHIP_THRUST * Math.sin(this.player.a) / this.FPS;
            this.createThrustParticles();
        } else {
            this.player.thrust.x -= this.FRICTION * this.player.thrust.x / this.FPS;
            this.player.thrust.y -= this.FRICTION * this.player.thrust.y / this.FPS;
        }
        
        this.player.a += this.player.rot;
        this.player.x += this.player.thrust.x;
        this.player.y += this.player.thrust.y;

        // Ship wrap
        if (this.player.x < 0 - this.player.r) this.player.x = canvas.width + this.player.r;
        else if (this.player.x > canvas.width + this.player.r) this.player.x = 0 - this.player.r;
        if (this.player.y < 0 - this.player.r) this.player.y = canvas.height + this.player.r;
        else if (this.player.y > canvas.height + this.player.r) this.player.y = 0 - this.player.r;

        // Move Bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.x += b.xv;
            b.y += b.yv;
            b.dist += Math.sqrt(b.xv**2 + b.yv**2);

            // Bullet wrap
            if (b.x < 0) b.x = canvas.width; else if (b.x > canvas.width) b.x = 0;
            if (b.y < 0) b.y = canvas.height; else if (b.y > canvas.height) b.y = 0;

            if (b.dist > this.BULLET_DIST * canvas.width) {
                this.bullets.splice(i, 1);
            }
        }

        // Move Asteroids
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const ast = this.asteroids[i];
            ast.x += ast.xv;
            ast.y += ast.yv;

            // Asteroid wrap
            if (ast.x < 0 - ast.r) ast.x = canvas.width + ast.r;
            else if (ast.x > canvas.width + ast.r) ast.x = 0 - ast.r;
            if (ast.y < 0 - ast.r) ast.y = canvas.height + ast.r;
            else if (ast.y > canvas.height + ast.r) ast.y = 0 - ast.r;

            // Collision: Ship
            if (this.distBetweenPoints(this.player.x, this.player.y, ast.x, ast.y) < this.player.r + ast.r) {
                this.gameOver();
                return;
            }

            // Collision: Bullets
            for (let j = this.bullets.length - 1; j >= 0; j--) {
                const b = this.bullets[j];
                if (this.distBetweenPoints(b.x, b.y, ast.x, ast.y) < ast.r) {
                    this.bullets.splice(j, 1);
                    this.destroyAsteroid(i);
                    break;
                }
            }
        }

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.xv;
            p.y += p.yv;
            p.life -= 0.02;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        if (this.asteroids.length === 0) {
            this.newLevel();
        }
    },

    destroyAsteroid(index) {
        const ast = this.asteroids[index];
        const r = ast.r;
        const x = ast.x;
        const y = ast.y;

        // Split
        if (r === Math.ceil(this.ASTEROIDS_SIZE / 2)) {
            this.asteroids.push(this.newAsteroid(x, y, Math.ceil(this.ASTEROIDS_SIZE / 4)));
            this.asteroids.push(this.newAsteroid(x, y, Math.ceil(this.ASTEROIDS_SIZE / 4)));
            this.score += 20;
        } else if (r === Math.ceil(this.ASTEROIDS_SIZE / 4)) {
            this.asteroids.push(this.newAsteroid(x, y, Math.ceil(this.ASTEROIDS_SIZE / 8)));
            this.asteroids.push(this.newAsteroid(x, y, Math.ceil(this.ASTEROIDS_SIZE / 8)));
            this.score += 50;
        } else {
            this.score += 100;
        }

        this.updateScoreDisplay();
        this.createExplosion(x, y, r);
        this.asteroids.splice(index, 1);
    },

    draw() {
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Ship
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00f2fe';
        ctx.beginPath();
        ctx.moveTo(
            this.player.x + 4 / 3 * this.player.r * Math.cos(this.player.a),
            this.player.y - 4 / 3 * this.player.r * Math.sin(this.player.a)
        );
        ctx.lineTo(
            this.player.x - this.player.r * (2 / 3 * Math.cos(this.player.a) + Math.sin(this.player.a)),
            this.player.y + this.player.r * (2 / 3 * Math.sin(this.player.a) - Math.cos(this.player.a))
        );
        ctx.lineTo(
            this.player.x - this.player.r * (2 / 3 * Math.cos(this.player.a) - Math.sin(this.player.a)),
            this.player.y + this.player.r * (2 / 3 * Math.sin(this.player.a) + Math.cos(this.player.a))
        );
        ctx.closePath();
        ctx.stroke();

        // Draw Asteroids
        ctx.shadowColor = '#ff0080';
        ctx.strokeStyle = '#ff0080';
        for (let ast of this.asteroids) {
            ctx.beginPath();
            ctx.moveTo(
                ast.x + ast.r * ast.offs[0] * Math.cos(ast.a),
                ast.y + ast.r * ast.offs[0] * Math.sin(ast.a)
            );
            for (let j = 1; j < ast.vert; j++) {
                ctx.lineTo(
                    ast.x + ast.r * ast.offs[j] * Math.cos(ast.a + j * Math.PI * 2 / ast.vert),
                    ast.y + ast.r * ast.offs[j] * Math.sin(ast.a + j * Math.PI * 2 / ast.vert)
                );
            }
            ctx.closePath();
            ctx.stroke();
        }

        // Draw Bullets
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        for (let b of this.bullets) {
            ctx.beginPath();
            ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw Particles
        for (let p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
    },

    createThrustParticles() {
        this.particles.push({
            x: this.player.x - this.player.r * 2 / 3 * Math.cos(this.player.a),
            y: this.player.y + this.player.r * 2 / 3 * Math.sin(this.player.a),
            xv: (Math.random() - 0.5) * 2 - Math.cos(this.player.a) * 2,
            yv: (Math.random() - 0.5) * 2 + Math.sin(this.player.a) * 2,
            life: 0.5,
            color: '#4facfe'
        });
    },

    createExplosion(x, y, r) {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x, y,
                xv: (Math.random() - 0.5) * 10,
                yv: (Math.random() - 0.5) * 10,
                life: 1.0,
                color: '#ff0080'
            });
        }
    },

    distBetweenPoints(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1)**2 + (y2 - y1)**2);
    },

    loop(timestamp) {
        if (!this.gameRunning) return;
        this.update();
        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    },

    updateScoreDisplay() {
        document.getElementById('score').textContent = this.score.toString().padStart(3, '0');
    },

    updateHighScoreDisplay() {
        const hs = localStorage.getItem('asteroidsHighScore') || 0;
        document.getElementById('high-score').textContent = hs.toString().padStart(3, '0');
    },

    gameOver() {
        this.gameRunning = false;
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over-overlay').classList.remove('hidden');
        
        const hs = localStorage.getItem('asteroidsHighScore') || 0;
        if (this.score > hs) {
            localStorage.setItem('asteroidsHighScore', this.score);
            this.updateHighScoreDisplay();
        }
    }
};
