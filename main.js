// 基本配置
const CELL = 20; // 单格像素
const GRID_W = 30; // 网格宽（格）
const GRID_H = 20; // 网格高（格）
const START_LEN = 4;

// 画布与上下文
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = GRID_W * CELL;
canvas.height = GRID_H * CELL;

// UI 元素
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const toggleBtn = document.getElementById('toggleBtn');
const restartBtn = document.getElementById('restartBtn');
const speedRange = document.getElementById('speedRange');
const overlay = document.getElementById('overlay');
const messageEl = document.getElementById('message');

// 状态
let snake = [];
let dir = { x: 1, y: 0 }; // 当前方向
let nextDir = { x: 1, y: 0 }; // 下一拍方向（避免同帧反向）
let food = { x: 15, y: 10 };
let running = false;
let loopId = null;
let score = 0;
let highScore = Number(localStorage.getItem('snake.highScore') || 0);
highScoreEl.textContent = highScore;

function resetGame() {
  snake = [];
  const startX = Math.floor(GRID_W / 2) - Math.floor(START_LEN / 2);
  const startY = Math.floor(GRID_H / 2);
  for (let i = 0; i < START_LEN; i++) {
    snake.push({ x: startX + i, y: startY });
  }
  dir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  score = 0;
  updateScore();
  spawnFood();
  overlay.classList.add('hidden');
  messageEl.textContent = '';
}

function updateScore() {
  scoreEl.textContent = score;
  if (score > highScore) {
    highScore = score;
    highScoreEl.textContent = highScore;
    localStorage.setItem('snake.highScore', String(highScore));
  }
}

function spawnFood() {
  while (true) {
    const x = Math.floor(Math.random() * GRID_W);
    const y = Math.floor(Math.random() * GRID_H);
    if (!snake.some(s => s.x === x && s.y === y)) {
      food = { x, y };
      break;
    }
  }
}

function tick() {
  if (!running) return;
  // 应用下一帧方向
  dir = nextDir;

  // 新头坐标
  const head = snake[snake.length - 1];
  const newHead = { x: head.x + dir.x, y: head.y + dir.y };

  // 碰墙
  if (newHead.x < 0 || newHead.x >= GRID_W || newHead.y < 0 || newHead.y >= GRID_H) {
    gameOver();
    return;
  }
  // 碰到自己
  if (snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
    gameOver();
    return;
  }

  // 前进
  snake.push(newHead);

  // 吃到食物
  if (newHead.x === food.x && newHead.y === food.y) {
    score += 10;
    updateScore();
    spawnFood();
  } else {
    // 不吃就减尾
    snake.shift();
  }

  draw();
}

function draw() {
  // 背景
  ctx.fillStyle = '#0b1220';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 网格
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 1;
  for (let x = 0; x <= GRID_W; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL + 0.5, 0);
    ctx.lineTo(x * CELL + 0.5, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= GRID_H; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL + 0.5);
    ctx.lineTo(canvas.width, y * CELL + 0.5);
    ctx.stroke();
  }

  // 食物
  const fx = food.x * CELL;
  const fy = food.y * CELL;
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.roundRect(fx + 3, fy + 3, CELL - 6, CELL - 6, 4);
  ctx.fill();

  // 蛇
  for (let i = 0; i < snake.length; i++) {
    const s = snake[i];
    const x = s.x * CELL;
    const y = s.y * CELL;
    // 头更亮
    ctx.fillStyle = i === snake.length - 1 ? '#22c55e' : '#16a34a';
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, CELL - 4, CELL - 4, 3);
    ctx.fill();
  }
}

function gameOver() {
  running = false;
  clearInterval(loopId);
  loopId = null;
  messageEl.innerHTML = `游戏结束！<br/>当前分数：${score}`;
  overlay.classList.remove('hidden');
  toggleBtn.textContent = '开始';
}

function start() {
  if (running) return;
  running = true;
  const ms = speedToMs(Number(speedRange.value));
  clearInterval(loopId);
  loopId = setInterval(tick, ms);
  toggleBtn.textContent = '暂停';
}

function pause() {
  if (!running) return;
  running = false;
  clearInterval(loopId);
  loopId = null;
  toggleBtn.textContent = '开始';
}

function restart() {
  pause();
  resetGame();
  start();
}

function speedToMs(val) {
  // 1..10 -> 220..70ms（线性反比）
  const min = 70, max = 220;
  const t = (val - 1) / (10 - 1);
  return Math.round(max + (min - max) * t);
}

// 控制绑定
toggleBtn.addEventListener('click', () => {
  running ? pause() : start();
});
restartBtn.addEventListener('click', restart);
speedRange.addEventListener('input', () => {
  // 运行时动态调整速度
  if (running) {
    clearInterval(loopId);
    loopId = setInterval(tick, speedToMs(Number(speedRange.value)));
  }
});

window.addEventListener('keydown', (e) => {
  switch (e.key.toLowerCase()) {
    case 'arrowup':
    case 'w':
      if (dir.y !== 1) nextDir = { x: 0, y: -1 }; break;
    case 'arrowdown':
    case 's':
      if (dir.y !== -1) nextDir = { x: 0, y: 1 }; break;
    case 'arrowleft':
    case 'a':
      if (dir.x !== 1) nextDir = { x: -1, y: 0 }; break;
    case 'arrowright':
    case 'd':
      if (dir.x !== -1) nextDir = { x: 1, y: 0 }; break;
    case ' ': // 空格
      running ? pause() : start();
      break;
  }
});

// 轻触控制（移动端简单支持：点击画布暂停/开始）
canvas.addEventListener('click', () => {
  running ? pause() : start();
});

// 初始化并绘制一次
resetGame();
draw();