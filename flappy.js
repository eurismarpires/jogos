/**
 * NEON FLAPPY - Modular Logic
 */

const FlappyGame = {
    bird: { x: 50, y: 0, v: 0, size: 20 },
    pipes: [],
    score: 0,
    gravity: 0.25,
    jump: -5,
    pipeSpeed: 3,
    pipeSpawnRate: 90,
    frameCount: 0,
    gameRunning: false,

    init() {
        this.resize();
    },

    resize() {
        this.bird.x = canvas.width * 0.2;
        this.bird.size = canvas.width * 0.05;
    },

    start() {
        this.bird.y = canvas.height / 2;
        this.bird.v = 0;
        this.pipes = [];
        this.score = 0;
        this.frameCount = 0;
        this.gameRunning = true;

        document.getElementById('start-overlay').classList.add('hidden');
        document.getElementById('game-over-overlay').classList.add('hidden');
        document.getElementById('game-title').textContent = 'NEON FLAPPY';
        document.getElementById('controls-text').textContent = 'Pressione ESPAÇO ou TOQUE na tela para voar.';
        
        this.updateScoreDisplay();
        requestAnimationFrame((t) => this.loop(t));
    },

    stop() {
        this.gameRunning = false;
    },

    handleInput(keys, key, type) {
        if (!this.gameRunning) return;
        if ((type === 'keydown' && (key === ' ' || key === 'ArrowUp' || key === 'w'))) {
            this.bird.v = this.jump;
        }
    },

    onClick(e) {
        if (!this.gameRunning) return;
        this.bird.v = this.jump;
    },

    update() {
        this.bird.v += this.gravity;
        this.bird.y += this.bird.v;

        // Pipe spawning
        if (this.frameCount % this.pipeSpawnRate === 0) {
            const gap = canvas.height * 0.3;
            const minH = 50;
            const h = Math.random() * (canvas.height - gap - minH * 2) + minH;
            this.pipes.push({ x: canvas.width, h, gap, passed: false });
        }

        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const p = this.pipes[i];
            p.x -= this.pipeSpeed;

            // Score
            if (!p.passed && p.x + 50 < this.bird.x) {
                p.passed = true;
                this.score++;
                this.updateScoreDisplay();
            }

            // Collision
            if (this.bird.x + this.bird.size > p.x && this.bird.x < p.x + 50) {
                if (this.bird.y < p.h || this.bird.y + this.bird.size > p.h + p.gap) {
                    this.gameOver();
                }
            }

            if (p.x < -100) this.pipes.splice(i, 1);
        }

        // Bound collision
        if (this.bird.y < 0 || this.bird.y + this.bird.size > canvas.height) {
            this.gameOver();
        }

        this.frameCount++;
    },

    gameOver() {
        this.gameRunning = false;
        document.getElementById('game-over-title').textContent = 'COLISÃO!';
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over-overlay').classList.remove('hidden');
    },

    draw() {
        const W = canvas.width, H = canvas.height;
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, 0, W, H);

        // Draw Pipes
        ctx.shadowBlur = 10;
        this.pipes.forEach(p => {
            ctx.fillStyle = '#4facfe';
            ctx.shadowColor = '#4facfe';
            ctx.fillRect(p.x, 0, 50, p.h);
            ctx.fillRect(p.x, p.h + p.gap, 50, H - (p.h + p.gap));
            
            // Neon edge
            ctx.strokeStyle = '#00f2fe';
            ctx.lineWidth = 2;
            ctx.strokeRect(p.x, 0, 50, p.h);
            ctx.strokeRect(p.x, p.h + p.gap, 50, H - (p.h + p.gap));
        });

        // Draw Bird (Neon ship shape)
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff0080';
        ctx.fillStyle = '#ff0080';
        ctx.beginPath();
        ctx.moveTo(this.bird.x, this.bird.y);
        ctx.lineTo(this.bird.x + this.bird.size, this.bird.y + this.bird.size / 2);
        ctx.lineTo(this.bird.x, this.bird.y + this.bird.size);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;
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
