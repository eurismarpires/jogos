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
    const size = Math.min(wrapper.clientWidth, 600);
    canvas.width = size;
    canvas.height = size;
    if (activeGame && activeGame.resize) activeGame.resize();
}

function loadGame(gameId) {
    console.log("Loading game:", gameId);
    if (gameId === 'snake') activeGame = SnakeGame;
    if (gameId === 'invaders') activeGame = InvadersGame;
    if (gameId === 'platformer') activeGame = PlatformerGame;
    if (gameId === 'tetris') activeGame = TetrisGame;
    if (gameId === 'chess') activeGame = ChessGame;
    if (gameId === 'asteroids') activeGame = AsteroidsGame;
    if (gameId === 'tictactoe') activeGame = TicTacToeGame;
    if (gameId === 'maze') activeGame = MazeGame;
    if (gameId === 'pong') activeGame = PongGame;
    if (gameId === 'bricks') activeGame = BricksGame;

    if (activeGame) {
        console.log("Active game set:", activeGame);
        gameSelector.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        document.getElementById('game-over-overlay').classList.add('hidden');
        document.getElementById('start-overlay').classList.remove('hidden');
        
        resize(); // Garante que o canvas tem tamanho antes do init do jogo
        activeGame.init();
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
    
    // Permite que toques no canvas funcionem como mousedown para jogos de clique
    canvas.addEventListener('touchstart', (e) => {
        if (activeGame && typeof activeGame.onClick === 'function') {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            canvas.dispatchEvent(mouseEvent);
        }
    }, { passive: false });
}
