/**
 * NEON MARIO - Modular Logic
 * Adaptado do arquivo Jogo_do_M_rio___.html
 */

const MarioGame = {
    gameState: 'idle',
    cameraX: 0,
    score: 0,
    lives: 3,
    coins: 0,
    player: null,
    level: null,
    particles: [],
    floatingTexts: [],
    lastTime: 0,
    
    GRAVITY: 0.55,
    JUMP: -13,
    SPEED: 4,

    init() {
        this.resize();
        this.updateHighScoreDisplay();
    },

    resize() {
        // O Mario usa tamanho fixo 800x450 no original, mas vamos adaptar
        // Se quisermos manter a proporção, podemos fazer algo aqui
    },

    start() {
        this.score = 0;
        this.lives = 3;
        this.coins = 0;
        this.player = this.createPlayer();
        this.level = this.buildLevel();
        this.cameraX = 0;
        this.gameState = 'playing';
        this.particles = [];
        this.floatingTexts = [];
        
        // UI
        document.getElementById('start-overlay').classList.add('hidden');
        document.getElementById('game-over-overlay').classList.add('hidden');
        document.getElementById('game-title').textContent = 'NEON MARIO';
        document.getElementById('lives-container').style.display = 'flex';
        
        this.updateScoreDisplay();
        this.updateHUD();
        
        requestAnimationFrame((t) => this.loop(t));
    },

    stop() {
        this.gameState = 'idle';
        document.getElementById('lives-container').style.display = 'none';
    },

    createPlayer() {
        return {
            x: 60, y: canvas.height - 100, vx: 0, vy: 0, w: 28, h: 36,
            onGround: false, jumpCount: 0, facing: 1,
            invincible: 0, walkFrame: 0, walkTimer: 0, dead: false, deadTimer: 0
        };
    },

    buildLevel() {
        const H = canvas.height;
        const platforms = [
            // ground
            ...Array.from({length: 80}, (_, i) => ({x: i * 32, y: H - 40, w: 32, h: 40, color: '#5D4037'})),
            // platforms
            {x: 200, y: 300, w: 96, h: 20, color: '#5D4037'},
            {x: 350, y: 240, w: 96, h: 20, color: '#5D4037'},
            {x: 500, y: 300, w: 64, h: 20, color: '#5D4037'},
            {x: 640, y: 220, w: 128, h: 20, color: '#5D4037'},
            {x: 800, y: 310, w: 64, h: 20, color: '#5D4037'},
            {x: 900, y: 250, w: 96, h: 20, color: '#5D4037'},
            {x: 1050, y: 300, w: 64, h: 20, color: '#5D4037'},
            {x: 1150, y: 240, w: 96, h: 20, color: '#5D4037'},
            {x: 1300, y: 300, w: 128, h: 20, color: '#5D4037'},
            {x: 1500, y: 260, w: 96, h: 20, color: '#5D4037'},
            {x: 1650, y: 310, w: 64, h: 20, color: '#5D4037'},
            {x: 1800, y: 240, w: 128, h: 20, color: '#5D4037'},
            // pipes
            {x: 700, y: H - 120, w: 40, h: 80, color: '#2ECC40'},
            {x: 1400, y: H - 120, w: 40, h: 80, color: '#2ECC40'},
            {x: 1900, y: H - 120, w: 40, h: 80, color: '#2ECC40'},
        ];

        const coins_arr = [
            {x: 230, y: 270}, {x: 262, y: 270}, {x: 294, y: 270},
            {x: 380, y: 210}, {x: 412, y: 210},
            {x: 680, y: 190}, {x: 712, y: 190}, {x: 744, y: 190},
            {x: 920, y: 220}, {x: 952, y: 220},
            {x: 1180, y: 210}, {x: 1212, y: 210},
            {x: 1530, y: 230}, {x: 1562, y: 230},
            {x: 100, y: H - 80}, {x: 200, y: H - 80}, {x: 400, y: H - 80},
            {x: 600, y: H - 80}, {x: 1000, y: H - 80}, {x: 1200, y: H - 80},
            {x: 1600, y: H - 80}, {x: 1700, y: H - 80},
        ].map(c => ({...c, collected: false, bounce: 0}));

        const enemies = [
            {x: 300, y: H - 72}, {x: 500, y: H - 72}, {x: 750, y: H - 72},
            {x: 1000, y: H - 72}, {x: 1100, y: H - 72}, {x: 1300, y: H - 72},
            {x: 1550, y: H - 72}, {x: 1750, y: H - 72},
            {x: 370, y: 218}, {x: 670, y: 198}, {x: 920, y: 228},
        ].map(e => ({...e, vx: -1.2, alive: true, squished: false, squishTimer: 0, w: 28, h: 28}));

        const flag = {x: 2100, y: H - 240, w: 20, h: 200};

        return {platforms, coins: coins_arr, enemies, flag};
    },

    handleInput(keys, key, type) {
        // Usado pelo main.js
    },

    update() {
        if (this.gameState !== 'playing') return;

        const player = this.player;
        const H = canvas.height;

        // Player dead animation
        if (player.dead) {
            player.deadTimer--;
            player.vy += this.GRAVITY;
            player.y += player.vy;
            if (player.deadTimer <= 0) {
                this.lives--;
                this.updateHUD();
                if (this.lives <= 0) {
                    this.gameOver();
                } else {
                    this.player = this.createPlayer();
                    this.cameraX = 0;
                }
            }
            return;
        }

        // Invincibility
        if (player.invincible > 0) player.invincible--;

        // Input from main.js keys object
        if (window.keys['ArrowLeft'] || window.keys['a']) {
            player.vx = -this.SPEED; player.facing = -1;
        } else if (window.keys['ArrowRight'] || window.keys['d']) {
            player.vx = this.SPEED; player.facing = 1;
        } else {
            player.vx = 0;
        }

        if ((window.keys['ArrowUp'] || window.keys['w'] || window.keys[' ']) && player.onGround) {
            player.vy = this.JUMP;
            player.onGround = false;
        }

        // Walk animation
        if (player.vx !== 0 && player.onGround) {
            player.walkTimer++;
            if (player.walkTimer > 8) { player.walkFrame = (player.walkFrame + 1) % 4; player.walkTimer = 0; }
        }

        // Physics
        player.vy += this.GRAVITY;
        player.x += player.vx;
        player.y += player.vy;
        player.onGround = false;

        // World bounds
        if (player.x < 0) player.x = 0;

        // Platform collision
        for (const p of this.level.platforms) {
            if (this.intersects(player, p)) {
                const overlapL = (player.x + player.w) - p.x;
                const overlapR = (p.x + p.w) - player.x;
                const overlapT = (player.y + player.h) - p.y;
                const overlapB = (p.y + p.h) - player.y;
                const minH = Math.min(overlapL, overlapR);
                const minV = Math.min(overlapT, overlapB);
                if (minV < minH) {
                    if (overlapT < overlapB) { player.y = p.y - player.h; player.vy = 0; player.onGround = true; }
                    else { player.y = p.y + p.h; player.vy = Math.abs(player.vy) * 0.3; }
                } else {
                    if (overlapL < overlapR) player.x = p.x - player.w;
                    else player.x = p.x + p.w;
                }
            }
        }

        // Fell off
        if (player.y > H + 60) {
            this.killPlayer();
            return;
        }

        // Coins
        for (const c of this.level.coins) {
            if (!c.collected && this.intersects(player, {x: c.x, y: c.y, w: 16, h: 16})) {
                c.collected = true;
                this.coins++; this.score += 50;
                this.spawnFloatText(c.x - this.cameraX, c.y, '+50');
                this.spawnParticles(c.x, c.y, '#FFD700', 6);
                this.updateHUD();
            }
            if (!c.collected) { c.bounce = (c.bounce || 0) + 0.08; }
        }

        // Enemies
        for (const e of this.level.enemies) {
            if (!e.alive) continue;

            if (e.squished) {
                e.squishTimer--;
                if (e.squishTimer <= 0) e.alive = false;
                continue;
            }

            e.x += e.vx;
            e.y += this.GRAVITY * 0.5;

            // Collision for enemy
            for (const p of this.level.platforms) {
                if (this.intersects(e, p)) {
                    const overlapT = (e.y + e.h) - p.y;
                    const overlapB = (p.y + p.h) - e.y;
                    if (overlapT < overlapB && overlapT < 20) {
                        e.y = p.y - e.h;
                    } else {
                        e.vx *= -1;
                    }
                }
            }
            if (e.x < 0 || e.x > 2200) e.vx *= -1;
            if (e.y > H) { e.alive = false; continue; }

            // Player-enemy collision
            if (player.invincible === 0 && this.intersects(player, e)) {
                if (player.vy > 0 && player.y + player.h < e.y + e.h * 0.6) {
                    e.squished = true;
                    e.squishTimer = 20;
                    player.vy = this.JUMP * 0.6;
                    this.score += 100;
                    this.spawnFloatText(e.x - this.cameraX, e.y, '+100', '#FF6B6B');
                    this.spawnParticles(e.x + 14, e.y, '#8B4513', 8);
                    this.updateHUD();
                } else {
                    this.killPlayer();
                    return;
                }
            }
        }

        // Flag
        if (this.intersects(player, this.level.flag)) {
            this.win();
        }

        // Camera
        this.cameraX = Math.max(0, player.x - canvas.width / 3);
        
        this.updateParticles();
        this.updateFloatingTexts();
    },

    killPlayer() {
        if (this.player.invincible > 0) return;
        this.player.dead = true;
        this.player.deadTimer = 60;
        this.player.vy = this.JUMP;
        this.spawnParticles(this.player.x + 14, this.player.y + 18, '#FF0000', 12);
    },

    win() {
        this.gameState = 'win';
        this.gameRunning = false;
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over-title').textContent = '🏁 VOCÊ GANHOU!';
        document.getElementById('game-over-overlay').classList.remove('hidden');
    },

    gameOver() {
        this.gameState = 'gameover';
        this.gameRunning = false;
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over-title').textContent = '💀 GAME OVER';
        document.getElementById('game-over-overlay').classList.remove('hidden');
    },

    draw() {
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        
        this.drawBackground();
        
        ctx.save();
        ctx.translate(-this.cameraX, 0);
        
        this.level.platforms.forEach(p => this.drawPlatform(p));
        this.level.coins.forEach(c => this.drawCoin(c));
        this.drawFlag();
        this.level.enemies.forEach(e => this.drawEnemy(e));
        this.drawPlayer();
        this.drawParticles();
        
        ctx.restore();
        this.drawFloatingTexts();
    },

    drawBackground() {
        const W = canvas.width, H = canvas.height;
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#5C94FC');
        sky.addColorStop(1, '#9BBCFF');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        const clouds = [
            {x: 100, y: 60, r: 28}, {x: 200, y: 50, r: 22}, {x: 400, y: 80, r: 32}, {x: 550, y: 55, r: 26},
            {x: 800, y: 70, r: 30}, {x: 1000, y: 50, r: 24}, {x: 1200, y: 75, r: 28}, {x: 1500, y: 60, r: 22},
        ];
        for (const c of clouds) {
            const cx = c.x - this.cameraX * 0.4;
            ctx.beginPath();
            ctx.arc(cx, c.y, c.r, 0, Math.PI * 2); ctx.fill();
        }

        ctx.fillStyle = '#3DA35D';
        const hills = [{x: 0, r: 120}, {x: 300, r: 90}, {x: 600, r: 140}, {x: 950, r: 110}, {x: 1300, r: 130}];
        for (const h of hills) {
            const hx = h.x - this.cameraX * 0.6;
            ctx.beginPath();
            ctx.arc(hx, H - 40, h.r, Math.PI, 0);
            ctx.fill();
        }
    },

    drawPlatform(p) {
        const px = p.x;
        if (p.color === '#2ECC40') {
            ctx.fillStyle = '#27AE60';
            ctx.fillRect(px - 4, p.y, p.w + 8, 20);
            ctx.fillStyle = '#2ECC40';
            ctx.fillRect(px, p.y + 20, p.w, p.h - 20);
        } else {
            for (let bx = px; bx < px + p.w; bx += 32) {
                const bw = Math.min(32, px + p.w - bx);
                ctx.fillStyle = '#8B5E3C';
                ctx.fillRect(bx, p.y, bw, p.h);
                ctx.fillStyle = '#A0522D';
                ctx.fillRect(bx, p.y, bw, 4);
                if (p.h >= 40) { ctx.fillStyle = '#4CAF50'; ctx.fillRect(bx, p.y, bw, 6); }
            }
        }
    },

    drawCoin(c) {
        if (c.collected) return;
        const bob = Math.sin(c.bounce) * 4;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(c.x + 8, c.y + 8 + bob, 8, 0, Math.PI * 2);
        ctx.fill();
    },

    drawEnemy(e) {
        if (!e.alive) return;
        const h = e.squished ? 6 : e.h;
        const yOff = e.squished ? e.h - 6 : 0;
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(e.x, e.y + yOff, e.w, h);
    },

    drawPlayer() {
        const px = this.player.x;
        const py = this.player.y;
        ctx.save();
        if (this.player.facing === -1) {
            ctx.translate(px + this.player.w / 2, 0);
            ctx.scale(-1, 1);
            ctx.translate(-(px + this.player.w / 2), 0);
        }
        ctx.fillStyle = '#CC0000'; // Mario Red
        ctx.fillRect(px, py, this.player.w, this.player.h);
        ctx.restore();
    },

    drawFlag() {
        const f = this.level.flag;
        ctx.fillStyle = '#888';
        ctx.fillRect(f.x + 8, f.y, 4, f.h);
        ctx.fillStyle = '#FF4500';
        ctx.fillRect(f.x + 12, f.y, 20, 20);
    },

    intersects(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x &&
               a.y < b.y + b.h && a.y + a.h > b.y;
    },

    spawnParticles(x, y, color, n = 8) {
        for (let i = 0; i < n; i++) {
            this.particles.push({
                x, y, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8,
                life: 40, maxLife: 40, color, r: 3 + Math.random() * 4
            });
        }
    },

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life--;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    },

    drawParticles() {
        for (const p of this.particles) {
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    },

    spawnFloatText(x, y, text, color = '#FFD700') {
        this.floatingTexts.push({ x, y, text, color, life: 60, vy: -1.2 });
    },

    updateFloatingTexts() {
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const t = this.floatingTexts[i];
            t.y += t.vy; t.life--;
            if (t.life <= 0) this.floatingTexts.splice(i, 1);
        }
    },

    drawFloatingTexts() {
        ctx.font = 'bold 16px Courier New';
        for (const t of this.floatingTexts) {
            ctx.globalAlpha = t.life / 60;
            ctx.fillStyle = t.color;
            ctx.fillText(t.text, t.x, t.y);
        }
        ctx.globalAlpha = 1.0;
    },

    loop(timestamp) {
        if (this.gameState !== 'playing') return;
        
        const elapsed = timestamp - this.lastTime;
        const interval = 1000 / 60;

        if (elapsed > interval) {
            this.lastTime = timestamp - (elapsed % interval);
            this.update();
            this.draw();
        }
        
        requestAnimationFrame((t) => this.loop(t));
    },

    updateHUD() {
        document.getElementById('score').textContent = this.score.toString().padStart(3, '0');
        document.getElementById('lives-display').textContent = this.lives;
    },

    updateScoreDisplay() {
        document.getElementById('score').textContent = this.score.toString().padStart(3, '0');
    },

    updateHighScoreDisplay() {
        // ...
    }
};
