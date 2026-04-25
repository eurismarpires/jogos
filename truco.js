/**
 * NEON TRUCO - Modular Logic (Simplified 1v1)
 */

const TrucoGame = {
    deck: [],
    playerHand: [],
    cpuHand: [],
    vira: null,
    manilhaRank: null,
    
    rounds: [], // { winner: 'player'|'cpu'|'empate' }
    gamePoints: { player: 0, cpu: 0 },
    handPoints: 1, // Current hand value (1, 3, 6, 9, 12)
    
    turn: 'player', // who plays now
    dealer: 'player',
    handStarter: 'player', // who started the current hand (round 1)
    roundStarter: 'player', // who started the current round
    
    gameState: 'playing', // 'playing', 'truco_offered', 'game_over'
    trucoOfferedBy: null,
    
    cardsPlayed: { player: null, cpu: null },
    message: '',
    messageTimer: 0,
    
    gameRunning: false,
    lastTime: 0,

    // Ranks: 4, 5, 6, 7, Q, J, K, A, 2, 3
    ranks: ['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3'],
    suits: ['♦', '♠', '♥', '♣'], // Diamonds, Spades, Hearts, Clubs

    init() {
        this.resize();
        // Suporte a toque direto no celular
        canvas.addEventListener('touchstart', (e) => {
            if (this.gameRunning) {
                const touch = e.touches[0];
                const rect = canvas.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                this.handleClick(x, y);
                e.preventDefault();
            }
        }, { passive: false });
    },

    resize() {
        // Redimensionamento já é tratado pelo main.js
    },

    start() {
        this.gamePoints = { player: 0, cpu: 0 };
        this.dealer = 'player';
        this.newHand();
        this.gameRunning = true;
        this.gameState = 'playing';

        document.getElementById('start-overlay').classList.add('hidden');
        document.getElementById('game-over-overlay').classList.add('hidden');
        document.getElementById('game-title').textContent = 'NEON TRUCO';
        document.getElementById('controls-text').textContent = 'Toque nas cartas para jogar. Use os botões para TRUCO.';
        
        this.updateScoreDisplay();
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    },

    stop() {
        this.gameRunning = false;
    },

    newHand() {
        this.deck = this.createDeck();
        this.shuffle(this.deck);
        
        this.playerHand = [this.deck.pop(), this.deck.pop(), this.deck.pop()];
        this.cpuHand = [this.deck.pop(), this.deck.pop(), this.deck.pop()];
        this.vira = this.deck.pop();
        
        // Determine manilha
        const viraIdx = this.ranks.indexOf(this.vira.rank);
        const manilhaIdx = (viraIdx + 1) % this.ranks.length;
        this.manilhaRank = this.ranks[manilhaIdx];
        
        this.rounds = [];
        this.handPoints = 1;
        this.cardsPlayed = { player: null, cpu: null };
        this.gameState = 'playing';
        this.trucoOfferedBy = null;
        
        // Toggle dealer/starter
        this.handStarter = (this.dealer === 'player') ? 'cpu' : 'player';
        this.roundStarter = this.handStarter;
        this.turn = this.handStarter;
        this.dealer = this.handStarter; // Next dealer is the one who didn't deal

        this.showMsg(`Nova Mão! Vira: ${this.vira.rank}${this.vira.suit}`);
        
        if (this.turn === 'cpu') {
            setTimeout(() => this.cpuPlay(), 1500);
        }
    },

    createDeck() {
        const d = [];
        for (let r of this.ranks) {
            for (let s of this.suits) {
                d.push({ rank: r, suit: s });
            }
        }
        return d;
    },

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    },

    getCardValue(card) {
        if (card.rank === this.manilhaRank) {
            // Manilhas are ranked by suit
            return 100 + this.suits.indexOf(card.suit);
        }
        return this.ranks.indexOf(card.rank);
    },

    onClick(e) {
        if (!this.gameRunning) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.handleClick(x, y);
    },

    handleClick(x, y) {
        const isMobile = canvas.width < 500;
        const cardW = isMobile ? 60 : 80;
        const cardH = isMobile ? 90 : 120;
        const gap = isMobile ? 65 : 90;

        if (!this.gameRunning || this.gameState !== 'playing' || this.turn !== 'player') {
            // Se estiver em estado de resposta de truco, ainda precisamos processar cliques nos botões
            if (this.gameState === 'truco_offered' && this.trucoOfferedBy === 'cpu') {
                this.handleButtons(x, y, isMobile);
            }
            return;
        }

        // Check cards
        const startX = (canvas.width - (this.playerHand.length * gap)) / 2;
        const startY = canvas.height - (isMobile ? 110 : 150);

        for (let i = 0; i < this.playerHand.length; i++) {
            const cx = startX + i * gap;
            if (x > cx && x < cx + cardW && y > startY && y < startY + cardH) {
                this.playCard('player', i);
                return;
            }
        }

        this.handleButtons(x, y, isMobile);
    },

    handleButtons(x, y, isMobile) {
        // Check Truco Button
        if (this.gameState === 'playing' && this.turn === 'player' && this.trucoOfferedBy !== 'player') {
            const bW = isMobile ? 80 : 100;
            const bX = canvas.width - (isMobile ? 90 : 120);
            const bY = canvas.height / 2 - 20;
            if (x > bX && x < bX + bW && y > bY && y < bY + 40) {
                this.offerTruco('player');
            }
        }
        
        // If Truco offered by CPU, handle Accept/Run
        if (this.gameState === 'truco_offered' && this.trucoOfferedBy === 'cpu') {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const bW = isMobile ? 90 : 100;
            // Aceitar
            if (x > centerX - (isMobile ? 100 : 110) && x < centerX - 10 && y > centerY + 50 && y < centerY + 90) {
                this.resolveTruco(true);
            }
            // Correr
            if (x > centerX + 10 && x < centerX + (isMobile ? 100 : 110) && y > centerY + 50 && y < centerY + 90) {
                this.resolveTruco(false);
            }
        }
    },

    playCard(who, index) {
        const card = (who === 'player' ? this.playerHand : this.cpuHand).splice(index, 1)[0];
        this.cardsPlayed[who] = card;
        
        if (this.cardsPlayed.player && this.cardsPlayed.cpu) {
            this.turn = 'waiting';
            setTimeout(() => this.resolveRound(), 1000);
        } else {
            this.turn = (who === 'player') ? 'cpu' : 'player';
            if (this.turn === 'cpu') setTimeout(() => this.cpuPlay(), 1000);
        }
    },

    cpuPlay() {
        if (!this.gameRunning || this.gameState !== 'playing' || this.turn !== 'cpu') return;

        // Logic: Try to play the lowest card that wins, or the absolute lowest if losing
        let bestIdx = 0;
        if (this.cardsPlayed.player) {
            const playerVal = this.getCardValue(this.cardsPlayed.player);
            // Find lowest card that beats player
            let winners = this.cpuHand.filter(c => this.getCardValue(c) > playerVal);
            if (winners.length > 0) {
                winners.sort((a,b) => this.getCardValue(a) - this.getCardValue(b));
                bestIdx = this.cpuHand.indexOf(winners[0]);
            } else {
                // Play lowest
                this.cpuHand.sort((a,b) => this.getCardValue(a) - this.getCardValue(b));
                bestIdx = 0;
            }
        } else {
            // Start with mid card
            bestIdx = Math.floor(this.cpuHand.length / 2);
        }

        // Random chance to offer Truco if CPU has good cards
        if (this.trucoOfferedBy !== 'cpu' && Math.random() < 0.1 && this.cpuHand.length > 0) {
            this.offerTruco('cpu');
            return;
        }

        this.playCard('cpu', bestIdx);
    },

    offerTruco(who) {
        this.gameState = 'truco_offered';
        this.trucoOfferedBy = who;
        const nextPoints = this.handPoints === 1 ? 3 : this.handPoints + 3;
        this.showMsg(`${who.toUpperCase()} PEDIU ${nextPoints}!`);
        
        if (who === 'player') {
            // CPU logic to accept
            setTimeout(() => {
                const accept = Math.random() > 0.4; // Simplified
                this.resolveTruco(accept);
            }, 1500);
        }
    },

    resolveTruco(accepted) {
        if (accepted) {
            this.handPoints = this.handPoints === 1 ? 3 : this.handPoints + 3;
            this.showMsg("Desafio Aceito!");
            this.gameState = 'playing';
            if (this.turn === 'cpu') setTimeout(() => this.cpuPlay(), 1000);
        } else {
            // Runner loses the hand
            const winner = (this.trucoOfferedBy === 'player') ? 'player' : 'cpu';
            this.showMsg(`${winner.toUpperCase()} ganhou a mão!`);
            this.endHand(winner);
        }
    },

    resolveRound() {
        const vP = this.getCardValue(this.cardsPlayed.player);
        const vC = this.getCardValue(this.cardsPlayed.cpu);
        
        let winner = 'empate';
        if (vP > vC) winner = 'player';
        else if (vC > vP) winner = 'cpu';
        
        this.rounds.push({ winner });
        this.cardsPlayed = { player: null, cpu: null };
        this.roundStarter = (winner === 'empate') ? this.roundStarter : winner;
        this.turn = this.roundStarter;
        
        this.showMsg(winner === 'empate' ? "Empatou!" : `${winner.toUpperCase()} ganhou o round!`);

        // Check if hand ended
        const pWins = this.rounds.filter(r => r.winner === 'player').length;
        const cWins = this.rounds.filter(r => r.winner === 'cpu').length;
        const draws = this.rounds.filter(r => r.winner === 'empate').length;

        let handWinner = null;
        if (pWins === 2) handWinner = 'player';
        else if (cWins === 2) handWinner = 'cpu';
        else if (this.rounds.length === 3) {
            if (pWins > cWins) handWinner = 'player';
            else if (cWins > pWins) handWinner = 'cpu';
            else handWinner = this.handStarter; // Tie-breaker: who started wins
        } else if (draws > 0) {
            // Special Truco tie rules: First round tie? Next round wins. All tie? Hand starter wins.
            if (this.rounds.length === 1 && winner === 'empate') {
                // Keep playing
            } else if (pWins > cWins) handWinner = 'player';
            else if (cWins > pWins) handWinner = 'cpu';
            else if (this.rounds.length >= 2 && pWins === cWins) {
                 // Simplified: first winner of non-tied round wins hand
                 const firstNonTie = this.rounds.find(r => r.winner !== 'empate');
                 if (firstNonTie) handWinner = firstNonTie.winner;
                 else if (this.rounds.length === 3) handWinner = this.handStarter;
            }
        }

        if (handWinner) {
            setTimeout(() => this.endHand(handWinner), 1000);
        } else {
            if (this.turn === 'cpu') setTimeout(() => this.cpuPlay(), 1000);
        }
    },

    endHand(winner) {
        this.gamePoints[winner] += this.handPoints;
        this.updateScoreDisplay();
        
        if (this.gamePoints[winner] >= 12) {
            this.gameOver(winner);
        } else {
            this.showMsg(`Fim da Mão. ${winner.toUpperCase()} +${this.handPoints}`);
            setTimeout(() => this.newHand(), 2000);
        }
    },

    update() {
        if (this.messageTimer > 0) this.messageTimer--;
    },

    draw() {
        const W = canvas.width, H = canvas.height;
        const isMobile = W < 500;
        const cardW = isMobile ? 60 : 80;
        const cardH = isMobile ? 90 : 120;
        const gap = isMobile ? 65 : 90;

        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, 0, W, H);

        // Draw CPU Cards (backs)
        const cpuStartX = (W - (this.cpuHand.length * gap)) / 2;
        for (let i = 0; i < this.cpuHand.length; i++) {
            this.drawCard(cpuStartX + i * gap, isMobile ? 10 : 30, null, true, cardW, cardH);
        }

        // Draw Vira
        if (this.vira) {
            ctx.fillStyle = 'rgba(0, 242, 254, 0.4)';
            ctx.font = isMobile ? '10px Orbitron' : '14px Orbitron';
            ctx.textAlign = 'left';
            ctx.fillText("VIRA", 15, H / 2 - (isMobile ? 50 : 70));
            this.drawCard(15, H / 2 - (isMobile ? 45 : 60), this.vira, false, cardW, cardH);
        }

        // Draw Played Cards
        if (this.cardsPlayed.cpu) this.drawCard(W/2 - cardW/2, H/2 - (isMobile ? 100 : 130), this.cardsPlayed.cpu, false, cardW, cardH);
        if (this.cardsPlayed.player) this.drawCard(W/2 - cardW/2, H/2 + (isMobile ? 10 : 10), this.cardsPlayed.player, false, cardW, cardH);

        // Draw Player Cards
        const startX = (W - (this.playerHand.length * gap)) / 2;
        const playerY = H - (isMobile ? 100 : 150);
        for (let i = 0; i < this.playerHand.length; i++) {
            this.drawCard(startX + i * gap, playerY, this.playerHand[i], false, cardW, cardH);
        }

        // Draw Message
        if (this.messageTimer > 0) {
            ctx.font = isMobile ? '14px Orbitron' : '20px Orbitron';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText(this.message, W / 2, H / 2 - (isMobile ? 120 : 150));
        }

        // UI Buttons
        if (this.gameState === 'playing' && this.turn === 'player') {
            this.drawButton(W - (isMobile ? 90 : 120), H / 2 - 20, "TRUCO", '#ff0080', isMobile ? 80 : 100);
        } else if (this.gameState === 'truco_offered' && this.trucoOfferedBy === 'cpu') {
            const bW = isMobile ? 90 : 100;
            this.drawButton(W/2 - (isMobile ? 100 : 110), H/2 + 50, "ACEITAR", '#00f2fe', bW);
            this.drawButton(W/2 + 10, H/2 + 50, "CORRER", '#ff0080', bW);
        }

        // Scores and Status
        ctx.font = '14px Orbitron';
        ctx.fillStyle = '#4facfe';
        ctx.textAlign = 'left';
        ctx.fillText(`VALOR: ${this.handPoints}`, 30, 30);
        
        ctx.textAlign = 'right';
        ctx.fillText(this.turn === 'player' ? "SUA VEZ" : "CPU PENSANDO...", W - 30, 30);
    },

    drawCard(x, y, card, isBack = false, w = 80, h = 120) {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = isBack ? '#ff0080' : '#00f2fe';
        
        // Card Body
        ctx.fillStyle = '#141419';
        ctx.strokeStyle = isBack ? '#ff0080' : '#00f2fe';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 10);
        ctx.fill();
        ctx.stroke();

        if (!isBack && card) {
            const centerX = x + w / 2;
            ctx.fillStyle = (card.suit === '♥' || card.suit === '♦') ? '#ff0080' : '#fff';
            ctx.font = `bold ${w/3}px Inter`;
            ctx.textAlign = 'center';
            ctx.fillText(card.rank, centerX, y + h * 0.45);
            ctx.font = `${w/4}px Inter`;
            ctx.fillText(card.suit, centerX, y + h * 0.7);
            
            // If Manilha, add a glow
            if (card.rank === this.manilhaRank) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.strokeRect(x+5, y+5, w-10, h-10);
            }
        } else if (isBack) {
            // Neon Pattern on back
            ctx.strokeStyle = 'rgba(255, 0, 128, 0.3)';
            ctx.beginPath();
            ctx.moveTo(x + 10, y + 10);
            ctx.lineTo(x + w - 10, y + h - 10);
            ctx.moveTo(x + w - 10, y + 10);
            ctx.lineTo(x + 10, y + h - 10);
            ctx.stroke();
        }
        ctx.restore();
    },

    drawButton(x, y, text, color, w = 100) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, w, 40, 20);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = color;
        ctx.font = '12px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText(text, x + w / 2, y + 25);
    },

    showMsg(txt) {
        this.message = txt;
        this.messageTimer = 120;
    },

    loop(timestamp) {
        if (!this.gameRunning) return;
        const elapsed = timestamp - this.lastTime;
        if (elapsed > 1000 / 60) {
            this.update();
            this.draw();
            this.lastTime = timestamp;
        }
        requestAnimationFrame((t) => this.loop(t));
    },

    gameOver(winner) {
        this.gameRunning = false;
        document.getElementById('game-over-title').textContent = winner === 'player' ? 'VOCÊ VENCEU!' : 'CPU VENCEU!';
        document.getElementById('final-score').textContent = `${this.gamePoints.player} x ${this.gamePoints.cpu}`;
        document.getElementById('game-over-overlay').classList.remove('hidden');
    },

    updateScoreDisplay() {
        document.getElementById('score').textContent = 
            `${this.gamePoints.player.toString().padStart(2, '0')} - ${this.gamePoints.cpu.toString().padStart(2, '0')}`;
    }
};
