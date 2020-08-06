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
  DISCOUNT_FACTOR
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

// node of the game tree, not the expected tree
export const genNode = (grid, path = [], pathProb = 1) => ({
  grid: encodeState(grid),
  path,
  pathProb,
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

export const genExpectedTree = (root, moveCount, maxDepth = DEFAULT_TREE_DEPTH) => {
  let tempGrid;
  let curNode;

  let queue = [root];
  let prob = bayesBetaUpdate(decodeState(root.grid), moveCount);
  let curDepth = root.path.length;

  let expectedTree = [0]; // the value of the root is irrelevant default 0, all invalid moves and pruned paths have 0 value

  // iterative breadth-first nodes generation 
  let canContinue = true;
  while (canContinue && queue.length) {
    curNode = queue.shift();

    // process move for each direction
    for (let direction of [UP, LEFT, RIGHT, DOWN]) {
      let {newGrid: computedGrid, deltaScore, validMove} = processMove(direction, decodeState(curNode.grid));
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

        // generate 2 and 4 tile for each empty slot after processing the move to compute the expectation
        for (let i = 0; i < GAME_GRID_SIZE_N; i++) {
          for (let j = 0; j < GAME_GRID_SIZE_M; j++) {
            if (computedGrid[i][j] === 0) {
              for (let value of [2, 4]) {
                tempGrid = copyGrid(computedGrid);
                tempGrid[i][j] = value;
                tileProb = value === 2 ? prob : 1 - prob;
  
                let newNode = genNode(
                  tempGrid, 
                  [...curNode.path, direction], 
                  curNode.pathProb * tileProb
                );

                // deepening and exit conditions
                if (curDepth !== newNode.path.length) {
                  curDepth = newNode.path.length;
                  if (queue.length > FORECAST_TREE_SIZE_THRESHOLD || curDepth >= maxDepth) {
                    canContinue = false;
                  }
                }

                // compute expected utility
                expectedTree[curExpectedIndex] += DISCOUNT_FACTOR ** curDepth * utility(tempGrid) * tileProb / n * logDS;

                if (canContinue) {
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

  return expectedTree.slice(0, getIndexOfFirstLeaf(expectedTree.length));
  // return expectedTree;
}

export const optimalMove = (grid, moveCount) => {
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