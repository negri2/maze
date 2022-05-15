let maze = document.querySelector(".maze");
let ctx = maze.getContext("2d");

let current;

let form = document.querySelector("#settings");
let size = document.querySelector("#size");
let rowsCols = document.querySelector("#number");
let complete = document.querySelector("#complete");
let resolve = document.querySelector("#resolve");
let resolveBtn = document.querySelector(".resolve");
let reloadBtn = document.querySelector(".newMaze");

let newMaze;

form.addEventListener("submit", generateMaze);

function reload(e) {
    location.reload();
}

function generateMaze(e) {
    e.preventDefault();

    if (rowsCols.value == "" || size.value == "") {
        return alert("Please enter all fields");
    }

    let mazeSize = size.value;
    let number = rowsCols.value;
    if (mazeSize > 600 || number > 50) {
        alert("Maze too large!");
        return;
    }

    form.style.display = "none";

    newMaze = new Maze(mazeSize, number, number);
    newMaze.setup();
    newMaze.draw();
}

function resolveMaze(e) {
    e.preventDefault();

    complete.style.display = "none";

    newMaze.current = newMaze.grid[0][0];
    newMaze.grid[rowsCols.value - 1][rowsCols.value - 1].goal = true;
    newMaze.grid[rowsCols.value - 1][rowsCols.value - 1].goalColor(rowsCols.value);
    newMaze.stack = [];
    newMaze.path = [];
    newMaze.resolve();

}

class Maze {
    constructor(size, rows, columns) {
        this.size = size;
        this.rows = rows;
        this.columns = columns;
        this.grid = [];
        this.stack = [];
        this.path = [];
    }

    setup() {
        for (let r = 0; r < this.rows; r++) {
            let row = [];
            for (let c = 0; c < this.columns; c++) {
                let cell = new Cell(r, c, this.grid, this.size);
                row.push(cell);
            }
            this.grid.push(row);
        }
        current = this.grid[0][0];
    }

    draw() {
        maze.width = this.size;
        maze.height = this.size;
        maze.style.background = 'black';
        current.visited = true;

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.columns; c++) {
                let grid = this.grid;
                grid[r][c].show(this.size, this.rows, this.columns);
            }
        }

        let next = current.checkNeighbours();

        if (next) {
            next.visited = true;

            this.stack.push(current);

            current.highlight(this.columns);

            current.removeWalls(current, next);

            current = next;

        } else if (this.stack.length > 0) {
            let cell = this.stack.pop();
            current = cell;
            current.highlight(this.columns);
        }

        if (this.stack.length === 0) {
            complete.style.display = "flex";

            return;
        }

        window.requestAnimationFrame(() => {
            this.draw();
        });
    }

    resolve() {

        //buscar movimentos possiveis, retorna array
        //removendo o movimento anterior (para não voltar)
        //se array é null, então pop na stack (volta)

        //random dentro daquele array
        //salva a nova cell numa stack e marca como visitada
        let movs = [];
        current.passed = true;

        if (!current.walls.topWall) movs.push(1);
        if (!current.walls.rightWall) movs.push(2);
        if (!current.walls.bottomWall) movs.push(3);
        if (!current.walls.leftWall) movs.push(4);

        //remove last mov
        if (this.path.length > 0) {

            let lastMov = this.path[this.path.length - 1];
            let movToRemove = this.invertMov(lastMov);

            const _index = movs.findIndex(i => i === movToRemove);
            if (_index !== -1)
                movs.splice(_index, 1);
        }

        //remove mov visited
        for (let i = movs.length - 1; i >= 0; i--) {
            let next = this.getNextMov(movs[i]);

            if (next.passed)
                movs.splice(i, 1);
        }

        if (movs.length === 0) {

            this.drawLinePath(current, this.stack[this.stack.length - 1], true);

            current = this.stack.pop();
            this.path.pop();
        } else {

            this.stack.push(current);

            let random = Math.floor(Math.random() * movs.length);
            let nextMov = movs[random];

            this.path.push(nextMov);

            let next;
            if (nextMov === 1) //top
                next = this.grid[current.rowNum - 1][current.colNum];
            else if (nextMov === 2) //right
                next = this.grid[current.rowNum][current.colNum + 1];
            else if (nextMov === 3) //bottom
                next = this.grid[current.rowNum + 1][current.colNum];
            else if (nextMov === 4) //left
                next = this.grid[current.rowNum][current.colNum - 1];

            this.drawLinePath(current, next);
            current = next;
        }

        if (current.goal) {
            resolve.style.display = "flex";
            return;
        }

        window.requestAnimationFrame(() => {
            this.resolve();
        });
    }

    getNextMov(mov) {

        if (mov === 1) //top
            return this.grid[current.rowNum - 1][current.colNum];
        if (mov === 2) //right
            return this.grid[current.rowNum][current.colNum + 1];
        if (mov === 3) //bottom
            return this.grid[current.rowNum + 1][current.colNum];
        if (mov === 4) //left
            return this.grid[current.rowNum][current.colNum - 1];
    }

    drawLinePath(cur, next, reset = false) {

        let cellSize = this.size / this.rows;

        let x = (cur.colNum * cellSize) + (cellSize / 2);
        let y = (cur.rowNum * cellSize) + (cellSize / 2);

        let newX = (next.colNum * cellSize) + (cellSize / 2);
        let newY = (next.rowNum * cellSize) + (cellSize / 2);

        ctx.beginPath();
        ctx.strokeStyle = reset ? 'black' : '#cc0000';
        ctx.moveTo(x, y);
        ctx.lineTo(newX, newY);
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = reset ? '#4996f5' : '#cc0000';
        ctx.arc(x, y, 5, 0, 2 * Math.PI, true);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = '#cc0000';
        ctx.arc(newX, newY, 5, 0, 2 * Math.PI, true);
        ctx.fill();
    }

    invertMov(mov) {
        switch (mov) {
            case 1:
                return 3;
            case 2:
                return 4;
            case 3:
                return 1;
            case 4:
                return 2;
        }

    }
}


