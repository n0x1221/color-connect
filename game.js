const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ===== GAME STATE =====
let GRID_SIZE = 5;
let COLORS = ["red", "blue", "green"];
let paths = {};
let dots = {};
let currentColor = null;
let levelActive = true;
let level = 1;
let moves = 0;

// ===== DRAW FUNCTIONS =====
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = "#555";
    for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * canvas.width / GRID_SIZE, 0);
        ctx.lineTo(i * canvas.width / GRID_SIZE, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * canvas.height / GRID_SIZE);
        ctx.lineTo(canvas.width, i * canvas.height / GRID_SIZE);
        ctx.stroke();
    }

    // Draw paths with glow
    for (let color in paths) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 10;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        paths[color].forEach(([x, y], i) => {
            const px = x * canvas.width / GRID_SIZE + canvas.width / GRID_SIZE / 2;
            const py = y * canvas.height / GRID_SIZE + canvas.height / GRID_SIZE / 2;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        });
        ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // Draw dots with glow
    for (let color in dots) {
        dots[color].forEach(([x, y]) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            const px = x * canvas.width / GRID_SIZE + canvas.width / GRID_SIZE / 2;
            const py = y * canvas.height / GRID_SIZE + canvas.height / GRID_SIZE / 2;
            ctx.arc(px, py, canvas.width / GRID_SIZE / 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
            ctx.fill();
        });
        ctx.shadowBlur = 0;
    }

    // Update HUD
    document.getElementById("status").innerText = `Level: ${level} | Moves: ${moves}`;
}

// ===== HELPERS =====
function isInside(x, y) { return x >= 0 && y >= 0 && x < GRID_SIZE && y < GRID_SIZE; }
function isAdjacent(a, b) { return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1; }
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
        Math.floor((e.clientX - rect.left) / (canvas.width / GRID_SIZE)),
        Math.floor((e.clientY - rect.top) / (canvas.height / GRID_SIZE))
    ];
}

// ===== LEVEL GENERATION =====
function generateLevel() {
    paths = {};
    dots = {};
    levelActive = true;
    moves = 0;

    // Difficulty scaling: add colors and increase grid
    if (level % 2 === 0 && GRID_SIZE < 8) GRID_SIZE++;
    if (level % 2 === 0 && COLORS.length < 6) COLORS.push("orange", "purple", "cyan")[level % 3];

    const occupied = new Set();

    COLORS.forEach(color => {
        let start, end;
        do { start = [Math.floor(Math.random() * GRID_SIZE), Math.floor(Math.random() * GRID_SIZE)]; }
        while (occupied.has(`${start[0]},${start[1]}`));
        occupied.add(`${start[0]},${start[1]}`);

        do { end = [Math.floor(Math.random() * GRID_SIZE), Math.floor(Math.random() * GRID_SIZE)]; }
        while (occupied.has(`${end[0]},${end[1]}`) || (end[0] === start[0] && end[1] === start[1]));
        occupied.add(`${end[0]},${end[1]}`);

        dots[color] = [start, end];
    });

    drawGrid();
}

// ===== INPUT HANDLERS =====
canvas.addEventListener("pointerdown", e => {
    if (!levelActive) return;
    const [x, y] = getCell(e);
    for (let color in dots) {
        if (dots[color].some(d => d[0] === x && d[1] === y)) {
            currentColor = color;
            paths[color] = [[x, y]];
            moves++;
        }
    }
});

canvas.addEventListener("pointermove", e => {
    if (!currentColor || !levelActive) return;
    const [x, y] = getCell(e);
    const path = paths[currentColor];
    const last = path.at(-1);

    if (!isInside(x, y) || !isAdjacent(last, [x, y])) return;
    if (isOccupied(x, y, currentColor)) return;

    path.push([x, y]);
    drawGrid();
});

canvas.addEventListener("pointerup", () => {
    currentColor = null;
    checkWin();
});

// ===== UNDO PATH (LONG PRESS) =====
let longPressTimer;
canvas.addEventListener("pointerdown", e => {
    longPressTimer = setTimeout(() => {
        if (currentColor && paths[currentColor]?.length > 1) {
            paths[currentColor].pop();
            drawGrid();
        }
    }, 500);
});
canvas.addEventListener("pointerup", e => clearTimeout(longPressTimer));

// ===== WIN DETECTION =====
function checkWin() {
    for (let color in dots) {
        const path = paths[color];
        if (!path || path.length < 2) return;
        const [start, end] = dots[color];
        const first = path[0], last = path[path.length-1];
        const connects = (first[0] === start[0] && first[1] === start[1] && last[0] === end[0] && last[1] === end[1])
                      || (first[0] === end[0] && first[1] === end[1] && last[0] === start[0] && last[1] === start[1]);
        if (!connects) return;

        for (let i = 0; i < path.length-1; i++) {
            if (!isAdjacent(path[i], path[i+1])) return;
        }
        for (let i = 0; i < path.length; i++) {
            const [x, y] = path[i];
            for (let other in paths) {
                if (other === color) continue;
                if (paths[other].some(p => p[0] === x && p[1] === y)) return;
            }
        }
    }

    levelActive = false;
    document.getElementById("status").innerText = `🎉 Level ${level} Complete!`;
    level++;
    setTimeout(generateLevel, 1200);
}

// ===== START GAME =====
generateLevel();