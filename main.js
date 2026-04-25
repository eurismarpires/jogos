/**
 * NEON ARCADE - Main Controller
 */

// Inicializa as globais definidas no index.html
canvas = document.getElementById('gameCanvas');
ctx = canvas.getContext('2d');

const gameSelector = document.getElementById('game-selector');
const gameContainer = document.querySelector('.game-container');
const backBtn = document.getElementById('back-to-menu');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

let activeGame = null;
window.keys = {}; // Global key state tracking

function init() {
    // Selection Cards
    document.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', () => {
            const gameId = card.getAttribute('data-game');
            loadGame(gameId);
        });
    });

    // Global UI Events
    backBtn.addEventListener('click', returnToMenu);
    startBtn.addEventListener('click', () => activeGame.start());
    restartBtn.addEventListener('click', () => activeGame.start());

    // Keyboard Routing
    window.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        if (!activeGame || !activeGame.gameRunning) return;
        if (activeGame.handleInput) activeGame.handleInput(keys, e.key, 'keydown');
    });

    window.addEventListener('keyup', (e) => {
        keys[e.key] = false;
        if (!activeGame || !activeGame.gameRunning) return;
        if (activeGame.handleInput) activeGame.handleInput(keys, e.key, 'keyup');
    });

    window.addEventListener('resize', resize);
    resize();
}

function resize() {
    const wrapper = document.querySelector('.canvas-wrapper');
    if (!wrapper) return;
    
    // No celular, permitimos que o canvas ocupe todo o wrapper (retangular)
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
    
    if (activeGame && activeGame.resize) activeGame.resize();
}

function loadGame(gameId) {
    console.log("Loading game:", gameId);
    if (gameId === 'snake') activeGame = SnakeGame;
    if (gameId === 'invaders') activeGame = InvadersGame;

    if (gameId === 'tetris') activeGame = TetrisGame;
    if (gameId === 'chess') activeGame = ChessGame;
    if (gameId === 'asteroids') activeGame = AsteroidsGame;
    if (gameId === 'tictactoe') activeGame = TicTacToeGame;
    if (gameId === 'maze') activeGame = MazeGame;
    if (gameId === 'pong') activeGame = PongGame;
    if (gameId === 'bricks') activeGame = BricksGame;
    if (gameId === 'mario') activeGame = MarioGame;
    if (gameId === 'sudoku') activeGame = SudokuGame;
    if (gameId === 'n2048') activeGame = N2048Game;
    if (gameId === 'flappy') activeGame = FlappyGame;
    if (gameId === 'memory') activeGame = MemoryGame;
    if (gameId === 'mines') activeGame = MinesGame;

    if (activeGame) {
        console.log("Active game set:", activeGame);
        gameSelector.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        document.getElementById('game-over-overlay').classList.add('hidden');
        document.getElementById('start-overlay').classList.remove('hidden');
        
        resize(); // Garante que o canvas tem tamanho antes do init do jogo
        activeGame.init();

        // Gerenciamento de controles específicos
        if (gameId === 'sudoku') {
            document.getElementById('mobile-controls').classList.add('hidden');
            document.getElementById('sudoku-pad').classList.add('active');
        } else {
            document.getElementById('sudoku-pad').classList.remove('active');
            // Re-mostra controles mobile padrão se necessário (o main já faz isso via CSS geralmente, mas garantimos aqui)
        }
    } else {
        console.error("Game not found:", gameId);
    }
}

function returnToMenu() {
    if (activeGame) {
        activeGame.stop();
        activeGame = null;
    }
    gameContainer.classList.add('hidden');
    gameSelector.classList.remove('hidden');
    document.getElementById('game-settings').innerHTML = '';
    document.getElementById('sudoku-pad').classList.remove('active');
}

// Global initialization
window.onload = () => {
    console.log("Neon Arcade Initialized");
    init();
    setupMobileControls();
};

