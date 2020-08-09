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
  DISCOUNT_FACTOR,
  MIN_DEPTH,
  MIN_SEARCH_TIME,
  VICTORY_THRESHOLD,
} from "../../../globalOptions";
import {zeroCount, copyGrid, gridSum, processMove} from "./gameEngine";
import {encodeState, decodeState} from "./encoding";

const TOT_MONOTONICITY_DIVISOR = (GAME_GRID_SIZE_N - 1) * GAME_GRID_SIZE_M + GAME_GRID_SIZE_N * (GAME_GRID_SIZE_M - 1);
const TOTAL_TILES = GAME_GRID_SIZE_N * GAME_GRID_SIZE_M;
const LOG2_VICTORY_THRESHOLD = Math.log2(VICTORY_THRESHOLD);

////////////////////////////////////////////////////////////////////////////////////
// OLD CODE, START FROM heuristics()
////////////////////////////////////////////////////////////////////////////////////

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

  return scoreFunc((Math.max(incH, decH) + Math.max(incV, decV) - TOT_MONOTONICITY_DIVISOR / 2) / TOT_MONOTONICITY_DIVISOR * 2);
};

export const emptinessScore = (grid, scoreFunc = scoringFunctions.get(defaultScoringFunction)) => {
  let freeFraction = zeroCount(grid) / (TOTAL_TILES - 1); // -1 because at least 1 tile is non zero at all times, varies between [0, 1]

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

  return scoreFunc(mergeable / TOT_MONOTONICITY_DIVISOR);
};

