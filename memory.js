/**
 * NEON MEMORY - Modular Logic
 */

const MemoryGame = {
    cards: [],
    flipped: [],
    matches: 0,
    moves: 0,
    size: 4, // 4x4
    gameRunning: false,
    lock: false,
    icons: ['⚡', '🔥', '💎', '🚀', '⭐', '🌈', '🛸', '👾'],

    init() {
        this.resize();
    },

    resize() {
        this.boardSize = Math.min(canvas.width, canvas.height) * 0.9;
        this.cellSize = this.boardSize / this.size;
    },

    start() {
        this.cards = [];
        this.flipped = [];
        this.matches = 0;
        this.moves = 0;
        this.gameRunning = true;
        this.lock = false;

        // Create pairs
        let deck = [...this.icons, ...this.icons];
        this.shuffle(deck);

        for (let i = 0; i < 16; i++) {
            this.cards.push({
                icon: deck[i],
                isFlipped: false,
                isMatched: false,
                anim: 0
            });
        }

        document.getElementById('start-overlay').classList.add('hidden');
        document.getElementById('game-over-overlay').classList.add('hidden');
        document.getElementById('game-title').textContent = 'NEON MEMORY';
        document.getElementById('controls-text').textContent = 'Clique nas cartas para encontrar os pares.';
        
        this.updateScoreDisplay();
        requestAnimationFrame((t) => this.loop(t));
    },

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    },

    onClick(e) {
        if (!this.gameRunning || this.lock) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const offsetX = (canvas.width - this.boardSize) / 2;
        const offsetY = (canvas.height - this.boardSize) / 2;

        const c = Math.floor((x - offsetX) / this.cellSize);
        const r = Math.floor((y - offsetY) / this.cellSize);
        const idx = r * 4 + c;

        if (r >= 0 && r < 4 && c >= 0 && c < 4) {
            this.flipCard(idx);
        }
    },

    flipCard(idx) {
        const card = this.cards[idx];
        if (card.isFlipped || card.isMatched || this.flipped.length >= 2) return;

        card.isFlipped = true;
        this.flipped.push(idx);

        if (this.flipped.length === 2) {
            this.moves++;
            this.updateScoreDisplay();
            this.checkMatch();
        }
    },

    checkMatch() {
        this.lock = true;
        const [i1, i2] = this.flipped;
        const c1 = this.cards[i1];
        const c2 = this.cards[i2];

        if (c1.icon === c2.icon) {
            c1.isMatched = true;
            c2.isMatched = true;
            this.matches++;
            this.flipped = [];
            this.lock = false;
            if (this.matches === 8) this.gameOver();
        } else {
            setTimeout(() => {
                c1.isFlipped = false;
                c2.isFlipped = false;
                this.flipped = [];
                this.lock = false;
            }, 800);
        }
    },

    gameOver() {
        this.gameRunning = false;
        document.getElementById('game-over-title').textContent = 'PARABÉNS!';
        document.getElementById('final-score').textContent = `Jogadas: ${this.moves}`;
        document.getElementById('game-over-overlay').classList.remove('hidden');
    },

    draw() {
        const W = canvas.width, H = canvas.height;
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, 0, W, H);

        const offsetX = (W - this.boardSize) / 2;
        const offsetY = (H - this.boardSize) / 2;

        ctx.save();
        ctx.translate(offsetX, offsetY);

        this.cards.forEach((card, i) => {
            const r = Math.floor(i / 4);
            const c = i % 4;
            const x = c * this.cellSize + 5;
            const y = r * this.cellSize + 5;
            const size = this.cellSize - 10;

            if (card.isFlipped || card.isMatched) {
                // Card Front
                ctx.fillStyle = '#1a1a2e';
                ctx.strokeStyle = '#00f2fe';
                ctx.lineWidth = 2;
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#00f2fe';
                this.roundRect(x, y, size, size, 12);
                ctx.fill();
                ctx.stroke();

                ctx.shadowBlur = 0;
                ctx.fillStyle = '#ffffff';
                ctx.font = `${size * 0.5}px Orbitron`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(card.icon, x + size/2, y + size/2);
            } else {
                // Card Back
                ctx.fillStyle = '#1a1a2e';
                ctx.strokeStyle = '#ff0080';
                ctx.lineWidth = 2;
                ctx.shadowBlur = 5;
                ctx.shadowColor = '#ff0080';
                this.roundRect(x, y, size, size, 12);
                ctx.fill();
                ctx.stroke();
                
                // Pattern
                ctx.strokeStyle = 'rgba(255,0,128,0.2)';
                ctx.beginPath();
                ctx.moveTo(x + 10, y + 10);
                ctx.lineTo(x + size - 10, y + size - 10);
                ctx.stroke();
            }
        });

        ctx.restore();
    },

    roundRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    },

    loop(timestamp) {
        if (!this.gameRunning) return;
        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    },

    updateScoreDisplay() {
        document.getElementById('score').textContent = this.moves.toString().padStart(3, '0');
    }
};