// Mobile Controls Setup
function setupMobileControls() {
    const buttons = document.querySelectorAll('.mobile-controls button');
    
    buttons.forEach(btn => {
        const key = btn.getAttribute('data-key');
        
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            window.keys[key] = true;
            if (activeGame && activeGame.handleInput) {
                activeGame.handleInput(window.keys, key, 'keydown');
            }
        }, { passive: false });
        
        const release = (e) => {
            e.preventDefault();
            window.keys[key] = false;
            if (activeGame && activeGame.handleInput) {
                activeGame.handleInput(window.keys, key, 'keyup');
            }
        };
        
        btn.addEventListener('touchend', release, { passive: false });
        btn.addEventListener('touchcancel', release, { passive: false });
    });

    // Sudoku Num Pad
    document.querySelectorAll('.nbtn').forEach(btn => {
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const val = parseInt(btn.getAttribute('data-val'));
            if (activeGame && activeGame.setNumber) {
                activeGame.setNumber(val);
            }
        }, { passive: false });
        // Também para desktop testar
        btn.addEventListener('mousedown', (e) => {
            const val = parseInt(btn.getAttribute('data-val'));
            if (activeGame && activeGame.setNumber) {
                activeGame.setNumber(val);
            }
        });
    });
    
    // Suporte a cliques no desktop
    canvas.addEventListener('mousedown', (e) => {
        if (activeGame && typeof activeGame.onClick === 'function') {
            activeGame.onClick(e);
        }
    });

    // Manual Logic
    const manualOverlay = document.getElementById('manual-overlay');
    const manualTitle = document.getElementById('manual-title');
    const manualText = document.getElementById('manual-text');
    const closeManualBtn = document.getElementById('close-manual');

    document.querySelectorAll('.manual-btn').forEach(btn => {
        const open = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const gameCard = btn.closest('.game-card');
            const gameId = gameCard.getAttribute('data-game');
            showManual(gameId);
        };
        btn.addEventListener('click', open);
        btn.addEventListener('touchstart', open, { passive: false });
    });

    closeManualBtn.addEventListener('click', () => {
        manualOverlay.classList.add('hidden');
    });
    closeManualBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        manualOverlay.classList.add('hidden');
    }, { passive: false });

    function showManual(gameId) {
        const data = MANUAL_DATA[gameId];
        if (data) {
            manualTitle.textContent = data.title;
            manualText.innerHTML = data.body;
            manualOverlay.classList.remove('hidden');
        }
    }

    // Permite que toques no canvas funcionem como mousedown para jogos de clique
    canvas.addEventListener('touchstart', (e) => {
        if (activeGame && typeof activeGame.onClick === 'function') {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            activeGame.onClick(mouseEvent); // Chama diretamente para garantir
        }
    }, { passive: false });
}

