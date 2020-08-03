import {
  GAME_GRID_SIZE_N, 
  GAME_GRID_SIZE_M, 
  scoringFunctions, 
  defaultScoringFunction, 
  ALPHA, 
  BETA,
  UP,
  LEFT,
  RIGHT,
  DOWN,
  DEFAULT_TREE_DEPTH,
  FORECAST_TREE_SIZE_THRESHOLD,
  PATH_PROB_THRESHOLD,
  SCORE_LINEAR,
} from "../../../globalOptions";
import {zeroCount, copyGrid, gridSum, processMove} from "./gameEngine";
import {encodeState, decodeState} from "./encoding";

const totalMonotonicityDivisor = (GAME_GRID_SIZE_N - 1) * GAME_GRID_SIZE_M + GAME_GRID_SIZE_N * (GAME_GRID_SIZE_M - 1);
const totalTiles = GAME_GRID_SIZE_N * GAME_GRID_SIZE_M;


export const monotonicityScore = (grid, scoreFunc = scoringFunctions.get(defaultScoringFunction)) => {
  // number of monotonicity satisfying couples of tiles when you need increasing and decreasing tiles horizontally and vertically respectively
  let incH = 0, decH = 0, incV = 0, decV = 0; 
  
  // optimize for when the grid is square otherwise split in 2 for loops
  if (GAME_GRID_SIZE_N === GAME_GRID_SIZE_M) {

    for (let i = 0; i < GAME_GRID_SIZE_N; i++) {
      for (let j = 1; j < GAME_GRID_SIZE_N; j++) {
        if (grid[i][j] >= grid[i][j - 1]) { incH++; }
        if (grid[i][j] <= grid[i][j - 1]) { decH++; }
        if (grid[j][i] >= grid[j - 1][i]) { incV++; }
        if (grid[j][i] <= grid[j - 1][i]) { decV++; }
      }
    }

  } else {

    for (let i = 0; i < GAME_GRID_SIZE_N; i++) {
      for (let j = 1; j < GAME_GRID_SIZE_M; j++) {
        if (grid[i][j] >= grid[i][j - 1]) { incH++; }
        if (grid[i][j] <= grid[i][j - 1]) { decH++; }
      }
    }
  
    for (let j = 0; j < GAME_GRID_SIZE_M; j++) {
      for (let i = 1; i < GAME_GRID_SIZE_N; i++) {
        if (grid[i][j] >= grid[i - 1][j]) { incV++; }
        if (grid[i][j] <= grid[i - 1][j]) { decV++; }
      }
    }

  }

  return scoreFunc((Math.max(incH, decH) + Math.max(incV, decV) - totalMonotonicityDivisor / 2) / totalMonotonicityDivisor * 2);
};

export const emptinessScore = (grid, scoreFunc = scoringFunctions.get(defaultScoringFunction)) => {
  let freeFraction = zeroCount(grid) / (totalTiles - 1); // -1 because at least 1 tile is non zero at all times, varies between [0, 1]

  return scoreFunc(freeFraction);
};

export const mergeabilityScore = (grid, scoreFunc = scoringFunctions.get(defaultScoringFunction)) => {
  let mergeable = 0;
  
  // optimize for when the grid is square otherwise split in 2 for loops
  if (GAME_GRID_SIZE_N === GAME_GRID_SIZE_M) {

    for (let i = 0; i < GAME_GRID_SIZE_N; i++) {
      for (let j = 1; j < GAME_GRID_SIZE_N; j++) {
        if (grid[i][j] === grid[i][j - 1]) { mergeable++; }
        if (grid[j][i] === grid[j - 1][i]) { mergeable++; }
      }
    }

  } else {

    for (let i = 0; i < GAME_GRID_SIZE_N; i++) {
      for (let j = 1; j < GAME_GRID_SIZE_M; j++) {
        if (grid[i][j] === grid[i][j - 1]) { mergeable++; }
      }
    }
  
    for (let j = 0; j < GAME_GRID_SIZE_M; j++) {
      for (let i = 1; i < GAME_GRID_SIZE_N; i++) {
        if (grid[i][j] === grid[i - 1][j]) { mergeable++; }
      }
    }

  }

  return scoreFunc(mergeable / totalMonotonicityDivisor);
};

