const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ================= GAME STATE =================
let GRID_SIZE = 5;
let COLORS = ["red", "blue", "green"];

let dots = {};
let paths = {};
let solutionPaths = {};
let currentColor = null;
let level = 1;
let levelActive = true;

// ================= HELPERS =================
function cellSize() {
  return canvas.width / GRID_SIZE;
}

function inside(x, y) {
  return x >= 0 && y >= 0 && x < GRID_SIZE && y < GRID_SIZE;
}

function adjacent(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;
}

function cellFromEvent(e) {
  const r = canvas.getBoundingClientRect();
  return [
    Math.floor((e.clientX - r.left) / cellSize()),
    Math.floor((e.clientY - r.top) / cellSize())
  ];
}

function occupied(x, y, ignore) {
  for (let c in paths) {
    if (c === ignore) continue;
    if (paths[c].some(p => p[0] === x && p[1] === y)) return true;
  }
  return false;
}

// ================= DRAW =================
function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Grid
  ctx.strokeStyle = "#555";
  for (let i = 0; i <= GRID_SIZE; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cellSize(), 0);
    ctx.lineTo(i * cellSize(), canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * cellSize());
    ctx.lineTo(canvas.width, i * cellSize());
    ctx.stroke();
  }

  // Paths
  for (let c in paths) {
    ctx.strokeStyle = c;
    ctx.lineWidth = 10;
    ctx.shadowColor = c;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    paths[c].forEach(([x, y], i) => {
      const px = x * cellSize() + cellSize() / 2;
      const py = y * cellSize() + cellSize() / 2;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  // Dots
  for (let c in dots) {
    dots[c].forEach(([x, y]) => {
      ctx.fillStyle = c;
      ctx.shadowColor = c;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(
        x * cellSize() + cellSize() / 2,
        y * cellSize() + cellSize() / 2,
        cellSize() / 4,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });
  }
  ctx.shadowBlur = 0;

  document.getElementById("status").innerText = `Level ${level}`;
}

// ================= SOLVABLE PATH GENERATION =================
function generatePath(start, used, minLength) {
  let path = [start];
  used.add(start.join(","));

  while (path.length < minLength) {
    const [x, y] = path.at(-1);
    const options = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1]
    ].filter(([nx, ny]) =>
      inside(nx, ny) && !used.has(`${nx},${ny}`)
    );

    if (!options.length) return null;

    const next = options[Math.floor(Math.random() * options.length)];
    used.add(next.join(","));
    path.push(next);
  }
  return path;
}

// ================= LEVEL GENERATION =================
function generateLevel() {
  dots = {};
  paths = {};
  solutionPaths = {};
  levelActive = true;

  // Slow grid growth
  if (level % 4 === 0 && GRID_SIZE < 9) GRID_SIZE++;

  // Fast color growth
  const palette = ["orange", "purple", "cyan", "yellow", "pink", "lime"];
  while (COLORS.length < Math.min(GRID_SIZE + 1, 7)) {
    COLORS.push(palette[COLORS.length - 3]);
  }

  const used = new Set();
  const totalCells = GRID_SIZE * GRID_SIZE;

  for (let color of COLORS) {
    let path = null;
    let tries = 0;

    // High board coverage → harder puzzles
    const targetCoverage = 0.65 + Math.random() * 0.2;
    const minLength = Math.floor((totalCells * targetCoverage) / COLORS.length);

    while (!path && tries++ < 60) {
      const start = [
        Math.floor(Math.random() * GRID_SIZE),
        Math.floor(Math.random() * GRID_SIZE)
      ];
      if (used.has(start.join(","))) continue;
      path = generatePath(start, used, minLength);
    }

    if (!path) break;

    solutionPaths[color] = path;
    dots[color] = [path[0], path.at(-1)];
  }

  drawGrid();
}

// ================= INPUT =================
canvas.addEventListener("pointerdown", e => {
  if (!levelActive) return;
  const [x, y] = cellFromEvent(e);
  for (let c in dots) {
    if (dots[c].some(d => d[0] === x && d[1] === y)) {
      currentColor = c;
      paths[c] = [[x, y]];
    }
  }
});

canvas.addEventListener("pointermove", e => {
  if (!currentColor || !levelActive) return;
  const [x, y] = cellFromEvent(e);
  const p = paths[currentColor];
  const last = p.at(-1);

  if (!inside(x, y)) return;
  if (!adjacent(last, [x, y])) return;
  if (occupied(x, y, currentColor)) return;

  p.push([x, y]);
  drawGrid();
});

canvas.addEventListener("pointerup", () => {
  currentColor = null;
  checkWin();
});

// ================= WIN CHECK =================
function checkWin() {
  for (let c in dots) {
    const p = paths[c];
    if (!p || p.length < 2) return;

    const [a, b] = dots[c];
    const s = p[0];
    const e = p.at(-1);

    const ok =
      (s[0] === a[0] && s[1] === a[1] && e[0] === b[0] && e[1] === b[1]) ||
      (s[0] === b[0] && s[1] === b[1] && e[0] === a[0] && e[1] === a[1]);

    if (!ok) return;
  }

  levelActive = false;
  document.getElementById("status").innerText = "🎉 Level Complete!";
  level++;
  setTimeout(generateLevel, 1200);
}

// ================= START =================
generateLevel();