const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const GRID_SIZE = 5;
const CELL_SIZE = canvas.width / GRID_SIZE;

let paths = {};
let solutionPaths = {};
let dots = {};
let currentColor = null;

const COLORS = ["red", "blue", "green"];

// ===== DRAW =====
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

function isOccupied(x, y) {
  for (let color in paths) {
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

// ===== RANDOM SOLVABLE LEVEL GENERATOR =====
function generateLevel() {
  dots = {};
  solutionPaths = {};
  paths = {};

  let occupied = new Set();

  COLORS.forEach(color => {
    let path = [];
    let x, y;

    do {
      x = Math.floor(Math.random() * GRID_SIZE);
      y = Math.floor(Math.random() * GRID_SIZE);
    } while (occupied.has(`${x},${y}`));

    path.push([x, y]);
    occupied.add(`${x},${y}`);

    let length = 4 + Math.floor(Math.random() * 4);

    for (let i = 0; i < length; i++) {
      let moves = [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1]
      ].filter(
        ([nx, ny]) =>
          isInside(nx, ny) && !occupied.has(`${nx},${ny}`)
      );

      if (moves.length === 0) break;

      [x, y] = moves[Math.floor(Math.random() * moves.length)];
      path.push([x, y]);
      occupied.add(`${x},${y}`);
    }

    solutionPaths[color] = path;
    dots[color] = [path[0], path[path.length - 1]];
  });

  drawGrid();
}

// ===== INPUT =====
canvas.addEventListener("pointerdown", (e) => {
  const [x, y] = getCell(e);
  for (let color in dots) {
    if (dots[color].some(d => d[0] === x && d[1] === y)) {
      currentColor = color;
      paths[color] = [[x, y]];
    }
  }
});

canvas.addEventListener("pointermove", (e) => {
  if (!currentColor) return;

  const [x, y] = getCell(e);
  if (!isInside(x, y)) return;

  const path = paths[currentColor];
  const last = path.at(-1);

  if (!isAdjacent(last, [x, y])) return;
  if (isOccupied(x, y)) return;

  path.push([x, y]);
  drawGrid();
});

canvas.addEventListener("pointerup", () => {
  currentColor = null;
  checkWin();
});

// ===== WIN CHECK =====
function checkWin() {
  for (let color in dots) {
    const path = paths[color];
    if (!path) return;

    const end = dots[color][1];
    const last = path.at(-1);
    if (last[0] !== end[0] || last[1] !== end[1]) return;
  }

  document.getElementById("status").innerText = "🎉 Level Complete!";
  setTimeout(generateLevel, 1000);
}

// ===== START =====
generateLevel();