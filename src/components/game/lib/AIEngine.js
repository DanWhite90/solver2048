import {
  GAME_GRID_SIZE_N, 
  GAME_GRID_SIZE_M, 
  scoringFunctions, 
  defaultScoringFunction, 
  SCORE_SIGMOID, 
  ALPHA, 
  BETA,
  UP,
  LEFT,
  RIGHT,
  DOWN,
  DEFAULT_TREE_DEPTH
} from "../../../globalOptions";
import {zeroCount, transpose, copyGrid, gridSum, processMove} from "./gameEngine";
import {encodeState, decodeState} from "./encoding";

const totalMonotonicityDivisor = (GAME_GRID_SIZE_N - 1) * GAME_GRID_SIZE_M + GAME_GRID_SIZE_N * (GAME_GRID_SIZE_M - 1);
const totalTiles = GAME_GRID_SIZE_N * GAME_GRID_SIZE_M;

// AI ENGINE

export const monotonicityScore = (grid, scoreFunc = scoringFunctions.get(defaultScoringFunction)) => {
  // number of monotonicity satisfying couples of tiles when you need increasing and decreasing tiles horizontally and vertically respectively
  let incH = 0, decH = 0, incV = 0, decV = 0; 
  let locGrid = copyGrid(grid);

  for (let row of locGrid) {
    for (let i = 1; i < GAME_GRID_SIZE_M; i++) {
      if (row[i] >= row[i - 1]) { incH++; }
      if (row[i] <= row[i - 1]) { decH++; }
    }
  }

  locGrid = transpose(locGrid);

  for (let col of locGrid) {
    for (let i = 1; i < GAME_GRID_SIZE_N; i++) {
      if (col[i] >= col[i - 1]) { incV++; }
      if (col[i] <= col[i - 1]) { decV++; }
    }
  }

  return scoreFunc((Math.max(incH, decH) + Math.max(incV, decV) - totalMonotonicityDivisor / 2) / totalMonotonicityDivisor * 2);
}

export const emptinessScore = (grid, scoreFunc = scoringFunctions.get(defaultScoringFunction)) => {
  let freeFraction = zeroCount(grid) / (totalTiles - 1); // -1 because at least 1 tile is non zero at all times, varies between [0, 1]

  return scoreFunc(freeFraction);
}

// Cobb-Douglas utility with equal weights
export const utility = grid => monotonicityScore(grid, scoringFunctions.get(SCORE_SIGMOID)) ** 0.5 * emptinessScore(grid, scoringFunctions.get(SCORE_SIGMOID) ** 0.5);

export const bayesBetaUpdate = (grid, moveCount) => (ALPHA + 2 * (moveCount + 1) - 0.5 * gridSum(grid)) / (ALPHA + BETA + moveCount + 1);

///////////////////////////////////////////////////////////////////////////////
// Game tree manipulation functions
// Not using classes in order to preserve Redux single source of truth (class methods can modify state without reducers)
export const generateForecastNode = (grid, originatingPath = []) => ({
  grid: encodeState(grid),
  originatingPath
});

export const generateForecasts = (nodes, maxDepth = DEFAULT_TREE_DEPTH) => {
  let tempGrid;
  let curNode;

  let queue = nodes;

  while (queue.length) {
    curNode = queue.shift();

    for (let direction of [UP, LEFT, RIGHT, DOWN]) {
      let {newGrid: computedGrid, validMove} = processMove(direction, decodeState(curNode.grid));
  
      if (validMove) {
        for (let i = 0; i < GAME_GRID_SIZE_N; i++) {
          for (let j = 0; j < GAME_GRID_SIZE_M; j++) {
            if (computedGrid[i][j] === 0) {
              for (let value of [2, 4]) {
                tempGrid = copyGrid(computedGrid);
                tempGrid[i][j] = value;
  
                let newNode = generateForecastNode(tempGrid, [...curNode.originatingPath, direction]);
  
                if (newNode.originatingPath.length <= maxDepth) {
                  queue.push(newNode);
                } else {
                  queue.unshift(curNode);
                  return queue;
                }
              }
            }
          }
        }
      }
    }
  }
}