class Cell {
    constructor(rowNum, colNum, parentGrid, parentSize) {
        this.rowNum = rowNum;
        this.colNum = colNum;
        this.parentGrid = parentGrid;
        this.parentSize = parentSize;
        this.visited = false;
        this.passed = false;
        this.goal = false;
        this.walls = {
            topWall: true,
            rightWall: true,
            bottomWall: true,
            leftWall: true,
        };
    }

    checkNeighbours() {
        let grid = this.parentGrid;
        let row = this.rowNum;
        let col = this.colNum;
        let neighbours = [];

        let top = row !== 0 ? grid[row - 1][col] : undefined;
        let right = col !== grid.length - 1 ? grid[row][col + 1] : undefined;
        let bottom = row !== grid.length - 1 ? grid[row + 1][col] : undefined;
        let left = col !== 0 ? grid[row][col - 1] : undefined;

        if (top && !top.visited) neighbours.push(top);
        if (right && !right.visited) neighbours.push(right);
        if (bottom && !bottom.visited) neighbours.push(bottom);
        if (left && !left.visited) neighbours.push(left);

        if (neighbours.length !== 0) {
            let random = Math.floor(Math.random() * neighbours.length);
            return neighbours[random];
        } else {
            return undefined;
        }
    }

    drawTopWall(x, y, size, columns, rows) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + size / columns, y);
        ctx.stroke();
    }

    drawRightWall(x, y, size, columns, rows) {
        ctx.beginPath();
        ctx.moveTo(x + size / columns, y);
        ctx.lineTo(x + size / columns, y + size / rows);
        ctx.stroke();
    }

    drawBottomWall(x, y, size, columns, rows) {
        ctx.beginPath();
        ctx.moveTo(x, y + size / rows);
        ctx.lineTo(x + size / columns, y + size / rows);
        ctx.stroke();
    }

    drawLeftWall(x, y, size, columns, rows) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + size / rows);
        ctx.stroke();
    }

    highlight(columns) {
        let x = (this.colNum * this.parentSize) / columns + 1;
        let y = (this.rowNum * this.parentSize) / columns + 1;

        ctx.fillStyle = 'purple';
        ctx.fillRect(x, y, this.parentSize / columns - 3, this.parentSize / columns - 3);
    }
    
    goalColor(columns) {
        let x = (this.colNum * this.parentSize) / columns + 1;
        let y = (this.rowNum * this.parentSize) / columns + 1;

        ctx.fillStyle = 'green';
        ctx.fillRect(x, y, this.parentSize / columns - 3, this.parentSize / columns - 3);
    }

    removeWalls(cell1, cell2) {
        let x = (cell1.colNum - cell2.colNum);

        if (x === 1) {
            cell1.walls.leftWall = false;
            cell2.walls.rightWall = false;

        } else if (x == -1) {
            cell1.walls.rightWall = false;
            cell2.walls.leftWall = false;
        }

        let y = cell1.rowNum - cell2.rowNum;

        if (y === 1) {
            cell1.walls.topWall = false;
            cell2.walls.bottomWall = false;

        } else if (y == -1) {
            cell1.walls.bottomWall = false;
            cell2.walls.topWall = false;
        }
    }

    show(size, rows, columns) {
        let x = (this.colNum * size) / columns;
        let y = (this.rowNum * size) / rows;

        ctx.strokeStyle = "white";
        ctx.fillStyle = "black";
        ctx.lineWidth = 2;

        if (this.walls.topWall) this.drawTopWall(x, y, size, columns, rows);
        if (this.walls.rightWall) this.drawRightWall(x, y, size, columns, rows);
        if (this.walls.bottomWall) this.drawBottomWall(x, y, size, columns, rows);
        if (this.walls.leftWall) this.drawLeftWall(x, y, size, columns, rows);

        if (this.visited) {
            ctx.fillRect(x + 1, y + 1, size / columns - 2, size / rows - 2);
        }
    }
}

// let newMaze = new Maze(500, 20, 20);
// newMaze.setup();
// newMaze.draw();