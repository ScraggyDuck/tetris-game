const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(20, 20);

const colors = [
    null,
    'red',
    'green',
    'violet',
    'blue',
    'purple',
    'orange',
    'pink'
];

let updateID;
let levelID;
let levelCounter = 0;
let levelInterval = 60000;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let lastTimeLevel = 0;
const arena = createMatrix(12, 20);
const player = {
    pos: { x: 0, y: 0 },
    matrix: createPiece('T'),
    score: 0,
    rows: 0,
    level: 0
}


const startBtn = document.getElementById('startBtn');

document.addEventListener('keydown', event => {
    if (event.keyCode === 37) {
        playerMove(-1)
    } else if (event.keyCode === 39) {
        playerMove(1);
    } else if (event.keyCode === 40) {
        playerDrop()
    } else if (event.keyCode === 38) {
        playerRotate(1);
    } else if (event.keyCode === 32) {
        playerDropAll();
    }
});


startBtn.addEventListener('click', () => {
    startGame();
})

// GAME FUNCTION
function arenaSweep () {
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }

        // Tra ve 1 mang cac phan tu da xoa
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;

        player.score += rowCount * 100;
        player.rows += 1;
        // Neu co nhieu hang bi xoa thi tang gap doi diem
        rowCount *= 2;
    }
}

function changeLevel (time = 0) {
    const deltaTime = time - lastTimeLevel;
    lastTimeLevel = time;

    levelCounter += deltaTime;


    if (levelCounter > levelInterval) {
        player.level++;
        levelCounter = 0;
        updateLevel();
        dropInterval -= player.level * 50;
    }

    levelID = requestAnimationFrame(changeLevel);
}

function collide (arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (
                m[y][x] !== 0 &&
                (arena[y + o.y] &&
                    arena[y + o.y][x + o.x]) !== 0
            ) {
                return true;
            }
        }
    }
    return false;
}

function createMatrix (w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece (type) {
    if (type === 'T') {
        return [
            [0, 0, 0],
            [1, 1, 1],
            [0, 1, 0],
        ];
    } else if (type === 'O') {
        return [
            [2, 2],
            [2, 2],
        ];
    } else if (type === 'L') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [0, 3, 3],
        ];
    } else if (type === 'J') {
        return [
            [0, 4, 0],
            [0, 4, 0],
            [4, 4, 0],
        ];
    } else if (type === 'Z') {
        return [
            [5, 5, 0],
            [0, 5, 5],
            [0, 0, 0],
        ];
    } else if (type === 'I') {
        return [
            [0, 6, 0, 0],
            [0, 6, 0, 0],
            [0, 6, 0, 0],
            [0, 6, 0, 0]
        ];
    } else if (type === 'S') {
        return [
            [0, 7, 7],
            [7, 7, 0],
            [0, 0, 0],
        ];
    }
}

function draw () {
    context.fillStyle = '#000';
    // Ve hinh
    context.fillRect(0, 0, canvas.clientWidth, canvas.height);
    drawMatrix(player.matrix, player.pos);
    drawMatrix(arena, { x: 0, y: 0 });
}

function drawMatrix (matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(x + offset.x, y + offset.y, 0.9, 0.9);
            }
        })
    })
}

function gameOver () {
    cancelAnimationFrame(updateID);
    cancelAnimationFrame(levelID);
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.clientWidth, canvas.height);
    context.fillStyle = 'red';
    context.font = '1.5px arial';
    context.fillText("Game Over!", arena[0].length / 2 - 4, arena.length / 2);
}


function initGame () {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.clientWidth, canvas.height);
    reset();
}

function merge (arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        })
    })
}

function rotate (matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                    matrix[y][x],
                    matrix[x][y],
                ];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerRotate (dir) {
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        rotate(player.matrix, -dir);
    }
}

function playerDrop () {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
        updateRows();
    }
    dropCounter = 0;
}
function playerDropAll () {
    while (!collide(arena, player)) {
        player.pos.y++;
    }
    player.pos.y--;
}

function playerMove (dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

function playerReset () {
    const pieces = 'ILJOTSZ';
    player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
        (player.matrix[0] / 2 | 0) - 1;
    if (collide(arena, player)) {
        gameOver();
    }
}


function update (time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;

    if (dropCounter > dropInterval) {
        playerDrop();
    }
    draw();
    // Vong lap vo tan
    updateID = requestAnimationFrame(update);
}

function updateRows () {
    document.getElementById('rows').innerText = player.rows;
}

function updateScore () {
    document.getElementById('score').innerText = player.score;
}

function updateLevel () {
    document.getElementById('level').innerText = player.level;
}

function startGame () {
    arena.forEach(row => row.fill(0));
    reset();
    playerReset();
    update();
    changeLevel();
}

function reset () {
    player.score = 0;
    player.rows = 0;
    player.level = 0;
    dropInterval = 1000;
    updateScore();
    updateRows();
    updateLevel();
}

// END GAME FUNCTION

initGame();