/**
 * NEON BRICKS - Estilo Breakout / Arkanoid
 */

const BricksGame = {
    gameRunning: false,
    animationId: null,
    score: 0,
    highScore: 0,
    lives: 3,
    
    // Configurações
    paddle: { x: 0, y: 0, width: 100, height: 15, dx: 0, speed: 8 },
    ball: { x: 0, y: 0, dx: 0, dy: 0, radius: 8, speed: 6 },
    
    // Tijolos
    brickRowCount: 6,
    brickColumnCount: 8,
    brickWidth: 0,
    brickHeight: 25,
    brickPadding: 10,
    brickOffsetTop: 60,
    brickOffsetLeft: 10,
    bricks: [],
    
    // Efeitos
    particles: [],

    // Cores Neon (uma cor por linha)
    colors: ['#ff0055', '#ff00ff', '#aa00ff', '#0000ff', '#00f2fe', '#00ff00'],

    init() {
        this.highScore = parseInt(localStorage.getItem('neonBricksHighScore')) || 0;
        this.resize();
    },

    resize() {
        this.paddle.y = canvas.height - 30;
        this.paddle.x = (canvas.width - this.paddle.width) / 2;
        
        // Recalcular largura dos tijolos para preencher a tela
        this.brickOffsetLeft = 20;
        const availableWidth = canvas.width - (this.brickOffsetLeft * 2);
        this.brickWidth = (availableWidth - (this.brickPadding * (this.brickColumnCount - 1))) / this.brickColumnCount;
    },

    resetBricks() {
        this.bricks = [];
        for (let c = 0; c < this.brickColumnCount; c++) {
            this.bricks[c] = [];
            for (let r = 0; r < this.brickRowCount; r++) {
                this.bricks[c][r] = { x: 0, y: 0, status: 1, color: this.colors[r] };
            }
        }
    },

    resetBall() {
        this.ball.x = canvas.width / 2;
        this.ball.y = canvas.height - 50;
        this.ball.dx = (Math.random() > 0.5 ? 1 : -1) * this.ball.speed * 0.7;
        this.ball.dy = -this.ball.speed;
        
        this.paddle.x = (canvas.width - this.paddle.width) / 2;
    },

    start() {
        this.score = 0;
        this.lives = 3;
        this.particles = [];
        this.resetBricks();
        this.resetBall();
        
        this.gameRunning = true;

        document.getElementById('start-overlay').classList.add('hidden');
        document.getElementById('game-over-overlay').classList.add('hidden');
        
        document.getElementById('game-title').textContent = 'NEON BRICKS';
        document.getElementById('controls-text').textContent = 'Use Setas Esquerda/Direita ou A/D para mover';
        document.getElementById('dynamic-controls').innerHTML = '<span>SETAS / A D (MOVER)</span>';
        
        document.getElementById('lives-container').style.display = 'flex';
        
        this.updateScoreDisplay();
        this.loop();
    },

    stop() {
        this.gameRunning = false;
        document.getElementById('lives-container').style.display = 'none';
        if (this.animationId) cancelAnimationFrame(this.animationId);
    },

    handleInput(keys, key, type) {
        // Movimentação é baseada no keys contínuo no loop
    },

    loop() {
        if (!this.gameRunning) return;
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.loop());
    },

    update() {
        // --- Movimentação da Raquete ---
        if (window.keys['ArrowLeft'] || window.keys['a'] || window.keys['A']) {
            this.paddle.x -= this.paddle.speed;
        }
        if (window.keys['ArrowRight'] || window.keys['d'] || window.keys['D']) {
            this.paddle.x += this.paddle.speed;
        }

        // Limites da Raquete
        if (this.paddle.x < 0) this.paddle.x = 0;
        if (this.paddle.x + this.paddle.width > canvas.width) this.paddle.x = canvas.width - this.paddle.width;

        // --- Movimentação da Bola ---
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;

        // Rastro da bola
        this.particles.push({
            x: this.ball.x,
            y: this.ball.y,
            life: 1.0,
            type: 'trail'
        });

        // Atualização de Partículas
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.life -= p.type === 'trail' ? 0.08 : 0.02;
            
            if (p.type === 'explosion') {
                p.x += p.vx;
                p.y += p.vy;
            }
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // --- Colisões com as Paredes ---
        // Esquerda / Direita
        if (this.ball.x - this.ball.radius < 0 || this.ball.x + this.ball.radius > canvas.width) {
            this.ball.dx *= -1;
            this.ball.x = this.ball.x < canvas.width / 2 ? this.ball.radius : canvas.width - this.ball.radius;
        }
        // Teto
        if (this.ball.y - this.ball.radius < 0) {
            this.ball.dy *= -1;
            this.ball.y = this.ball.radius;
        }
        // Chão (Morte)
        else if (this.ball.y + this.ball.radius > canvas.height) {
            this.lives--;
            this.updateScoreDisplay();
            
            if (this.lives === 0) {
                this.checkHighScore();
                this.gameOver('lose');
                return;
            } else {
                this.resetBall();
            }
        }

        // --- Colisão com a Raquete ---
        if (this.ball.dy > 0 && 
            this.ball.y + this.ball.radius >= this.paddle.y && 
            this.ball.y - this.ball.radius <= this.paddle.y + this.paddle.height) {
            
            if (this.ball.x >= this.paddle.x && this.ball.x <= this.paddle.x + this.paddle.width) {
                this.ball.dy *= -1;
                this.ball.y = this.paddle.y - this.ball.radius;
                
                // Mudar ângulo baseado no ponto de impacto na raquete
                let hitPoint = this.ball.x - (this.paddle.x + this.paddle.width / 2);
                let normalizedHit = hitPoint / (this.paddle.width / 2);
                let bounceAngle = normalizedHit * (Math.PI / 3); // Max 60 graus
                
                // Aumentar a velocidade um pouquinho a cada rebatida
                let currentSpeed = Math.hypot(this.ball.dx, this.ball.dy);
                let newSpeed = Math.min(currentSpeed + 0.1, 12);
                
                this.ball.dx = newSpeed * Math.sin(bounceAngle);
                this.ball.dy = -newSpeed * Math.cos(bounceAngle);
                
                this.createExplosion(this.ball.x, this.ball.y, '#00f2fe', 10);
            }
        }

        // --- Colisão com Tijolos ---
        let bricksLeft = 0;
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                let b = this.bricks[c][r];
                if (b.status === 1) {
                    bricksLeft++;
                    let brickX = (c * (this.brickWidth + this.brickPadding)) + this.brickOffsetLeft;
                    let brickY = (r * (this.brickHeight + this.brickPadding)) + this.brickOffsetTop;
                    b.x = brickX;
                    b.y = brickY;

                    // Colisão Simples AABB -> Círculo
                    if (this.ball.x + this.ball.radius > b.x && 
                        this.ball.x - this.ball.radius < b.x + this.brickWidth && 
                        this.ball.y + this.ball.radius > b.y && 
                        this.ball.y - this.ball.radius < b.y + this.brickHeight) {
                        
                        this.ball.dy *= -1;
                        b.status = 0;
                        this.score += 10;
                        this.updateScoreDisplay();
                        
                        this.createExplosion(b.x + this.brickWidth/2, b.y + this.brickHeight/2, b.color, 15);
                    }
                }
            }
        }

        // Vitória
        if (bricksLeft === 0) {
            this.checkHighScore();
            this.gameOver('win');
        }
    },
    
    checkHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('neonBricksHighScore', this.highScore);
            this.updateScoreDisplay();
        }
    },

    createExplosion(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1.0,
                color: color,
                type: 'explosion'
            });
        }
    },

    draw() {
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Particles
        for (let p of this.particles) {
            ctx.globalAlpha = Math.max(0, p.life);
            
            if (p.type === 'trail') {
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 5;
                ctx.beginPath();
                ctx.arc(p.x, p.y, this.ball.radius * p.life, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 4 * p.life, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;

        // Draw Bricks
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                if (this.bricks[c][r].status === 1) {
                    let b = this.bricks[c][r];
                    ctx.fillStyle = 'rgba(0,0,0,0.5)';
                    ctx.strokeStyle = b.color;
                    ctx.lineWidth = 2;
                    ctx.shadowColor = b.color;
                    ctx.shadowBlur = 10;
                    
                    ctx.fillRect(b.x, b.y, this.brickWidth, this.brickHeight);
                    ctx.strokeRect(b.x, b.y, this.brickWidth, this.brickHeight);
                    ctx.shadowBlur = 0;
                }
            }
        }

        // Draw Paddle
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00f2fe';
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        ctx.roundRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height, 5);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw Ball
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    },

    updateScoreDisplay() {
        document.getElementById('score').textContent = this.score.toString().padStart(4, '0');
        document.getElementById('high-score').textContent = this.highScore.toString().padStart(4, '0');
        document.getElementById('lives-display').textContent = this.lives;
    },

    gameOver(state) {
        this.gameRunning = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        
        const title = state === 'win' ? 'VITÓRIA NEON!' : 'FIM DE JOGO';
        document.getElementById('game-over-title').textContent = title;
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over-overlay').classList.remove('hidden');
    }
};
