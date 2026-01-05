const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let GRID_SIZE = 5;
let COLORS = ["red", "blue", "green"];

let paths = {};
let dots = {};
let solutionPaths = {};
let currentColor = null;
let level = 1;
let levelActive = true;

const CELL = () => canvas.width / GRID_SIZE;

// ===== DRAW =====
function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#555";
  for (let i = 0; i <= GRID_SIZE; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CELL(), 0);
    ctx.lineTo(i * CELL(), canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * CELL());
    ctx.lineTo(canvas.width, i * CELL());
    ctx.stroke();
  }

  for (let color in dots) {
    dots[color].forEach(([x, y]) => {
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(
        x * CELL() + CELL() / 2,
        y * CELL() + CELL() / 2,
        CELL() / 4,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });
  }
  ctx.shadowBlur = 0;

  for (let color in paths) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 10;
    ctx.beginPath();
    paths[color].forEach(([x, y], i) => {
      const px = x * CELL() + CELL() / 2;
      const py = y * CELL() + CELL() / 2;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
  }

  document.getElementById("status").innerText = `Level ${level}`;
}

// ===== HELPERS =====
function inside(x, y) {
  return x >= 0 && y >= 0 && x < GRID_SIZE && y < GRID_SIZE;
}
function adj(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;
}
function cellFromEvent(e) {
  const r = canvas.getBoundingClientRect();
  return [
    Math.floor((e.clientX - r.left) / CELL()),
    Math.floor((e.clientY - r.top) / CELL())
  ];
}
function occupied(x, y, ignore) {
  for (let c in paths) {
    if (c === ignore) continue;
    if (paths[c].some(p => p[0] === x && p[1] === y)) return true;
  }
  return false;
}

// ===== SOLVABLE PATH GENERATOR =====
function generatePath(start, length, used) {
  let path = [start];
  used.add(start.join(","));

  while (path.length < length) {
    const [x, y] = path.at(-1);
    const options = [
      [x+1,y],[x-1,y],[x,y+1],[x,y-1]
    ].filter(([nx, ny]) =>
      inside(nx, ny) && !used.has(`${nx},${ny}`)
    );

    if (!options.length) break;
    const next = options[Math.floor(Math.random() * options.length)];
    used.add(next.join(","));
    path.push(next);
  }
  return path.length >= 2 ? path : null;
}

// ===== LEVEL GENERATION =====
function generateLevel() {
  paths = {};
  dots = {};
  solutionPaths = {};
  levelActive = true;

  if (level % 2 === 0 && GRID_SIZE < 8) GRID_SIZE++;
  if (level % 3 === 0 && COLORS.length < 6)
    COLORS.push(["orange","purple","cyan"][COLORS.length-3]);

  let used = new Set();

  for (let color of COLORS) {
    let path = null;
    while (!path) {
      const start = [
        Math.floor(Math.random() * GRID_SIZE),
        Math.floor(Math.random() * GRID_SIZE)
      ];
      if (used.has(start.join(","))) continue;
      path = generatePath(start, 4 + Math.floor(Math.random()*4), used);
    }
    solutionPaths[color] = path;
    dots[color] = [path[0], path.at(-1)];
  }

  drawGrid();
}

// ===== INPUT =====
canvas.addEventListener("pointerdown", e => {
  if (!levelActive) return;
  const [x,y] = cellFromEvent(e);
  for (let c in dots) {
    if (dots[c].some(d => d[0]===x && d[1]===y)) {
      currentColor = c;
      paths[c] = [[x,y]];
    }
  }
});

canvas.addEventListener("pointermove", e => {
  if (!currentColor || !levelActive) return;
  const [x,y] = cellFromEvent(e);
  const p = paths[currentColor];
  const last = p.at(-1);
  if (!inside(x,y) || !adj(last,[x,y]) || occupied(x,y,currentColor)) return;
  p.push([x,y]);
  drawGrid();
});

canvas.addEventListener("pointerup", () => {
  currentColor = null;
  checkWin();
});

// ===== WIN CHECK =====
function checkWin() {
  for (let c in dots) {
    const p = paths[c];
    if (!p || p.length < 2) return;
    const [a,b] = dots[c];
    const s = p[0], e = p.at(-1);
    if (!(
      (s[0]===a[0]&&s[1]===a[1]&&e[0]===b[0]&&e[1]===b[1]) ||
      (s[0]===b[0]&&s[1]===b[1]&&e[0]===a[0]&&e[1]===a[1])
    )) return;
  }

  levelActive = false;
  document.getElementById("status").innerText = "🎉 Solved!";
  level++;
  setTimeout(generateLevel, 1200);
}

// ===== START =====
generateLevel();