export const highestTileScore = (grid, scoreFunc = scoringFunctions.get(defaultScoringFunction)) => {
  let maxTile = 0;

  for (let row of grid) {
    for (let tile of row) {
      if (tile > maxTile) {
        maxTile = tile;
      }
    }
  }

  return scoreFunc(Math.log2(maxTile) / Math.log2(VICTORY_THRESHOLD));
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// this is the new heuristics to make the calculation more efficient
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export const heuristics = grid => {
  // number of monotonicity satisfying couples of tiles when you need increasing and decreasing tiles horizontally and vertically respectively
  let incH = 0, decH = 0, incV = 0, decV = 0; 
  let sequenceCompleteness = new Array(LOG2_VICTORY_THRESHOLD).fill(0);
  let logEntry = 0;
  let empty = 0;
  let maxTile = 0;

  // grid fixed to square here
  for (let i = 0; i < GAME_GRID_SIZE_N; i++) {
    for (let j = 0; j < GAME_GRID_SIZE_N; j++) {
      if (j > 0) {
        // monotonicity
        if (grid[i][j] >= grid[i][j - 1]) { incH++; }
        if (grid[i][j] <= grid[i][j - 1]) { decH++; }
        if (grid[j][i] >= grid[j - 1][i]) { incV++; }
        if (grid[j][i] <= grid[j - 1][i]) { decV++; }
      }
      // mergeability
      if (grid[i][j]) {
        logEntry = parseInt(Math.log2(grid[i][j]));
        sequenceCompleteness[logEntry - 1] = logEntry;
      }
      // emptiness
      if (grid[i][j] === 0) { empty++; }
      // highestTile
      if (grid[i][j] > maxTile) { maxTile = grid[i][j]; }
    }
  }

  let logMax = Math.log2(maxTile);
  let clutterPenalty = logMax > 1 ? sequenceCompleteness.slice(0, logMax - 1).reduce((a, b) => a + b) / (logMax * (logMax - 1) / 2) : 0;

  return {
    monotonicity: (Math.max(incH, decH) + Math.max(incV, decV) - TOT_MONOTONICITY_DIVISOR / 2) / TOT_MONOTONICITY_DIVISOR * 2,
    emptiness: empty / (TOTAL_TILES - 1),
    mergeability: 1 - clutterPenalty * 0.8,
    highestTile: logMax / Math.log2(VICTORY_THRESHOLD),
  };
};

export const utility = (grid, moveCount = 0, deltaScore = 0) => {
  const heuristicScores = heuristics(grid);

  const ms = heuristicScores.monotonicity
  const es = heuristicScores.emptiness
  const mgs = heuristicScores.mergeability;
  const hts = heuristicScores.highestTile;

  const alpha = 0.2; // weight of emptiness
  const beta = 0.4; // weight of monotonicity
  const gamma = 0.15; // weight of mergeability

  const degree = 8; // degree of homogeneity - should be no less than the reciprocal of the lowest weight, but not too large

  // Cobb-Douglas "utility"
  if (hts < 1) {
    return es ** (degree * alpha) * ms ** (degree * beta) * mgs ** (degree * gamma) * hts ** (degree * (1 - alpha - beta - gamma));
  } else {
    // if one of the grids contains the winning tile (hts === 1) assign maximum utility
    return 1;
  }

  // Linear utility - BAD
  // return es * alpha + ms * beta + mgs * gamma + hts * (1 - alpha - beta - gamma);
};

export const bayesBetaUpdate = (grid, moveCount) => (ALPHA + 2 * (moveCount + 1) - 0.5 * gridSum(grid)) / (ALPHA + BETA + moveCount + 1);


//
// Game tree manipulation functions
//

export const genLeaf = (grid, originatingMove = null, pathProb = 1, depth = 0, deltaScore = 0) => ({
  grid: encodeState(grid),
  deltaScore,
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
        let {newGrid: computedGrid, deltaScore, validMove} = processMove(direction, decodeState(curNode.grid));
    
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
                    deltaScore,
                  );
  
                  // when a new node reaches a new depth, stop if the number of leaves has reached a certain threshold or depth reached a certain level
                  if (curDepth !== newNode.depth && (queue.length > FORECAST_TREE_SIZE_THRESHOLD || newNode.depth > maxDepth)) {
                    queue.unshift(curNode);
                    return queue;
                  }

                  queue.push(newNode);
  
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
    // if the queue gets emptied before returning it means that at maxDepth there are only terminating states so retries with less depth
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
    utilities.get(node.originatingMove).expectedUtility += node.pathProb * utility(decodeState(node.grid), moveCount, node.deltaScore);
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

///////////////////////////////////////////////////////////////////////////
// NEW ENGINE (HAS SOME BUGS, NOT COMPLETE)
///////////////////////////////////////////////////////////////////////////

// 1) calculate the expectation of each move in the game tree to reduce it to a deterministic game tree
// where each branch is given only by the move made

// 2) encode the expectation tree in a single array where the index of a child is:
// c(p, d) = 4*p + d + 1
// where:
// - c: is the index of the child
// - p: is the index of the parent
// - d: is the direction as UP = 0, LEFT = 1, RIGHT = 2, DOWN = 3
// the tree is a full complete quadtree, non admissible moves have 0 value by default

// 3) find the first move of the maximizing path through iterative backward induction, recursion is too inefficient in javascript :(
// p(c, d) = (c - d - 1) / 4

///////////////////////////////////////////////////////////////////////////

// node of the game tree, not the expected tree
export const genNode = (grid, path = []) => ({
  grid: encodeState(grid),
  path,
});

export const getExpectedChildIndex = (parent, direction) => 4 * parent + direction + 1;

export const getExpectedParentIndex = child => parseInt((child - 1) / 4);

export const getMove = child => (child - 1) % 4;

export const getExpectedNodeIndex = (path, root = 0) => {
  let index = root;

  for (let direction of path) {
    index = getExpectedChildIndex(index, direction);
  }

  return index;
};

export const getExpectedTreeDepth = treeLength => parseInt(Math.log2(3 * treeLength + 1) / 2 - 1);

export const getIndexOfFirstLeaf = treeLength => parseInt((4 ** getExpectedTreeDepth(treeLength) - 1) / 3);

export const genExpectedTree = (root, moveCount) => {
  let tempGrid;
  let curNode;

  let queue = [root];
  let prob = bayesBetaUpdate(decodeState(root.grid), moveCount);
  let curDepth = root.path.length; // should be 0

  let expectedTree = [0]; // the value of the root is irrelevant default 0, all invalid moves and pruned paths have 0 value

  // iterative breadth-first nodes generation 
  let canContinue = true;
  let startTime = Date.now();
  while (canContinue && queue.length) {
    curNode = queue.shift();

    // process move for each direction
    for (let direction of [UP, LEFT, RIGHT, DOWN]) {
      if (!canContinue) {break;}

      let {newGrid: computedGrid, deltaScore, validMove} = processMove(direction, decodeState(curNode.grid));
      
      // expectation common parameters
      let n = zeroCount(computedGrid); // number of free slots for uniform distribution of position of new tile
      let logDS = Math.log2(1 + Math.log2(2 + deltaScore));
      let tileProb = 0;

      let curExpectedIndex = getExpectedNodeIndex([...curNode.path, direction]);
      
      // expand expectation tree when new depth is acheived
      if (curExpectedIndex >= expectedTree.length) {
        expectedTree.push(...new Array(4 ** (curDepth + 1)).fill(0));
      }
      
      if (validMove) {

        // cumulate utility along path
        expectedTree[curExpectedIndex] = expectedTree[getExpectedParentIndex(curExpectedIndex)];

        // Expectation step: generate 2 and 4 tile for each empty slot after processing the move to compute the expectation
        for (let i = 0; i < GAME_GRID_SIZE_N && canContinue; i++) {
          for (let j = 0; j < GAME_GRID_SIZE_M && canContinue; j++) {
            if (computedGrid[i][j] === 0) {
              for (let value of [2, 4]) {

                // as soon as the exit condition is met the first time a new depth is reached, nothing is enqueued or added to expectation anymore
                if (canContinue) {
                  tempGrid = copyGrid(computedGrid);
                  tempGrid[i][j] = value;
                  tileProb = value === 2 ? prob : 1 - prob;
    
                  let newNode = genNode(
                    tempGrid, 
                    [...curNode.path, direction], 
                    // curNode.pathProb * tileProb
                  );

                  // deepening and exit conditions
                  if (curDepth !== newNode.path.length) {
                    curDepth = newNode.path.length;
                    if (curDepth >= MIN_DEPTH && Date.now() - startTime > MIN_SEARCH_TIME) {
                      canContinue = false;
                      break;
                    }
                  }

                  // compute expected utility
                  expectedTree[curExpectedIndex] += DISCOUNT_FACTOR ** curDepth * utility(tempGrid) * tileProb / n * logDS;

                  queue.push(newNode);
                }
              }
            }
          }
        }

      } else {
        // if a move is impossible it should be discarded
        expectedTree[curExpectedIndex] = -Infinity;
      }
    }
  }

  return expectedTree.slice(0, getIndexOfFirstLeaf(expectedTree.length)); // cut the last layer that won't be filled
}

export const optimMove2 = (grid, moveCount) => {
  let expectedTree = genExpectedTree(genNode(grid), moveCount);

  if (expectedTree.length <= 1) {
    return null;
  }

  let maxIndex = getIndexOfFirstLeaf(expectedTree.length);

  for (let index = maxIndex; index < expectedTree.length; index++) {
    if (expectedTree[index] > expectedTree[maxIndex]) {
      maxIndex = index;
    }
  }

  while (maxIndex > 4) {
    maxIndex = getExpectedParentIndex(maxIndex);
  }

  return getMove(maxIndex);
};

// modify this as public API
export const optimalMove = (grid, moveCount) => {
  return optimMove(grid, moveCount);
  // return optimMove2(grid, moveCount);
};