import {GRID_INITIAL_STATE, UP, RIGHT, DOWN, TILE_2_PROBABILITY} from "../../../globalOptions";
import { updateGame } from "../../../actions";

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

export const changeSign = arr => {
  let newArr = [];

  for (let row of arr) {
    let newRow = [];
    for (let el of row) {
      newRow.push(-el);
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
    let destRow = new Array(row.length).fill(0);
    let k = 0;
    for (let i = 0; i < row.length; i++) {
      if (row[i] !== 0) {
        if (newRow[k] === row[i]) {
          newRow[k] += row[i];
          deltaScore += newRow[k];
          destRow[i] = k - i;
          k++;
        } else {
          if (newRow[k] === 0) {
            newRow[k] = row[i];
          } else {
            k++;
            newRow[k] = row[i];
          }
          destRow[i] = k - i;
        }
      }
    }
    newGrid.push(newRow);
    destinations.push(destRow);
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
      destinations = transpose(destinations);
      break;
    case RIGHT:
      newGrid = reverse(grid);
      ({newGrid, deltaScore, destinations} = stackLeft(newGrid));
      newGrid = reverse(newGrid);
      destinations = changeSign(reverse(destinations));
      break;
    case DOWN:
      newGrid = reverse(transpose(grid));
      ({newGrid, deltaScore, destinations} = stackLeft(newGrid));
      newGrid = transpose(reverse(newGrid));
      destinations = changeSign(transpose(reverse(destinations)));
      break;
    default:
      ({newGrid, deltaScore, destinations} = stackLeft(grid));
  }

  return {newGrid, deltaScore, destinations};
};

export const generateTile = grid => {
  
};

// this is the common event handler called by any input type handler touch/mouse/keyboard
export const handleMove = (direction, grid) => {
  // call processMove() to stack grid
  let {newGrid, deltaScore, destinations} = processMove(direction, grid);
  console.log(newGrid);
  // handle animations parameters


  // call redux action creator updateGame() ?
  updateGame(newGrid, deltaScore);
};
