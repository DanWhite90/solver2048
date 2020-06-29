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
import {encodeTile} from "./encoding";

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
export const generateNode = (grid, nextSibling = null) => ({
  grid,
  nextMoveState: new Map([UP, LEFT, RIGHT, DOWN].map(direction => [direction, new Map()])),
  nextSibling // used for performance optimization
});

export const createTree = rootNode => ({
  root: rootNode,
  leaves: new Map([UP, LEFT, RIGHT, DOWN].map(direction => [direction, new Map()]))
});

export const growTree = (tree, maxDepth = DEFAULT_TREE_DEPTH) => {
  if (maxDepth > 0) {
    let tempGrid;
    let newNode;

    for (let direction of [UP, LEFT, RIGHT, DOWN]) {
      let computedGrid = processMove(direction, tree.root.grid).newGrid;
      let numBranches = tree.root.nextMoveState.get(direction).size;
      let prevSibling = null;

      for (let i = 0; i < GAME_GRID_SIZE_N; i++) {
        for (let j = 0; j < GAME_GRID_SIZE_M; j++) {
          if (computedGrid[i][j] === 0) {
            for (let value of [2, 4]) {
              if (numBranches === 0) {
                tempGrid = copyGrid(computedGrid);
                tempGrid[i][j] = value;

                newNode = generateNode(tempGrid);
                tree.root.nextMoveState.get(direction).set(encodeTile({i, j, value}), newNode);

                growTree(createTree(newNode), maxDepth - 1);

                prevSibling.nextSibling = newNode;
                prevSibling = newNode;
              } else {
                growTree(createTree(tree.root.nextMoveState.get(direction).get(encodeTile({i, j, value}))), maxDepth - 1);
              }
            }
          }
        }
      }
    }
  }
}

export const pruneTree = (tree, direction, newTile) => {
  tree.root = tree.root.nextMoveState.get(direction).get(encodeTile(newTile));
  tree.root.nextSibling = null;
  return tree;
};