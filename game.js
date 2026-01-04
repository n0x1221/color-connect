const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const GRID_SIZE = 5;
const CELL_SIZE = canvas.width / GRID_SIZE;

let paths = {};
let solutionPaths = {}; // Store full solution paths
let dots = {};
let currentColor = null;
let levelActive = true;

const COLORS = ["red", "blue", "green"];

// ===== DRAW GRID =====
function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#555";
  for (let i = 0; i <= GRID_SIZE; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CELL_SIZE, 0);
    ctx.lineTo(i * CELL_SIZE, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * CELL_SIZE);
    ctx.lineTo(canvas.width, i * CELL_SIZE);
    ctx.stroke();
  }

  // Draw dots
  for (let color in dots) {
    dots[color].forEach(([x, y]) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(
        x * CELL_SIZE + CELL_SIZE / 2,
        y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 4,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });
  }

  // Draw paths
  for (let color in paths) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 10;
    ctx.beginPath();
    paths[color].forEach(([x, y], i) => {
      const px = x * CELL_SIZE + CELL_SIZE / 2;
      const py = y * CELL_SIZE + CELL_SIZE / 2;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
  }
}

// ===== HELPERS =====
function isInside(x, y) {
  return x >= 0 && y >= 0 && x < GRID_SIZE && y < GRID_SIZE;
}

function isAdjacent(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;
}

function isOccupied(x, y, ignoreColor) {
  for (let color in paths) {
    if (color === ignoreColor) continue;
    if (paths[color].some(p => p[0] === x && p[1] === y)) return true;
  }
  return false;
}

function getCell(e) {
  const rect = canvas.getBoundingClientRect();
  return [
    Math.floor((e.clientX - rect.left) / CELL_SIZE),
    Math.floor((e.clientY - rect.top) / CELL_SIZE)
  ];
}

// ===== SOLVABLE PATH GENERATOR =====
function generateRandomPath(length, occupied) {
  let x = Math.floor(Math.random() * GRID_SIZE);
  let y = Math.floor(Math.random() * GRID_SIZE);
  let path = [[x, y]];
  occupied.add(`${x},${y}`);

  for (let i = 0; i < length; i++) {
    let moves = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1]
    ].filter(([nx, ny]) => isInside(nx, ny) && !occupied.has(`${nx},${ny}`));

    if (moves.length === 0) break;

    [x, y] = moves[Math.floor(Math.random() * moves.length)];
    path.push([x, y]);
    occupied.add(`${x},${y}`);
  }
  return path;
}

// ===== GENERATE NEW LEVEL =====
function generateLevel() {
  paths = {};
  solutionPaths = {};
  dots = {};
  levelActive = true;

  let occupied = new Set();

  COLORS.forEach(color => {
    const path = generateRandomPath(4 + Math.floor(Math.random() * 3), occupied);
    solutionPaths[color] = path;
    dots[color] = [path[0], path[path.length - 1]];
  });

  document.getElementById("status").innerText = "New Level";
  drawGrid();
}

// ===== INPUT =====
canvas.addEventListener("pointerdown", (e) => {
  if (!levelActive) return;

  const [x, y] = getCell(e);
  for (let color in dots) {
    if (dots[color].some(d => d[0] === x && d[1] === y)) {
      currentColor = color;
      paths[color] = [[x, y]];
    }
  }
});

canvas.addEventListener("pointermove", (e) => {
  if (!currentColor || !levelActive) return;

  const [x, y] = getCell(e);
  if (!isInside(x, y)) return;

  const path = paths[currentColor];
  const last = path.at(-1);

  if (!isAdjacent(last, [x, y])) return;
  if (isOccupied(x, y, currentColor)) return;

  path.push([x, y]);
  drawGrid();
});

canvas.addEventListener("pointerup", () => {
  currentColor = null;
  checkWin();
});

// ===== CHECK WIN =====
function checkWin() {
  for (let color in solutionPaths) {
    const sol = solutionPaths[color];
    const playerPath = paths[color];
    if (!playerPath) return;

    // Must match length & endpoints
    if (playerPath.length !== sol.length) return;
    for (let i = 0; i < sol.length; i++) {
      if (playerPath[i][0] !== sol[i][0] || playerPath[i][1] !== sol[i][1]) return;
    }
  }

  levelActive = false;
  document.getElementById("status").innerText = "🎉 Level Complete!";
  setTimeout(generateLevel, 1200);
}

// ===== START =====
generateLevel();