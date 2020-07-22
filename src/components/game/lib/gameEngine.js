import {GRID_INITIAL_STATE, UP, LEFT, RIGHT, DOWN, TILE_2_PROBABILITY, ROW, COLUMN, GAME_GRID_SIZE_N, GAME_GRID_SIZE_M} from "../../../globalOptions";
import {precomputedMoves} from "./precomputedMoves";
import {encodeRow, decodeRow} from "./encoding";


// HELPER FUNCTIONS

export const gridSum = grid => grid.map(row => row.reduce((a, b) => a + b)).reduce((a, b) => a + b);

export const copyGrid = (arr = GRID_INITIAL_STATE()) => {
  const newArr = [];
  
  for (let row of arr) {
    newArr.push(row.slice(0));
  }

  return newArr;
}

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

export const zeroCount = arr => {
  let count = 0;
  
  for (let row of arr) {
    count += row.filter(el => el === 0).length;
  }

  return count;
}

// only need to stack left, all the other directions can be acheived by transposition and reversal
export const stackLeft = grid => {
  let newGrid = [];
  let deltaScore = 0;
  let destinations = [];

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


// GAME ENGINE FUNCTIONS

// Old definition of process move without precomputed moves
// export const processMove = (direction, grid = GRID_INITIAL_STATE()) => {
//   let newGrid, deltaScore, destinations;

//   switch (direction) {
//     case UP:
//       newGrid = transpose(grid);
//       ({newGrid, deltaScore, destinations} = stackLeft(newGrid));
//       newGrid = transpose(newGrid);
//       destinations = transpose(destinations);
//       break;
//     case RIGHT:
//       newGrid = reverse(grid);
//       ({newGrid, deltaScore, destinations} = stackLeft(newGrid));
//       newGrid = reverse(newGrid);
//       destinations = changeSign(reverse(destinations));
//       break;
//     case DOWN:
//       newGrid = reverse(transpose(grid));
//       ({newGrid, deltaScore, destinations} = stackLeft(newGrid));
//       newGrid = transpose(reverse(newGrid));
//       destinations = changeSign(transpose(reverse(destinations)));
//       break;
//     default:
//       ({newGrid, deltaScore, destinations} = stackLeft(grid));
//   }

//   return {newGrid, deltaScore, destinations};
// };


// NEW HELPER FUNCTIONS FOR ROWS
export const getArray = (grid = GRID_INITIAL_STATE(), i = 0, type = ROW, reverse = false) => {
  if (type === ROW) {
    return reverse ? grid[i].slice(0).reverse() : grid[i].slice(0);
  } else {
    let newRow = [];
    if (reverse) {
      for (let k = GAME_GRID_SIZE_N - 1; k >= 0; k--) {
        newRow.push(grid[k][i]);
      }
    } else {
      for (let k = 0; k < GAME_GRID_SIZE_N; k++) {
        newRow.push(grid[k][i]);
      }
    }
    return newRow;
  }
};

export const setArray = (arr, grid, i = 0, type = ROW, reverse = false) => {
  if (type === ROW) {
    grid[i] = reverse ? arr.slice(0).reverse() : arr.slice(0);
  } else {
    if (reverse) {
      for (let k = 0; k < GAME_GRID_SIZE_N; k++) {
        grid[k][i] = arr[GAME_GRID_SIZE_N - 1 - k];
      }
    } else {
      for (let k = 0; k < GAME_GRID_SIZE_N; k++) {
        grid[k][i] = arr[k];
      }
    }
  }
  return grid;
}

// New definition of process move with precomputed moves
export const processMove = (direction, grid = GRID_INITIAL_STATE()) => {
  let newGrid = copyGrid(grid); 
  let deltaScore = 0; 
  let destinations = GRID_INITIAL_STATE();
  let arr, encArr, newArr, scoreArr, destArr;
  let type, reverse, trasformDest = () => {};

  switch (direction) {
    case UP:
      ([type, reverse] = [COLUMN, false]);
      break;
    case RIGHT:
      ([type, reverse] = [ROW, true]);
      break;
    case DOWN:
      ([type, reverse] = [COLUMN, true]);
      break;
    default:
      ([type, reverse] = [ROW, false]);
  }

  let n = type === ROW ? GAME_GRID_SIZE_N : GAME_GRID_SIZE_M;
  for (let k = 0; k < n; k++) {
    arr = getArray(grid, k, type, reverse);
    encArr = encodeRow(arr);
    if (precomputedMoves.has(encArr)) {
      ([newArr, scoreArr, destArr] = precomputedMoves.get(encArr));
      newArr = decodeRow(newArr);
    } else {
      ([newArr, scoreArr, destArr] = [arr, 0, [0, 0, 0, 0]]);
    }
    newGrid = setArray(newArr, newGrid, k, type, reverse);
    deltaScore += scoreArr;
    destinations = setArray(destArr, destinations, k, type, reverse);
  }
  if (reverse) {
    destinations = changeSign(destinations);
  }

  return {newGrid, deltaScore, destinations};
};

// test variable used only for testing purposes forces a 2 in the first available zero tile
export const addRandomTile = (grid, test = false) => {
  const zeros = zeroCount(grid);
  if (!zeros) {
    return {newGrid: grid, newTile: null};
  }

  // random parameters initialization - fixed in test mode
  let pos = test ? 1 : Math.ceil(Math.random() * zeros);
  const newTile = test ? 2 : Math.random() < TILE_2_PROBABILITY ? 2 : 4;

  let newGrid = copyGrid(grid);

  let i, j;
  for (i = 0; i < newGrid.length; i++) {
    for (j = 0; j < newGrid[i].length; j++) {
      if (!newGrid[i][j]) {
        pos--;
      }
      if (!pos) {
        newGrid[i][j] = newTile;
        break;
      }
    }
    if (!pos) {
      break;
    }
  }
  
  return {newGrid: newGrid, newTile: {i: i, j: j, value: newTile}};
};

// check validity by summing up the destinations - if non-zero, a movement has been made
export const isNonEmpty = destinations => !!gridSum(destinations);

export const isGameOver = grid => {
  // process grid to return true
  if (!zeroCount(grid)) {
    return ![UP, LEFT, RIGHT, DOWN]
      .map(direction => processMove(direction, grid).deltaScore)
      .reduce((totSum, score) => totSum + score);
  }

  return false;
};
