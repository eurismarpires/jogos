/**
 * Neon Platformer Module (Mario-style)
 * Lógica de plataforma com gravidade, pulo e colisão.
 */
const PlatformerGame = {
    gameRunning: false,
    gamePaused: false,
    
    // Configurações do Jogador
    player: {
        x: 50,
        y: 200,
        width: 30,
        height: 30,
        velocityX: 0,
        velocityY: 0,
        speed: 5,
        jumpForce: -12,
        grounded: false,
        color: '#00f2ff'
    },
    
    // Mundo
    gravity: 0.6,
    friction: 0.8,
    cameraX: 0,
    platforms: [],
    coins: [],
    enemies: [],
    score: 0,
    levelWidth: 3000,
    
    init() {
        this.createLevel();
    },
    
    createLevel() {
        this.platforms = [
            { x: 0, y: 550, width: 800, height: 50 }, // Chão inicial
            { x: 900, y: 550, width: 500, height: 50 },
            { x: 1500, y: 550, width: 1500, height: 50 },
            
            // Plataformas suspensas
            { x: 200, y: 400, width: 200, height: 20 },
            { x: 500, y: 300, width: 200, height: 20 },
            { x: 1000, y: 400, width: 150, height: 20 },
            { x: 1300, y: 350, width: 150, height: 20 },
            { x: 1600, y: 300, width: 200, height: 20 },
            { x: 2000, y: 400, width: 300, height: 20 }
        ];
        
        this.coins = [];
        for(let i = 0; i < 20; i++) {
            this.coins.push({
                x: 300 + i * 130,
                y: 250 + Math.random() * 200,
                radius: 8,
                collected: false
            });
        }
        
        this.enemies = [
            { x: 600, y: 520, width: 30, height: 30, speed: 2, range: 100, startX: 600 },
            { x: 1200, y: 520, width: 30, height: 30, speed: 3, range: 150, startX: 1200 },
            { x: 1800, y: 520, width: 30, height: 30, speed: 2, range: 200, startX: 1800 }
        ];
    },
    
    start() {
        this.gameRunning = true;
        this.gamePaused = false;
        this.score = 0;
        this.cameraX = 0;
        this.player.x = 50;
        this.player.y = 200;
        this.player.velocityX = 0;
        this.player.velocityY = 0;
        this.createLevel();

        // Esconde overlays
        document.getElementById('start-overlay').classList.add('hidden');
        document.getElementById('game-over-overlay').classList.add('hidden');
        
        document.getElementById('game-title').textContent = 'NEON RUN';
        this.updateScoreDisplay();

        this.loop();
    },
    
    stop() {
        this.gameRunning = false;
    },
    
    handleInput(keys, key, type) {
        // Agora o input é verificado diretamente no loop update() para maior precisão
    },
    
    update() {
        // Processar Input
        if (window.keys['ArrowRight'] || window.keys['d']) {
            if (this.player.velocityX < this.player.speed) this.player.velocityX++;
        }
        if (window.keys['ArrowLeft'] || window.keys['a']) {
            if (this.player.velocityX > -this.player.speed) this.player.velocityX--;
        }
        if ((window.keys['ArrowUp'] || window.keys['w'] || window.keys[' ']) && this.player.grounded) {
            this.player.velocityY = this.player.jumpForce;
            this.player.grounded = false;
        }

        // Gravidade e Fricção
        this.player.velocityY += this.gravity;
        this.player.velocityX *= this.friction;
        
        // Posição Temporária
        this.player.x += this.player.velocityX;
        this.player.y += this.player.velocityY;
        
        // Colisão com Chão e Plataformas
        this.player.grounded = false;
        for (let plat of this.platforms) {
            if (this.checkCollision(this.player, plat)) {
                // Colisão por cima
                if (this.player.velocityY > 0 && this.player.y + this.player.height - this.player.velocityY <= plat.y) {
                    this.player.y = plat.y - this.player.height;
                    this.player.velocityY = 0;
                    this.player.grounded = true;
                }
                // Colisão por baixo
                else if (this.player.velocityY < 0 && this.player.y - this.player.velocityY >= plat.y + plat.height) {
                    this.player.y = plat.y + plat.height;
                    this.player.velocityY = 0;
                }
                // Colisão lateral
                else {
                    this.player.x -= this.player.velocityX;
                    this.player.velocityX = 0;
                }
            }
        }
        
        // Coleta de Moedas
        for (let coin of this.coins) {
            if (!coin.collected) {
                let dx = (this.player.x + this.player.width/2) - coin.x;
                let dy = (this.player.y + this.player.height/2) - coin.y;
                let distance = Math.sqrt(dx*dx + dy*dy);
                if (distance < this.player.width/2 + coin.radius) {
                    coin.collected = true;
                    this.score += 10;
                    this.updateScoreDisplay();
                }
            }
        }
        
        // Inimigos
        for (let en of this.enemies) {
            en.x += en.speed;
            if (Math.abs(en.x - en.startX) > en.range) en.speed *= -1;
            
            if (this.checkCollision(this.player, en)) {
                this.gameOver();
            }
        }
        
        // Câmera
        this.cameraX = this.player.x - canvas.width / 4;
        if (this.cameraX < 0) this.cameraX = 0;
        if (this.cameraX > this.levelWidth - canvas.width) this.cameraX = this.levelWidth - canvas.width;
        
        // Queda no buraco
        if (this.player.y > canvas.height) {
            this.gameOver();
        }
    },
    
    checkCollision(p, r) {
        return p.x < r.x + r.width &&
               p.x + p.width > r.x &&
               p.y < r.y + r.height &&
               p.y + p.height > r.y;
    },
    
    updateScoreDisplay() {
        document.getElementById('score').textContent = this.score.toString().padStart(3, '0');
    },

    gameOver() {
        this.stop();
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over-overlay').classList.remove('hidden');
    },
    
    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.save();
        ctx.translate(-this.cameraX, 0);
        
        // Desenhar Plataformas
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#ff00ff';
        ctx.shadowColor = '#ff00ff';
        for (let plat of this.platforms) {
            ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        }
        
        // Desenhar Moedas
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ffff00';
        for (let coin of this.coins) {
            if (!coin.collected) {
                ctx.beginPath();
                ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Desenhar Inimigos
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        for (let en of this.enemies) {
            ctx.fillRect(en.x, en.y, en.width, en.height);
        }
        
        // Desenhar Jogador
        ctx.fillStyle = this.player.color;
        ctx.shadowColor = this.player.color;
        ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        ctx.restore();
    },
    
    loop() {
        if (!this.gameRunning) return;
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
};
