/**
 * NEON CHESS - Modular Logic
 */

const ChessGame = {
    // State
    board: [],
    turn: 'white',
    selected: null,
    validMoves: [],
    gameRunning: false,
    tileSize: 0,
    cursor: { x: 0, y: 0 },
    
    // Piece definitions
    pieces: {
        'white': {
            'pawn': '♙', 'rook': '♖', 'knight': '♘', 'bishop': '♗', 'queen': '♕', 'king': '♔'
        },
        'black': {
            'pawn': '♟', 'rook': '♜', 'knight': '♞', 'bishop': '♝', 'queen': '♛', 'king': '♚'
        }
    },

    init() {
        this.resize();
        this.resetBoard();
    },

    resize() {
        this.tileSize = canvas.width / 8;
    },

    resetBoard() {
        this.board = Array(8).fill(null).map(() => Array(8).fill(null));
        
        // Rooks
        this.board[0][0] = { type: 'rook', color: 'black' };
        this.board[0][7] = { type: 'rook', color: 'black' };
        this.board[7][0] = { type: 'rook', color: 'white' };
        this.board[7][7] = { type: 'rook', color: 'white' };
        
        // Knights
        this.board[0][1] = { type: 'knight', color: 'black' };
        this.board[0][6] = { type: 'knight', color: 'black' };
        this.board[7][1] = { type: 'knight', color: 'white' };
        this.board[7][6] = { type: 'knight', color: 'white' };
        
        // Bishops
        this.board[0][2] = { type: 'bishop', color: 'black' };
        this.board[0][5] = { type: 'bishop', color: 'black' };
        this.board[7][2] = { type: 'bishop', color: 'white' };
        this.board[7][5] = { type: 'bishop', color: 'white' };
        
        // Queens
        this.board[0][3] = { type: 'queen', color: 'black' };
        this.board[7][3] = { type: 'queen', color: 'white' };
        
        // Kings
        this.board[0][4] = { type: 'king', color: 'black' };
        this.board[7][4] = { type: 'king', color: 'white' };
        
        // Pawns
        for (let i = 0; i < 8; i++) {
            this.board[1][i] = { type: 'pawn', color: 'black' };
            this.board[6][i] = { type: 'pawn', color: 'white' };
        }
    },

    start() {
        this.resetBoard();
        this.turn = 'white';
        this.selected = null;
        this.validMoves = [];
        this.gameRunning = true;
        this.cursor = { x: 4, y: 6 }; // Start on White King or Pawn

        // Esconde overlays
        document.getElementById('start-overlay').classList.add('hidden');
        document.getElementById('game-over-overlay').classList.add('hidden');
        
        document.getElementById('game-title').textContent = 'NEON CHESS';
        document.getElementById('controls-text').textContent = 'Use as setas para mover o cursor, ESPAÇO para selecionar/mover';
        document.getElementById('dynamic-controls').innerHTML = '<span>SETAS / WASD</span><span class="separator">|</span><span>ESPAÇO (AÇÃO)</span>';
        
        this.updateScoreDisplay();
        this.draw();
    },

    stop() {
        this.gameRunning = false;
    },

    handleInput(keys, key, type) {
        if (!this.gameRunning || type !== 'keydown') return;
        
        const k = key.toLowerCase();
        
        // Navigation
        if (k === 'arrowup' || k === 'w') {
            this.cursor.y = Math.max(0, this.cursor.y - 1);
        } else if (k === 'arrowdown' || k === 's') {
            this.cursor.y = Math.min(7, this.cursor.y + 1);
        } else if (k === 'arrowleft' || k === 'a') {
            this.cursor.x = Math.max(0, this.cursor.x - 1);
        } else if (k === 'arrowright' || k === 'd') {
            this.cursor.x = Math.min(7, this.cursor.x + 1);
        }
        
        // Action
        if (k === ' ' || k === 'enter') {
            this.selectSquare(this.cursor.x, this.cursor.y);
        }

        this.draw();
    },

    selectSquare(x, y) {
        // Swap y and x because board is board[row][col] which is board[y][x]
        const piece = this.board[y][x];

        if (this.selected) {
            // Check if clicking on the same square (deselect)
            if (this.selected.x === x && this.selected.y === y) {
                this.selected = null;
                this.validMoves = [];
                return;
            }

            // Check if clicking on a valid move
            const move = this.validMoves.find(m => m.x === x && m.y === y);
            if (move) {
                this.movePiece(this.selected, { x, y });
                this.selected = null;
                this.validMoves = [];
                return;
            }

            // If clicking on another of my own pieces, switch selection
            if (piece && piece.color === this.turn) {
                this.selected = { x, y };
                this.calculateValidMoves(x, y);
                return;
            }

            // Otherwise deselect
            this.selected = null;
            this.validMoves = [];
        } else {
            if (piece && piece.color === this.turn) {
                this.selected = { x, y };
                this.calculateValidMoves(x, y);
            }
        }
    },

    calculateValidMoves(x, y) {
        const piece = this.board[y][x];
        this.validMoves = [];
        
        if (!piece) return;

        const directions = {
            'rook': [[0,1], [0,-1], [1,0], [-1,0]],
            'bishop': [[1,1], [1,-1], [-1,1], [-1,-1]],
            'queen': [[0,1], [0,-1], [1,0], [-1,0], [1,1], [1,-1], [-1,1], [-1,-1]],
            'king': [[0,1], [0,-1], [1,0], [-1,0], [1,1], [1,-1], [-1,1], [-1,-1]],
            'knight': [[1,2], [1,-2], [-1,2], [-1,-2], [2,1], [2,-1], [-2,1], [-2,-1]]
        };

        if (piece.type === 'pawn') {
            const dir = piece.color === 'white' ? -1 : 1;
            const startRow = piece.color === 'white' ? 6 : 1;

            // Move forward
            if (this.isInside(x, y + dir) && !this.board[y + dir][x]) {
                this.validMoves.push({ x, y: y + dir });
                if (y === startRow && !this.board[y + 2*dir][x]) {
                    this.validMoves.push({ x, y: y + 2*dir });
                }
            }
            // Capture
            const captures = [[x-1, y+dir], [x+1, y+dir]];
            for (let [cx, cy] of captures) {
                if (this.isInside(cx, cy)) {
                    const target = this.board[cy][cx];
                    if (target && target.color !== piece.color) {
                        this.validMoves.push({ x: cx, y: cy });
                    }
                }
            }
        } else if (piece.type === 'knight') {
            for (let [dx, dy] of directions.knight) {
                const nx = x + dx, ny = y + dy;
                if (this.isInside(nx, ny)) {
                    const target = this.board[ny][nx];
                    if (!target || target.color !== piece.color) {
                        this.validMoves.push({ x: nx, y: ny });
                    }
                }
            }
        } else if (piece.type === 'king') {
            for (let [dx, dy] of directions.king) {
                const nx = x + dx, ny = y + dy;
                if (this.isInside(nx, ny)) {
                    const target = this.board[ny][nx];
                    if (!target || target.color !== piece.color) {
                        this.validMoves.push({ x: nx, y: ny });
                    }
                }
            }
        } else {
            // Rooks, Bishops, Queens
            for (let [dx, dy] of directions[piece.type]) {
                let nx = x + dx, ny = y + dy;
                while (this.isInside(nx, ny)) {
                    const target = this.board[ny][nx];
                    if (!target) {
                        this.validMoves.push({ x: nx, y: ny });
                    } else {
                        if (target.color !== piece.color) {
                            this.validMoves.push({ x: nx, y: ny });
                        }
                        break;
                    }
                    nx += dx;
                    ny += dy;
                }
            }
        }
    },

    isInside(x, y) {
        return x >= 0 && x < 8 && y >= 0 && y < 8;
    },

    movePiece(from, to) {
        const piece = this.board[from.y][from.x];
        const target = this.board[to.y][to.x];
        
        if (target && target.type === 'king') {
            this.gameOver(piece.color);
        }

        this.board[to.y][to.x] = piece;
        this.board[from.y][from.x] = null;

        // Promotion (auto to queen for simplicity)
        if (piece.type === 'pawn' && (to.y === 0 || to.y === 7)) {
            piece.type = 'queen';
        }

        this.turn = this.turn === 'white' ? 'black' : 'white';
        
        // Update stats
        this.updateScoreDisplay();
    },

    draw() {
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Board
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const isDark = (r + c) % 2 === 1;
                const rx = c * this.tileSize;
                const ry = r * this.tileSize;

                // Square background
                ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)';
                ctx.fillRect(rx, ry, this.tileSize, this.tileSize);

                // Highlight selected
                if (this.selected && this.selected.x === c && this.selected.y === r) {
                    ctx.fillStyle = 'rgba(0, 242, 254, 0.3)';
                    ctx.fillRect(rx, ry, this.tileSize, this.tileSize);
                }

                // Highlight valid moves
                if (this.validMoves.some(m => m.x === c && m.y === r)) {
                    ctx.fillStyle = 'rgba(255, 0, 128, 0.2)';
                    ctx.beginPath();
                    ctx.arc(rx + this.tileSize/2, ry + this.tileSize/2, this.tileSize/6, 0, Math.PI*2);
                    ctx.fill();
                }

                // Highlight cursor
                if (this.cursor.x === c && this.cursor.y === r) {
                    ctx.strokeStyle = '#00f2fe';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(rx + 2, ry + 2, this.tileSize - 4, this.tileSize - 4);
                }

                // Draw Piece
                const piece = this.board[r][c];
                if (piece) {
                    this.drawPiece(c, r, piece);
                }
            }
        }
    },

    drawPiece(x, y, piece) {
        const char = this.pieces[piece.color][piece.type];
        const rx = x * this.tileSize + this.tileSize / 2;
        const ry = y * this.tileSize + this.tileSize / 2;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${this.tileSize * 0.7}px Arial`;
        
        const color = piece.color === 'white' ? '#00f2fe' : '#ff0080';
        
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        
        ctx.fillText(char, rx, ry);
        ctx.restore();
    },

    updateScoreDisplay() {
        document.getElementById('score').textContent = this.turn.toUpperCase();
        document.getElementById('high-score').textContent = this.turn === 'white' ? 'BRANCO' : 'PRETO';
    },

    gameOver(winner) {
        this.gameRunning = false;
        document.getElementById('game-over-title').textContent = winner === 'white' ? 'BRANCAS VENCERAM!' : 'PRETAS VENCERAM!';
        document.getElementById('final-score').textContent = 'FIM';
        document.getElementById('game-over-overlay').classList.remove('hidden');
    }
};
