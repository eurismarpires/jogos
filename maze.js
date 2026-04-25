/**
 * NEON MAZE - Estilo Pac-Man
 */

const MazeGame = {
    gameRunning: false,
    tileSize: 0,
    score: 0,
    highScore: 0,
    lives: 3,
    animationId: null,
    
    // Configurações do Labirinto
    cols: 19,
    rows: 19,
    mapTemplate: [
        "1111111111111111111",
        "1000000001000000001",
        "1211101111111011121",
        "1000000000000000001",
        "1011101011101011101",
        "1000001001001000001",
        "1111101113111011111",
        "3333101333331013333",
        "1111101311131011111",
        "0000003313133000000",
        "1111101311131011111",
        "3333101333331013333",
        "1111101311131011111",
        "1000000001000000001",
        "1211101111111011121",
        "1000100000000010001",
        "1110101011101010111",
        "1000001001001000001",
        "1111111111111111111"
    ],
    map: [],
    totalDots: 0,

    player: { x: 9, y: 15, dx: 0, dy: 0, nextDx: 0, nextDy: 0, realX: 9, realY: 15, speed: 0.1 },
    ghosts: [],
    powerMode: false,
    powerTimer: 0,

    init() {
        this.highScore = parseInt(localStorage.getItem('neonMazeHighScore')) || 0;
        this.resize();
    },

    resize() {
        this.tileSize = canvas.width / this.cols;
    },

    resetMap() {
        this.map = [];
        this.totalDots = 0;
        for (let y = 0; y < this.rows; y++) {
            let row = [];
            for (let x = 0; x < this.cols; x++) {
                let cell = parseInt(this.mapTemplate[y][x]);
                row.push(cell);
                if (cell === 0 || cell === 2) this.totalDots++;
            }
            this.map.push(row);
        }
    },

    start() {
        this.resetMap();
        this.score = 0;
        this.lives = 3;
        this.gameRunning = true;
        this.powerMode = false;
        
        this.initEntities();

        document.getElementById('start-overlay').classList.add('hidden');
        document.getElementById('game-over-overlay').classList.add('hidden');
        
        document.getElementById('game-title').textContent = 'NEON MAZE';
        document.getElementById('controls-text').textContent = 'Use as setas para se movimentar';
        document.getElementById('dynamic-controls').innerHTML = '<span>SETAS / WASD</span>';
        
        document.getElementById('lives-container').style.display = 'flex';
        
        this.updateScoreDisplay();
        this.loop();
    },

    initEntities() {
        // Setup Player
        this.player = { x: 9, y: 15, dx: 0, dy: 0, nextDx: 0, nextDy: 0, realX: 9, realY: 15, speed: 0.15 };
        
        // Setup Ghosts
        this.ghosts = [
            { id: 1, x: 8, y: 9, realX: 8, realY: 9, dx: 1, dy: 0, speed: 0.1, color: '#ff0055', startDelay: 0 },
            { id: 2, x: 9, y: 9, realX: 9, realY: 9, dx: 0, dy: -1, speed: 0.1, color: '#00ffff', startDelay: 60 },
            { id: 3, x: 10, y: 9, realX: 10, realY: 9, dx: -1, dy: 0, speed: 0.1, color: '#ffaa00', startDelay: 120 }
        ];
    },

    stop() {
        this.gameRunning = false;
        document.getElementById('lives-container').style.display = 'none';
        if (this.animationId) cancelAnimationFrame(this.animationId);
    },

    handleInput(keys, key, type) {
        if (!this.gameRunning || type !== 'keydown') return;
        
        const k = key.toLowerCase();
        
        if (k === 'arrowup' || k === 'w') { this.player.nextDx = 0; this.player.nextDy = -1; }
        if (k === 'arrowdown' || k === 's') { this.player.nextDx = 0; this.player.nextDy = 1; }
        if (k === 'arrowleft' || k === 'a') { this.player.nextDx = -1; this.player.nextDy = 0; }
        if (k === 'arrowright' || k === 'd') { this.player.nextDx = 1; this.player.nextDy = 0; }
    },

    loop() {
        if (!this.gameRunning) return;
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.loop());
    },

    update() {
        // Power Mode Timer
        if (this.powerMode) {
            this.powerTimer--;
            if (this.powerTimer <= 0) {
                this.powerMode = false;
                this.ghosts.forEach(g => {
                    // Reseta posição caso tenha sido comido
                    if(g.eaten) {
                        g.eaten = false;
                        g.x = 9; g.y = 9; g.realX = 9; g.realY = 9;
                    }
                });
            }
        }

        this.updateEntity(this.player, true);
        
        // Verifica comer bolinha
        let px = Math.round(this.player.realX);
        let py = Math.round(this.player.realY);
        
        if (px >= 0 && px < this.cols && py >= 0 && py < this.rows) {
            if (this.map[py][px] === 0) {
                this.map[py][px] = 3;
                this.score += 10;
                this.totalDots--;
                this.updateScoreDisplay();
            } else if (this.map[py][px] === 2) {
                this.map[py][px] = 3;
                this.score += 50;
                this.totalDots--;
                this.activatePowerMode();
                this.updateScoreDisplay();
            }
        }

        // Condição de Vitória
        if (this.totalDots <= 0) {
            this.checkHighScore();
            this.gameOver('win');
            return;
        }

        // Update Ghosts
        for (let g of this.ghosts) {
            if (g.startDelay > 0) {
                g.startDelay--;
                continue;
            }
            if (g.eaten) continue; // Fantasma comido volta pra base e fica lá até o fim do power mode

            this.updateEntity(g, false);

            // AI Simples para fantasmas nas interseções
            if (Number.isInteger(g.realX) && Number.isInteger(g.realY)) {
                let possible = [];
                const dirs = [[0,-1], [0,1], [-1,0], [1,0]];
                for (let d of dirs) {
                    // Não deixa voltar 180 graus (a menos que não tenha opção)
                    if (d[0] === -g.dx && d[1] === -g.dy) continue;
                    
                    let nx = g.x + d[0];
                    let ny = g.y + d[1];
                    if (this.isWalkable(nx, ny)) {
                        possible.push(d);
                    }
                }
                
                if (possible.length > 0) {
                    let choice = possible[Math.floor(Math.random() * possible.length)];
                    g.dx = choice[0];
                    g.dy = choice[1];
                } else {
                    // Beco sem saída, vira pra trás
                    g.dx = -g.dx;
                    g.dy = -g.dy;
                }
            }

            // Colisão com o jogador
            let dist = Math.hypot(g.realX - this.player.realX, g.realY - this.player.realY);
            if (dist < 0.8) {
                if (this.powerMode) {
                    // Come fantasma
                    g.eaten = true;
                    this.score += 200;
                    this.updateScoreDisplay();
                } else {
                    // Morre
                    this.lives--;
                    this.updateScoreDisplay();
                    if (this.lives <= 0) {
                        this.checkHighScore();
                        this.gameOver('lose');
                        return;
                    } else {
                        this.initEntities();
                        return;
                    }
                }
            }
        }
    },

    checkHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('neonMazeHighScore', this.highScore);
            this.updateScoreDisplay();
        }
    },

    activatePowerMode() {
        this.powerMode = true;
        this.powerTimer = 300; // 5 segundos aprox (a 60fps)
    },

    updateEntity(ent, isPlayer) {
        if (Number.isInteger(ent.realX) && Number.isInteger(ent.realY)) {
            // Está exatamente no grid. Permite mudar a direção se a nextD for válida
            if (ent.nextDx !== undefined && (ent.nextDx !== ent.dx || ent.nextDy !== ent.dy)) {
                if (this.isWalkable(ent.x + ent.nextDx, ent.y + ent.nextDy)) {
                    ent.dx = ent.nextDx;
                    ent.dy = ent.nextDy;
                }
            }
            
            // Verifica se bateu na parede
            if (!this.isWalkable(ent.x + ent.dx, ent.y + ent.dy)) {
                if (isPlayer) {
                    ent.dx = 0; ent.dy = 0;
                } else {
                    // Para os fantasmas, a IA vai forçar mudança no update principal
                }
            } else {
                ent.x += ent.dx;
                ent.y += ent.dy;
            }
            
            // Túnel (wrapping)
            if (ent.x < 0) { ent.x = this.cols - 1; ent.realX = this.cols; }
            if (ent.x >= this.cols) { ent.x = 0; ent.realX = -1; }
        }

        // Movimento suave
        if (ent.realX < ent.x) ent.realX = Math.min(ent.x, ent.realX + ent.speed);
        if (ent.realX > ent.x) ent.realX = Math.max(ent.x, ent.realX - ent.speed);
        if (ent.realY < ent.y) ent.realY = Math.min(ent.y, ent.realY + ent.speed);
        if (ent.realY > ent.y) ent.realY = Math.max(ent.y, ent.realY - ent.speed);
        
        // Arredonda para não ter problemas de float
        if (Math.abs(ent.realX - ent.x) < 0.01) ent.realX = ent.x;
        if (Math.abs(ent.realY - ent.y) < 0.01) ent.realY = ent.y;
    },

    isWalkable(x, y) {
        if (x < 0 || x >= this.cols) return true; // Túnel lateral
        if (y < 0 || y >= this.rows) return false;
        return this.map[y][x] !== 1;
    },

    draw() {
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const ts = this.tileSize;

        // Draw Map
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                let cell = this.map[y][x];
                
                if (cell === 1) { // Parede
                    ctx.fillStyle = 'rgba(0, 100, 255, 0.2)';
                    ctx.strokeStyle = '#0066ff';
                    ctx.lineWidth = 2;
                    ctx.shadowColor = '#0066ff';
                    ctx.shadowBlur = 5;
                    ctx.fillRect(x * ts, y * ts, ts, ts);
                    ctx.strokeRect(x * ts, y * ts, ts, ts);
                    ctx.shadowBlur = 0;
                } else if (cell === 0) { // Ponto Normal
                    ctx.fillStyle = '#ffffaa';
                    ctx.beginPath();
                    ctx.arc(x * ts + ts/2, y * ts + ts/2, ts * 0.15, 0, Math.PI*2);
                    ctx.fill();
                } else if (cell === 2) { // Ponto de Energia
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = '#ffffff';
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.arc(x * ts + ts/2, y * ts + ts/2, ts * 0.35, 0, Math.PI*2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            }
        }

        // Draw Player
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        
        let mouthOpen = (Date.now() % 300) < 150 ? 0.2 : 0;
        let angleOffset = 0;
        if (this.player.dx === 1) angleOffset = 0;
        if (this.player.dx === -1) angleOffset = Math.PI;
        if (this.player.dy === 1) angleOffset = Math.PI/2;
        if (this.player.dy === -1) angleOffset = -Math.PI/2;
        
        ctx.arc(
            this.player.realX * ts + ts/2, 
            this.player.realY * ts + ts/2, 
            ts * 0.4, 
            angleOffset + mouthOpen * Math.PI, 
            angleOffset + (2 - mouthOpen) * Math.PI
        );
        ctx.lineTo(this.player.realX * ts + ts/2, this.player.realY * ts + ts/2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw Ghosts
        for (let g of this.ghosts) {
            if (g.eaten) continue;
            
            let drawColor = this.powerMode ? 
                (this.powerTimer < 60 && (this.powerTimer % 10 < 5) ? '#ffffff' : '#0000ff') : 
                g.color;

            ctx.fillStyle = drawColor;
            ctx.shadowColor = drawColor;
            ctx.shadowBlur = 15;
            
            let gx = g.realX * ts + ts/2;
            let gy = g.realY * ts + ts/2;
            let r = ts * 0.4;
            
            ctx.beginPath();
            ctx.arc(gx, gy, r, Math.PI, 0); // Cabeça curva
            ctx.lineTo(gx + r, gy + r); // Lado direito
            
            // Base ondulada
            ctx.lineTo(gx + r*0.5, gy + r*0.8);
            ctx.lineTo(gx, gy + r);
            ctx.lineTo(gx - r*0.5, gy + r*0.8);
            
            ctx.lineTo(gx - r, gy + r); // Lado esquerdo
            ctx.closePath();
            ctx.fill();
            
            // Olhos
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 0;
            ctx.beginPath(); ctx.arc(gx - r*0.4, gy - r*0.2, r*0.25, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(gx + r*0.4, gy - r*0.2, r*0.25, 0, Math.PI*2); ctx.fill();
            
            // Pupilas
            ctx.fillStyle = '#000000';
            let px = g.dx * r * 0.1;
            let py = g.dy * r * 0.1;
            ctx.beginPath(); ctx.arc(gx - r*0.4 + px, gy - r*0.2 + py, r*0.1, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(gx + r*0.4 + px, gy - r*0.2 + py, r*0.1, 0, Math.PI*2); ctx.fill();
        }
    },

    updateScoreDisplay() {
        document.getElementById('score').textContent = this.score.toString().padStart(4, '0');
        document.getElementById('high-score').textContent = this.highScore.toString().padStart(4, '0');
        document.getElementById('lives-display').textContent = this.lives;
    },

    gameOver(state) {
        this.gameRunning = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        
        const title = state === 'win' ? 'VOCÊ VENCEU!' : 'FIM DE JOGO';
        document.getElementById('game-over-title').textContent = title;
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over-overlay').classList.remove('hidden');
    }
};