const MANUAL_DATA = {
    snake: {
        title: "NEON SNAKE",
        body: "<h4>Objetivo</h4><p>Coma os pixels de energia para crescer. Quanto mais você come, mais rápido fica!</p><h4>Controles</h4><ul><li>Setas ou WASD: Mover</li><li>Celular: D-Pad</li></ul>"
    },
    invaders: {
        title: "NEON INVADERS",
        body: "<h4>Objetivo</h4><p>Defenda a Terra da invasão alienígena. Destrua todos antes que cheguem à base.</p><h4>Controles</h4><ul><li>Setas Esquerda/Direita: Mover</li><li>Espaço: Atirar</li><li>Celular: Setas e Botão A</li></ul>"
    },
    tetris: {
        title: "NEON TETRIS",
        body: "<h4>Objetivo</h4><p>Encaixe os blocos para completar linhas horizontais e eliminá-las.</p><h4>Controles</h4><ul><li>Setas Esquerda/Direita: Mover</li><li>Seta Cima: Rotacionar</li><li>Seta Baixo: Acelerar queda</li><li>Celular: D-Pad</li></ul>"
    },
    chess: {
        title: "NEON CHESS",
        body: "<h4>Objetivo</h4><p>Capture o Rei adversário (Xeque-Mate).</p><h4>Controles</h4><ul><li>Clique na peça e depois no destino</li><li>Azul vs Rosa (CPU)</li></ul>"
    },
    asteroids: {
        title: "NEON ASTEROIDS",
        body: "<h4>Objetivo</h4><p>Destrua os asteroides e sobreviva no espaço profundo.</p><h4>Controles</h4><ul><li>Seta Cima: Propulsão</li><li>Setas Lado: Girar</li><li>Espaço: Atirar</li><li>Celular: D-Pad e Botão A</li></ul>"
    },
    tictactoe: {
        title: "NEON TIC TAC TOE",
        body: "<h4>Objetivo</h4><p>Alinhe 3 símbolos iguais (X ou O) na horizontal, vertical ou diagonal.</p><h4>Controles</h4><ul><li>Clique no espaço vazio</li></ul>"
    },
    maze: {
        title: "NEON MAZE",
        body: "<h4>Objetivo</h4><p>Colete todos os pontos no labirinto enquanto foge dos fantasmas.</p><h4>Controles</h4><ul><li>Setas: Mover</li><li>Celular: D-Pad</li></ul>"
    },
    pong: {
        title: "NEON PONG",
        body: "<h4>Objetivo</h4><p>Não deixe a bola passar da sua raquete. Marque 10 pontos para vencer.</p><h4>Controles</h4><ul><li>Setas Cima/Baixo: Mover</li><li>Celular: D-Pad</li></ul>"
    },
    bricks: {
        title: "NEON BRICKS",
        body: "<h4>Objetivo</h4><p>Destrua todos os blocos usando a bola e não a deixe cair.</p><h4>Controles</h4><ul><li>Setas Esquerda/Direita: Mover</li><li>Celular: Setas</li></ul>"
    },
    mario: {
        title: "SUPER MARIO",
        body: "<h4>Objetivo</h4><p>Chegue ao fim da fase pulando em inimigos e coletando moedas.</p><h4>Controles</h4><ul><li>Setas: Mover</li><li>W / Espaço: Pular</li><li>Celular: D-Pad e Botão A</li></ul>"
    },
    sudoku: {
        title: "NEON SUDOKU",
        body: "<h4>Objetivo</h4><p>Preencha a grade 9x9 com números de 1 a 9 sem repetir em linhas, colunas ou blocos 3x3.</p><h4>Controles</h4><ul><li>Clique na célula e use 1-9</li><li>Backspace/0: Apagar</li><li>Celular: Teclado Numérico</li></ul>"
    },
    n2048: {
        title: "NEON 2048",
        body: "<h4>Objetivo</h4><p>Combine números iguais para chegar ao bloco 2048.</p><h4>Controles</h4><ul><li>Setas ou WASD: Deslizar</li><li>Celular: D-Pad</li></ul>"
    },
    flappy: {
        title: "NEON FLAPPY",
        body: "<h4>Objetivo</h4><p>Voe entre os obstáculos sem bater.</p><h4>Controles</h4><ul><li>Espaço / W / Clique: Voar</li><li>Celular: Toque na tela</li></ul>"
    },
    memory: {
        title: "NEON MEMORY",
        body: "<h4>Objetivo</h4><p>Encontre todos os pares de cartas iguais.</p><h4>Controles</h4><ul><li>Clique nas cartas</li></ul>"
    },
    mines: {
        title: "NEON MINES",
        body: "<h4>Objetivo</h4><p>Abra todas as células sem detonar vírus. Use números para se guiar.</p><h4>Controles</h4><ul><li>Clique: Abrir</li><li>Botão Direito / Shift: Marcar Flag</li><li>Celular: Botão de MODO (Revelar/Marcar)</li></ul>"
    }
};
