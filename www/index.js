import { Universe, Cell } from "game-of-life";
import { memory } from "game-of-life/game_of_life_bg.wasm";
import pattern_data from "./assets/patterns.json";

const CELL_SIZE = 5; // pixels
const GRID_COLOR = "#404240";
const DEAD_COLOR = "#adb3ae";
const ALIVE_COLOR = "#404240";

let universe = Universe.new();
const width = universe.width();
const height = universe.height();

const canvas = document.getElementById("game-of-life-canvas");
canvas.height = (CELL_SIZE + 1) * height + 1;
canvas.width = (CELL_SIZE + 1) * width + 1;
const ctx = canvas.getContext('2d');

const populatePatternList = () => {
    fetch('./assets/patterns.json')
    .then(response => response.json())
    .then(data => {
        const selectElement = document.getElementById("pattern-list");
        Object.keys(data).forEach((key) => {
            const optionElement = document.createElement("option");
            optionElement.value = key;
            optionElement.text = key;
            selectElement.appendChild(optionElement);
        });
    });
};

const selectPattern = document.getElementById("pattern-list");
selectPattern.addEventListener("change", () => {
    const selectedPattern = selectPattern.value;
    let selectedPatternCells = pattern_data[selectedPattern];
    let patternIdx = [];
    selectedPatternCells.forEach((value)=>{
        let row = value[0];
        let column = value[1];
        patternIdx.push(getIndex(row, column));
    });
    universe.set_pattern(patternIdx);
    drawCells();
    pause();
});

const getIndex = (row, column) => {
    return row * width + column;
};

const drawCells = () => {
    const cellsPtr = universe.cells();
    const cells = new Uint8Array(memory.buffer, cellsPtr, width * height);
    ctx.beginPath();

    for(let row = 0; row < height; row++) {
        for(let col = 0; col < width; col++) {
            const idx = getIndex(row, col);
            ctx.fillStyle = cells[idx] === Cell.Dead ? DEAD_COLOR : ALIVE_COLOR;
            ctx.fillRect(
                col * (CELL_SIZE + 1) + 1,
                row * (CELL_SIZE + 1) + 1,
                CELL_SIZE,
                CELL_SIZE
            );
        }
    }
    ctx.stroke();
};

const drawGrid = () => {
    ctx.beginPath();
    ctx.strokeStyle = GRID_COLOR;
    // vertical lines
    for(let i = 0; i <= width; i++){
        ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
        ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * height + 1);
    }
    //horizontal lines
    for(let i = 0; i <= height; i++){
        ctx.moveTo(0, i * (CELL_SIZE + 1) + 1);
        ctx.lineTo((CELL_SIZE + 1) * width + 1, i * (CELL_SIZE + 1) + 1);
    }
    ctx.stroke();
}

let animationId = null;
const playPauseButton = document.getElementById("play-pause");
console.log(playPauseButton)
let pauseFlag = false;
const play = () => {
    playPauseButton.textContent = "⏸";
    pauseFlag = false;
    renderLoop();
}

const pause = () => {
    playPauseButton.textContent = "▶";
    pauseFlag = true;
};

playPauseButton.addEventListener("click", event => {
    if(pauseFlag) {
        play();
    } else {
        pause();
    }
});

const resetButton = document.getElementById("reset");
resetButton.addEventListener("click", ()=>{
    universe.reset_universe();
    drawGrid();
    drawCells();
    console.log("Trying to reset the universe!!!");
});

const randomizeButton = document.getElementById("randomize");
randomizeButton.addEventListener("click", ()=>{
    universe = Universe.new();
    drawGrid();
    drawCells();
    console.log("Trying to randomize the universe!!!");
});

canvas.addEventListener("click", event => {
    console.log("Clicking the canvas")
    const boundingRect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / boundingRect.width;
    const scaleY = canvas.height / boundingRect.height;
    const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
    const canvasTop = (event.clientY - boundingRect.top) * scaleY;
    const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), height - 1);
    const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), width - 1);
    universe.toggle_cell(row, col);
    drawGrid();
    drawCells();
});

const fps = document.getElementById("fps-meter");
const fpsValue = document.getElementById("fps-value");
const actualFps = document.getElementById("actual-fps");
fps.addEventListener("click", () => {
    fpsValue.textContent = fps.value;
});

let wait_duration = Infinity;
const renderLoop = () => {
    // debugger;
    console.log(fps.value);
    let true_fps = 0;
    let lastTickTime = performance.now();
    let delta = 0;
    if(!pauseFlag){
        wait_duration = 1000/(fps.value);
        setTimeout(() => {
            animationId = requestAnimationFrame(renderLoop);
        }, wait_duration);
        universe.tick();
        delta = performance.now() - lastTickTime + wait_duration;
        lastTickTime = performance.now();
        true_fps = (1000/delta).toFixed(2);
        actualFps.textContent = "Actual FPS: " + true_fps;
        drawGrid();
        drawCells();
    } else {
        actualFps.textContent = "Actual FPS: " + 0;
    } 
};

populatePatternList();
play();


