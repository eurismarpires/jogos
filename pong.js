/**
 * NEON PONG - Ping-Pong Clássico
 */

const PongGame = {
    gameRunning: false,
    animationId: null,
    
    // Configurações
    paddleWidth: 15,
    paddleHeight: 80,
    ballSize: 10,
    maxScore: 10,
    vsComputer: true,
    
    // Estado
    player1: { y: 0, score: 0, color: '#00f2fe' },
    player2: { y: 0, score: 0, color: '#ff0080' },
    ball: { x: 0, y: 0, dx: 0, dy: 0, speed: 5 },
    particles: [],

    init() {
        this.resize();
        
        const settingsHtml = `
            <div class="setting-group" style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: #00f2fe; font-family: 'Orbitron', sans-serif;">Modo de Jogo:</label>
                <select id="pong-mode" style="width: 100%; padding: 8px; background: rgba(0, 0, 0, 0.5); border: 1px solid #00f2fe; color: white; border-radius: 4px; font-family: 'Inter', sans-serif;">
                    <option value="1">1 Jogador (vs PC)</option>
                    <option value="2">2 Jogadores</option>
                </select>
            </div>
            <p style="font-size: 12px; color: #aaa; margin-top: 10px;">
                P1: W e S | P2: Setas Acima/Abaixo
            </p>
        `;
        document.getElementById('game-settings').innerHTML = settingsHtml;
    },

    resize() {
        // Redefinir posições ao redimensionar se o jogo não estiver rodando
        if (!this.gameRunning) {
            this.player1.y = (canvas.height - this.paddleHeight) / 2;
            this.player2.y = (canvas.height - this.paddleHeight) / 2;
            this.resetBall();
        }
    },

    start() {
        const modeSelect = document.getElementById('pong-mode');
        if (modeSelect) this.vsComputer = modeSelect.value === '1';

        this.player1.score = 0;
        this.player2.score = 0;
        this.player1.y = (canvas.height - this.paddleHeight) / 2;
        this.player2.y = (canvas.height - this.paddleHeight) / 2;
        this.particles = [];
        
        this.resetBall();
        
        this.gameRunning = true;

        document.getElementById('start-overlay').classList.add('hidden');
        document.getElementById('game-over-overlay').classList.add('hidden');
        
        document.getElementById('game-title').textContent = 'NEON PONG';
        document.getElementById('controls-text').textContent = 'P1: W/S | P2: Setas';
        document.getElementById('dynamic-controls').innerHTML = '<span>P1: W / S</span><span class="separator">|</span><span>P2: SETAS CIMA / BAIXO</span>';
        
        this.updateScoreDisplay();
        this.loop();
    },

    stop() {
        this.gameRunning = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
    },

    resetBall() {
        this.ball.x = canvas.width / 2;
        this.ball.y = canvas.height / 2;
        this.ball.speed = 5;
        
        // Direção aleatória inicial
        let angle = (Math.random() * Math.PI / 2) - (Math.PI / 4); // Entre -45 e 45 graus
        if (Math.random() > 0.5) angle += Math.PI; // Inverte para a esquerda 50% das vezes
        
        this.ball.dx = Math.cos(angle) * this.ball.speed;
        this.ball.dy = Math.sin(angle) * this.ball.speed;
    },

    handleInput(keys, key, type) {
        // A movimentação real acontece no loop baseada no objeto keys global
    },

    loop() {
        if (!this.gameRunning) return;
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.loop());
    },

    update() {
        // --- Movimentação Player 1 (Esquerda) ---
        if (window.keys['w'] || window.keys['W']) {
            this.player1.y -= 7;
        }
        if (window.keys['s'] || window.keys['S']) {
            this.player1.y += 7;
        }

        // --- Movimentação Player 2 (Direita) ---
        if (this.vsComputer) {
            // Inteligência Artificial Simples
            const centerP2 = this.player2.y + this.paddleHeight / 2;
            // Só move se a bola estiver vindo em sua direção
            if (this.ball.dx > 0) {
                if (centerP2 < this.ball.y - 10) {
                    this.player2.y += 5;
                } else if (centerP2 > this.ball.y + 10) {
                    this.player2.y -= 5;
                }
            } else {
                // Retorna ao centro lentamente
                if (centerP2 < canvas.height / 2 - 10) this.player2.y += 2;
                else if (centerP2 > canvas.height / 2 + 10) this.player2.y -= 2;
            }
        } else {
            // Controle Manual
            if (window.keys['ArrowUp']) {
                this.player2.y -= 7;
            }
            if (window.keys['ArrowDown']) {
                this.player2.y += 7;
            }
        }

        // Limita as raquetes na tela
        this.player1.y = Math.max(0, Math.min(canvas.height - this.paddleHeight, this.player1.y));
        this.player2.y = Math.max(0, Math.min(canvas.height - this.paddleHeight, this.player2.y));

        // --- Movimentação da Bola ---
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;

        // Adiciona partícula de rastro
        this.particles.push({
            x: this.ball.x,
            y: this.ball.y,
            life: 1.0
        });

        // Atualiza partículas
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].life -= 0.05;
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Colisão com o teto e chão
        if (this.ball.y - this.ballSize < 0) {
            this.ball.y = this.ballSize;
            this.ball.dy *= -1;
            this.createExplosion(this.ball.x, 0, '#ffffff');
        } else if (this.ball.y + this.ballSize > canvas.height) {
            this.ball.y = canvas.height - this.ballSize;
            this.ball.dy *= -1;
            this.createExplosion(this.ball.x, canvas.height, '#ffffff');
        }

        // Colisão com Raquete 1 (Esquerda)
        if (this.ball.dx < 0 && this.ball.x - this.ballSize < this.paddleWidth + 10 && this.ball.x > 10) {
            if (this.ball.y > this.player1.y && this.ball.y < this.player1.y + this.paddleHeight) {
                this.ball.dx *= -1;
                
                // Muda o ângulo baseado em onde bateu na raquete
                let hitPoint = (this.ball.y - (this.player1.y + this.paddleHeight / 2)) / (this.paddleHeight / 2);
                let angle = hitPoint * (Math.PI / 4); // Máximo 45 graus
                
                this.ball.speed = Math.min(this.ball.speed + 0.2, 12); // Aumenta a velocidade
                this.ball.dx = Math.cos(angle) * this.ball.speed;
                this.ball.dy = Math.sin(angle) * this.ball.speed;
                
                this.createExplosion(this.paddleWidth + 10, this.ball.y, this.player1.color);
            }
        }

        // Colisão com Raquete 2 (Direita)
        if (this.ball.dx > 0 && this.ball.x + this.ballSize > canvas.width - this.paddleWidth - 10 && this.ball.x < canvas.width - 10) {
            if (this.ball.y > this.player2.y && this.ball.y < this.player2.y + this.paddleHeight) {
                this.ball.dx *= -1;
                
                let hitPoint = (this.ball.y - (this.player2.y + this.paddleHeight / 2)) / (this.paddleHeight / 2);
                let angle = hitPoint * (Math.PI / 4); // Máximo 45 graus
                
                this.ball.speed = Math.min(this.ball.speed + 0.2, 12);
                this.ball.dx = -Math.cos(angle) * this.ball.speed; // Negativo para ir para esquerda
                this.ball.dy = Math.sin(angle) * this.ball.speed;
                
                this.createExplosion(canvas.width - this.paddleWidth - 10, this.ball.y, this.player2.color);
            }
        }

        // Pontuação
        if (this.ball.x < 0) {
            this.player2.score++;
            this.checkWinCondition();
        } else if (this.ball.x > canvas.width) {
            this.player1.score++;
            this.checkWinCondition();
        }
    },

    checkWinCondition() {
        this.updateScoreDisplay();
        this.createExplosion(this.ball.x, this.ball.y, '#ffffff', 50); // Grande explosão
        
        if (this.player1.score >= this.maxScore) {
            setTimeout(() => this.gameOver('JOGADOR 1 (AZUL)'), 500);
        } else if (this.player2.score >= this.maxScore) {
            const p2Name = this.vsComputer ? 'COMPUTADOR' : 'JOGADOR 2 (ROSA)';
            setTimeout(() => this.gameOver(p2Name), 500);
        } else {
            this.resetBall();
        }
    },

    createExplosion(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1.0,
                color: color,
                isExplosion: true
            });
        }
    },

    draw() {
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Linha central pontilhada
        ctx.setLineDash([15, 15]);
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]); // Reseta linha tracejada

        // Desenha Partículas (Rastro e Explosões)
        for (let p of this.particles) {
            ctx.globalAlpha = p.life;
            if (p.isExplosion) {
                p.x += p.vx;
                p.y += p.vy;
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 5;
                ctx.beginPath();
                ctx.arc(p.x, p.y, this.ballSize * p.life, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;

        // Raquete 1 (Esquerda)
        ctx.fillStyle = this.player1.color;
        ctx.shadowColor = this.player1.color;
        ctx.shadowBlur = 15;
        ctx.fillRect(10, this.player1.y, this.paddleWidth, this.paddleHeight);

        // Raquete 2 (Direita)
        ctx.fillStyle = this.player2.color;
        ctx.shadowColor = this.player2.color;
        ctx.shadowBlur = 15;
        ctx.fillRect(canvas.width - this.paddleWidth - 10, this.player2.y, this.paddleWidth, this.paddleHeight);

        // Bola
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(this.ball.x, this.ball.y, this.ballSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Rótulos de Identificação
        ctx.font = '12px Orbitron';
        ctx.fillStyle = this.player1.color;
        ctx.textAlign = 'left';
        ctx.fillText('VOCÊ (AZUL)', 20, canvas.height - 10);
        
        ctx.fillStyle = this.player2.color;
        ctx.textAlign = 'right';
        ctx.fillText(this.vsComputer ? 'CPU (ROSA)' : 'JOGADOR 2 (ROSA)', canvas.width - 20, canvas.height - 10);
    },

    updateScoreDisplay() {
        document.getElementById('score').textContent = `${this.player1.score} x ${this.player2.score}`;
        document.getElementById('high-score').textContent = `MÁX: ${this.maxScore}`;
    },

    gameOver(winner) {
        this.gameRunning = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        
        document.getElementById('game-over-title').textContent = winner + ' VENCEU!';
        document.getElementById('final-score').textContent = `${this.player1.score} a ${this.player2.score}`;
        document.getElementById('game-over-overlay').classList.remove('hidden');
    }
};
