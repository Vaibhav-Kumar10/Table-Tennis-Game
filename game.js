// ==== CONFIGURATION ====
const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 80;
const AI_PADDLE_HEIGHT = 80;
const BALL_RADIUS = 11;
const NET_WIDTH = 4;
const NET_SEGMENT = 20;
const NET_GAP = 12;
const PADDLE_SPEED = 6; // for AI
const BALL_SPEED = 6;
const WIN_SCORE = 10;

const PADDLE_COLORS = {
    red: "#e53935",
    blue: "#1e88e5",
    green: "#43a047",
    yellow: "#fbc02d",
    purple: "#8e24aa",
};

let theme = 'light'; // or 'dark'

// ==== GAME STATE ====
let canvas, ctx;
let player = { y: CANVAS_HEIGHT/2 - PADDLE_HEIGHT/2, color: 'red' };
let ai = { y: CANVAS_HEIGHT/2 - AI_PADDLE_HEIGHT/2 };
let ball = {
    x: CANVAS_WIDTH/2, y: CANVAS_HEIGHT/2,
    vx: BALL_SPEED * (Math.random() < 0.5 ? 1 : -1),
    vy: BALL_SPEED * (Math.random()-0.5)*1.1,
};
let scores = { player: 0, ai: 0 };
let isPaused = false;
let animationFrame;
let gameStarted = false;
let mouseY = player.y;

// ==== DOM ELEMENTS ====
const playerScoreElem = document.getElementById("player-score");
const aiScoreElem = document.getElementById("ai-score");
const paddleSelect = document.getElementById("paddle-select");
const themeBtn = document.getElementById("theme-toggle");
const pausePlayBtn = document.getElementById("pause-play-btn");
const bodyElem = document.body;

// ==== INIT ====
function resetBall(whoScored = null) {
    ball.x = CANVAS_WIDTH/2;
    ball.y = CANVAS_HEIGHT/2;
    ball.vx = BALL_SPEED * (whoScored === "player" ? 1 : -1) * (Math.random() < 0.7 ? 1 : -1);
    ball.vy = BALL_SPEED * (Math.random()-0.5)*1.2;
}

function resetGame() {
    scores = { player: 0, ai: 0 };
    updateScore();
    resetBall();
}

function updateScore() {
    playerScoreElem.textContent = scores.player;
    aiScoreElem.textContent = scores.ai;
}

function drawNet() {
    ctx.save();
    ctx.strokeStyle = (theme === 'dark') ? "#bbb" : "#fff";
    ctx.lineWidth = NET_WIDTH;
    for(let y = 0; y < CANVAS_HEIGHT; y += NET_SEGMENT + NET_GAP) {
        ctx.beginPath();
        ctx.moveTo(CANVAS_WIDTH/2, y);
        ctx.lineTo(CANVAS_WIDTH/2, y + NET_SEGMENT);
        ctx.stroke();
    }
    ctx.restore();
}

function drawTable() {
    // Table edges & center line
    ctx.save();
    ctx.lineWidth = 5;
    ctx.strokeStyle = (theme === 'dark') ? "#fff" : "#222";
    ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();
}

function drawPaddle(x, y, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.fillRect(x, y, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.restore();
}

function drawAIPaddle(x, y) {
    ctx.save();
    ctx.fillStyle = "#222"; // AI paddle color
    if(theme === "dark") ctx.fillStyle = "#eee";
    ctx.fillRect(x, y, PADDLE_WIDTH, AI_PADDLE_HEIGHT);
    ctx.restore();
}

function drawBall() {
    ctx.save();
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "#bbb";
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
}

function draw() {
    // Clear
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Table
    drawTable();

    // Net
    drawNet();

    // Paddles
    drawPaddle(12, player.y, PADDLE_COLORS[player.color]);
    drawAIPaddle(CANVAS_WIDTH - 12 - PADDLE_WIDTH, ai.y);

    // Ball
    drawBall();
}

function clampPaddle(y) {
    return Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, y));
}

// ==== GAME LOOP ====
function step() {
    if(!isPaused) update();
    draw();
    animationFrame = requestAnimationFrame(step);
}

