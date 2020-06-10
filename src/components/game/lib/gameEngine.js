// import {GRID_INITIAL_STATE, GAME_GRID_SIZE_N, GAME_GRID_SIZE_M, UP, LEFT, RIGHT, DOWN} from "../../../globalOptions";

const GAME_GRID_SIZE_N = 3;
const GAME_GRID_SIZE_M = 4;
const UP = "UP";
const LEFT = "LEFT";
const RIGHT = "RIGHT";
const DOWN = "DOWN";
const GRID_INITIAL_STATE = () => {
  let grid = [];
  for (let i = 0; i < GAME_GRID_SIZE_N; i++) {
    grid.push(new Array(GAME_GRID_SIZE_M).fill(0));
  }
  return grid;
};


// Real code starts here

const indices = (direction, i , j, n, m) => {
  switch (direction) {
    case LEFT:
      return [i, j];
    case UP:
      return [j, i];
    case RIGHT:
      return [i, m-1-j];
    case DOWN:
      return [n-1-i, j];
  }
}

const processMove = (direction, grid = GRID_INITIAL_STATE()) => {
  let newGrid = [];
  let deltaScore = 0;
  let destinations = [];
  let n, m;

  for (row of grid) {
    newGrid.push(row.slice(0));
  }

  let vertical = (direction === UP || direction === DOWN);
  let reverse = (direction === RIGHT || direction === DOWN);

  [n, m] = vertical ? [GAME_GRID_SIZE_M, GAME_GRID_SIZE_N] : [GAME_GRID_SIZE_N, GAME_GRID_SIZE_M];
  // [n, m] = [GAME_GRID_SIZE_N, GAME_GRID_SIZE_M];

  console.log(vertical, reverse);
  let count = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      [r, c] = indices(direction, i, j, n, m);

      console.log(r,c);
      newGrid[r][c] = count++;
    }
  }

  return {newGrid, deltaScore, destinations};
};

console.log(processMove(UP));