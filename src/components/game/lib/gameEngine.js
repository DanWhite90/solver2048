import {GRID_INITIAL_STATE, UP, LEFT, RIGHT, DOWN, TILE_2_PROBABILITY} from "../../../globalOptions";


// HELPER FUNCTIONS

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

// check validity by summing up the destinations - if non-zero a movement has been made
export const isNonEmpty = destinations => !!destinations.map(row => row.reduce((a, b) => a + b)).reduce((a, b) => a + b);

export const isGameOver = grid => {
  // process grid to return true
  if (!zeroCount(grid)) {
    return ![UP, LEFT, RIGHT, DOWN]
      .map(direction => processMove(direction, grid).deltaScore)
      .reduce((totSum, score) => totSum + score);
  }

  return false;
};
