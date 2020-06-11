import {GRID_INITIAL_STATE, GAME_GRID_SIZE_N, GAME_GRID_SIZE_M, UP, LEFT, RIGHT, DOWN} from "../../../globalOptions";

export const transpose = arr => {
  const n = arr.length;
  const m = arr[0].length;

  let newArr = [];
  for (let i = 0; i < m; i++) {
    newArr.push(new Array(n).fill(0));
  }

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      newArr[j][i] = arr[i][j];
    }
  }

  return newArr;
}

// reverse just rows - columns can be reversed with transposition
export const reverse = arr => {
  let newArr = [];

  for (let row of arr) {
    let newRow = [];
    for (let i = row.length - 1; i >= 0; i--) {
      newRow.push(row[i]);
    }
    newArr.push(newRow);
  }

  return newArr;
}

// only need to stack left, all the other directions can be acheived by transposition and reversal
export const stackLeft = grid => {
  let newGrid = [];
  let deltaScore = 0;
  let destinations = [];

  // IMPLEMENT DESTINATIONS

  for (let row of grid) {
    let newRow = new Array(row.length).fill(0);
    let k = 0;
    for (let i = 0; i < row.length; i++) {
      if (row[i] !== 0) {
        if (newRow[k] === row[i]) {
          newRow[k] += row[i];
          deltaScore += newRow[k];
          k++;
        } else {
          if (newRow[k] === 0) {
            newRow[k] = row[i];
          } else {
            k++;
            newRow[k] = row[i];
          }
        }
      }
    }
    newGrid.push(newRow);
  }

  return {newGrid, deltaScore, destinations};
}

export const processMove = (direction, grid = GRID_INITIAL_STATE()) => {
  let newGrid, deltaScore, destinations;

  switch (direction) {
    case UP:
      newGrid = transpose(grid);
      ({newGrid, deltaScore, destinations} = stackLeft(newGrid));
      newGrid = transpose(newGrid);
      break;
    case RIGHT:
      newGrid = reverse(grid);
      ({newGrid, deltaScore, destinations} = stackLeft(newGrid));
      newGrid = reverse(newGrid);
      break;
    case DOWN:
      newGrid = transpose(grid);
      newGrid = reverse(newGrid);
      ({newGrid, deltaScore, destinations} = stackLeft(newGrid));
      newGrid = reverse(newGrid);
      newGrid = transpose(newGrid);
      break;
    default:
      ({newGrid, deltaScore, destinations} = stackLeft(grid));
  }

  return {newGrid, deltaScore, destinations};
};

// this is the common event handler called by any input type handler touch/mouse/keyboard
export const handleMove = (direction, grid) => {
  // call processMove() to stack grid

  // generte new Tile

  // handle animations parameters

  // call redux action creator updateGame() ?
};
