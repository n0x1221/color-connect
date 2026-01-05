const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const GRID_SIZE = 5;
const CELL_SIZE = canvas.width / GRID_SIZE;

let paths = {};
let dots = {};
let currentColor = null;
let levelActive = true;

const COLORS = ["red", "blue", "green"];

// ===== DRAW GRID AND DOTS =====
function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Grid lines
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

  // Draw player paths
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

// ===== GENERATE RANDOM LEVEL =====
function generateLevel() {
  paths = {};
  dots = {};
  levelActive = true;

  let occupied = new Set();

  COLORS.forEach(color => {
    let start, end;

    // Pick start dot
    do {
      start = [Math.floor(Math.random() * GRID_SIZE), Math.floor(Math.random() * GRID_SIZE)];
    } while (occupied.has(`${start[0]},${start[1]}`));
    occupied.add(`${start[0]},${start[1]}`);

    // Pick end dot, must be distinct
    do {
      end = [Math.floor(Math.random() * GRID_SIZE), Math.floor(Math.random() * GRID_SIZE)];
    } while (occupied.has(`${end[0]},${end[1]}`) || (end[0] === start[0] && end[1] === start[1]));
    occupied.add(`${end[0]},${end[1]}`);

    dots[color] = [start, end];
  });

  document.getElementById("status").innerText = "New Level";
  drawGrid();
}

// ===== INPUT HANDLERS =====
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

// ===== WIN DETECTION (RELAXED, PLAYABLE) =====
function checkWin() {
  for (let color in dots) {
    const path = paths[color];
    if (!path || path.length < 2) return;

    const [start, end] = dots[color];
    const first = path[0];
    const last = path[path.length - 1];

    // Must connect the dots (either order is fine)
    const connectsCorrectly =
      (first[0] === start[0] && first[1] === start[1] && last[0] === end[0] && last[1] === end[1]) ||
      (first[0] === end[0] && first[1] === end[1] && last[0] === start[0] && last[1] === start[1]);
    if (!connectsCorrectly) return;

    // All steps must be adjacent
    for (let i = 0; i < path.length - 1; i++) {
      if (!isAdjacent(path[i], path[i + 1])) return;
    }

    // Cannot cross other paths
    for (let i = 0; i < path.length; i++) {
      const [x, y] = path[i];
      for (let other in paths) {
        if (other === color) continue;
        if (paths[other].some(p => p[0] === x && p[1] === y)) return;
      }
    }
  }

  // All colors connected correctly
  levelActive = false;
  document.getElementById("status").innerText = "🎉 Level Complete!";
  setTimeout(generateLevel, 1000);
}

// ===== START GAME =====
generateLevel();