// Cobb-Douglas utility
export const utility = grid => {
  const ms = monotonicityScore(grid, scoringFunctions.get(SCORE_LINEAR));
  const es = emptinessScore(grid, scoringFunctions.get(SCORE_LINEAR));
  const mgs = mergeabilityScore(grid, scoringFunctions.get(SCORE_LINEAR));

  const alpha = 0.28; // weight of emptiness
  const beta = 0.42; // weight of emptiness

  const degree = 4; // degree of homogeneity

  return es ** (degree * alpha) * ms ** (degree * beta) * mgs ** (degree * (1 - alpha - beta));
};

export const bayesBetaUpdate = (grid, moveCount) => (ALPHA + 2 * (moveCount + 1) - 0.5 * gridSum(grid)) / (ALPHA + BETA + moveCount + 1);


//
// Game tree manipulation functions
//

export const genLeaf = (grid, originatingMove = null, pathProb = 1, depth = 0) => ({
  grid: encodeState(grid),
  originatingMove,
  pathProb,
  depth,
});

// has to be recomputed for each new grid, because it returns only the leaves of the game tree for memory constraints
export const genLeaves = (root, moveCount, maxDepth = DEFAULT_TREE_DEPTH) => {
  let tempGrid;
  let curNode;

  let queue = [root];
  let prob = bayesBetaUpdate(decodeState(root.grid), moveCount);
  let curDepth = root.depth;

  // Breadth First nodes generation 
  while (queue.length) {
    curNode = queue.shift();

    // Stochastic pruning of very unlikely paths (paths where disproportionally too many 4s appear) - risky heuristic
    if (curNode.depth <= 2 || curNode.pathProb ** (1 / curNode.depth) >= PATH_PROB_THRESHOLD) {

      // process move for each direction
      for (let direction of [UP, LEFT, RIGHT, DOWN]) {
        let {newGrid: computedGrid, validMove} = processMove(direction, decodeState(curNode.grid));
    
        // if the move is valid generate 2 and 4 tile for each empty spot
        if (validMove) {
          for (let i = 0; i < GAME_GRID_SIZE_N; i++) {
            for (let j = 0; j < GAME_GRID_SIZE_M; j++) {
              if (computedGrid[i][j] === 0) {
                for (let value of [2, 4]) {
                  tempGrid = copyGrid(computedGrid);
                  tempGrid[i][j] = value;
    
                  let newNode = genLeaf(
                    tempGrid, 
                    curNode.originatingMove === null ? direction : curNode.originatingMove, 
                    curNode.pathProb * (value === 2 ? prob : 1 - prob), 
                    curNode.depth + 1,
                  );
  
                  // when a new node reaches a new depth, stop if the number of leaves has reached a certain threshold or depth reached a certain level
                  if (
                    curDepth !== newNode.depth && 
                    (queue.length > FORECAST_TREE_SIZE_THRESHOLD || newNode.depth > maxDepth)
                  ) {
                    queue.unshift(curNode);
                    return queue;
                  } else {
                    queue.push(newNode);
                  }
  
                  curDepth = newNode.depth;
                }
              }
            }
          }
        }
      }
    }
  }
  
  if (maxDepth > 0) {
    // if the queue gets emptied before returning it means that maxDepth step ahead had only game-over states so retries with less depth
    return genLeaves(root, moveCount, maxDepth - 1);
  } else {
    // game over
    return [];
  }
}

export const optimMove = (grid, moveCount) => {
  let leaves = genLeaves(genLeaf(grid), moveCount);

  if (!leaves.length || !leaves[0].depth) {
    return null;
  }

  let optMove = null;
  let utilities = new Map([UP, LEFT, RIGHT, DOWN].map(direction => [direction, {expectedUtility: 0, count: 0}]));

  for (let node of leaves) {
    utilities.get(node.originatingMove).expectedUtility += node.pathProb * utility(decodeState(node.grid));
    utilities.get(node.originatingMove).count++;
  }
  
  let maxUtil = -Infinity; 
  // const countWeight = 0.2;

  for (let [direction, value] of utilities.entries()) {
    value.expectedUtility /= value.count ? value.count / Math.log(1 + value.count) : 1;
    // value.expectedUtility *= value.count ? 1 + countWeight * Math.log(value.count) / Math.log(leaves.length) : 1;

    if (value.count && value.expectedUtility > maxUtil) {
      maxUtil = value.expectedUtility;
      optMove = direction;
    }
  }

  return optMove;
};