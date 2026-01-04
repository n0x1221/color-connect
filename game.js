const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const GRID_SIZE = 5;
const CELL_SIZE = canvas.width / GRID_SIZE;

let paths = {};
let currentColor = null;

const dots = {
  red: [[0, 0], [4, 4]],
  blue: [[0, 4], [4, 0]]
};

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Grid
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

  // Dots
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

  // Paths
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

function getCell(e) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
  const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);
  return [x, y];
}

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

  const last = paths[currentColor].at(-1);
  if (last && (last[0] !== x || last[1] !== y)) {
    paths[currentColor].push([x, y]);
    drawGrid();
  }
});

canvas.addEventListener("pointerup", () => {
  currentColor = null;
  checkWin();
});

function checkWin() {
  for (let color in dots) {
    const path = paths[color];
    if (!path) return;

    const end = dots[color][1];
    const last = path.at(-1);

    if (last[0] !== end[0] || last[1] !== end[1]) return;
  }

  document.getElementById("status").innerText = "🎉 Level Complete!";
}

drawGrid();