function update() {
    // Move player paddle to mouseY
    let targetY = mouseY - PADDLE_HEIGHT / 2;
    // Smooth paddle movement (for realism)
    player.y += (targetY - player.y) * 0.2;
    player.y = clampPaddle(player.y);

    // Move AI
    let aiCenter = ai.y + AI_PADDLE_HEIGHT/2;
    if (ball.y < aiCenter - 12) {
        ai.y -= PADDLE_SPEED;
    } else if (ball.y > aiCenter + 12) {
        ai.y += PADDLE_SPEED;
    }
    ai.y = Math.max(0, Math.min(CANVAS_HEIGHT - AI_PADDLE_HEIGHT, ai.y));

    // Move ball
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Bounce top/bottom
    if(ball.y - BALL_RADIUS < 0) {
        ball.y = BALL_RADIUS;
        ball.vy *= -1;
    }
    if(ball.y + BALL_RADIUS > CANVAS_HEIGHT) {
        ball.y = CANVAS_HEIGHT - BALL_RADIUS;
        ball.vy *= -1;
    }

    // Paddle collision (player)
    if(ball.x - BALL_RADIUS < 12 + PADDLE_WIDTH &&
        ball.y > player.y &&
        ball.y < player.y + PADDLE_HEIGHT &&
        ball.x > 12) {
        ball.x = 12 + PADDLE_WIDTH + BALL_RADIUS;
        ball.vx *= -1.13;
        // add random effect
        let impact = (ball.y - (player.y + PADDLE_HEIGHT/2)) / (PADDLE_HEIGHT/2);
        ball.vy += impact * 3;
    }

    // Paddle collision (AI)
    let aiPaddleX = CANVAS_WIDTH - 12 - PADDLE_WIDTH;
    if(ball.x + BALL_RADIUS > aiPaddleX &&
        ball.y > ai.y &&
        ball.y < ai.y + AI_PADDLE_HEIGHT &&
        ball.x < aiPaddleX + PADDLE_WIDTH) {
        ball.x = aiPaddleX - BALL_RADIUS;
        ball.vx *= -1.13;
        let impact = (ball.y - (ai.y + AI_PADDLE_HEIGHT/2)) / (AI_PADDLE_HEIGHT/2);
        ball.vy += impact * 3;
    }

    // Score
    if(ball.x + BALL_RADIUS < 0) {
        scores.ai += 1;
        updateScore();
        if(scores.ai === WIN_SCORE) {
            setTimeout(() => { alert("AI Wins!"); resetGame(); }, 10);
            isPaused = true;
        }
        resetBall("ai");
        isPaused = true;
        setTimeout(() => { isPaused = false; }, 1200);
    }
    if(ball.x - BALL_RADIUS > CANVAS_WIDTH) {
        scores.player += 1;
        updateScore();
        if(scores.player === WIN_SCORE) {
            setTimeout(() => { alert("You Win!"); resetGame(); }, 10);
            isPaused = true;
        }
        resetBall("player");
        isPaused = true;
        setTimeout(() => { isPaused = false; }, 1200);
    }
}

// ==== MOUSE & CONTROLS ====
function mouseMoveHandler(e) {
    let rect = canvas.getBoundingClientRect();
    let scaleY = CANVAS_HEIGHT / rect.height;
    mouseY = (e.clientY - rect.top) * scaleY;
}

function paddleSelectHandler(e) {
    player.color = e.target.value;
}

function themeToggleHandler() {
    theme = (theme === 'dark') ? 'light' : 'dark';
    bodyElem.setAttribute('data-theme', theme);
    themeBtn.textContent = theme === 'dark' ? "Light Mode" : "Dark Mode";
    draw();
}

function pausePlayHandler() {
    isPaused = !isPaused;
    pausePlayBtn.textContent = isPaused ? "Play" : "Pause";
    if (!isPaused && !animationFrame) step();
}

function windowResizeHandler() {
    // Responsive scaling: use device width to adjust canvas
    let wr = document.querySelector('.canvas-wrapper');
    let maxW = Math.min(window.innerWidth * 0.95, CANVAS_WIDTH);
    let maxH = (CANVAS_HEIGHT/CANVAS_WIDTH) * maxW;
    canvas.style.width = maxW + 'px';
    canvas.style.height = maxH + 'px';
}

function setup() {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");

    canvas.addEventListener('mousemove', mouseMoveHandler);
    paddleSelect.addEventListener('change', paddleSelectHandler);
    themeBtn.addEventListener('click', themeToggleHandler);
    pausePlayBtn.addEventListener('click', pausePlayHandler);
    window.addEventListener('resize', windowResizeHandler);

    // Mobile: touch controls
    canvas.addEventListener('touchmove', function(e){
        if(e.touches.length > 0) {
            let rect = canvas.getBoundingClientRect();
            let scaleY = CANVAS_HEIGHT / rect.height;
            mouseY = (e.touches[0].clientY - rect.top) * scaleY;
        }
    });

    // Set initial theme
    theme = bodyElem.getAttribute('data-theme') || 'light';

    windowResizeHandler();
    updateScore();
    draw();

    step();
}

window.onload = setup;
