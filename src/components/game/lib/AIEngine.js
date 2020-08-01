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

// AI ENGINE

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
}

export const emptinessScore = (grid, scoreFunc = scoringFunctions.get(defaultScoringFunction)) => {
  let freeFraction = zeroCount(grid) / (totalTiles - 1); // -1 because at least 1 tile is non zero at all times, varies between [0, 1]

  return scoreFunc(freeFraction);
}

// Cobb-Douglas utility
export const utility = grid => {
  const ms = monotonicityScore(grid, scoringFunctions.get(SCORE_LINEAR));
  const es = emptinessScore(grid, scoringFunctions.get(SCORE_LINEAR));

  const alpha = 0.4; // weight of emptiness
  const degree = 4; // degree of homogeneity

  return es ** (degree * alpha) * ms ** (degree * (1 - alpha));
};

export const bayesBetaUpdate = (grid, moveCount) => (ALPHA + 2 * (moveCount + 1) - 0.5 * gridSum(grid)) / (ALPHA + BETA + moveCount + 1);

///////////////////////////////////////////////////////////////////////////////
// Game tree manipulation functions

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
                    (queue.length > FORECAST_TREE_SIZE_THRESHOLD || newNode.depth >= maxDepth)
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
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// NEW ENGINE
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// the length of path (and nthChild) is also the depth in the tree
export const genNode = (grid, path = [], nthChild = [], tilePathProb = [1]) => ({
  grid: encodeState(grid),
  path,
  nthChild,
  tilePathProb,
});

// finds the grid in the first level of the tree and prunes all the nodes that are not descendants
// if no grid is found it returns just returns the node of the grid as the new root to build upon
export const pruneTreeList = (grid, treeList = []) => {
  let newTreeList = [genNode(grid)];
  let firstLeaf = 0;

  if (!treeList.length) {
    return [newTreeList, firstLeaf];
  }

  let encGrid = encodeState(grid);
  let maxDepth = treeList[treeList.length - 1].path.length;
  let node, direction, nthChild, found;

  // find direction and child that generated the grid within the tree otherwise return new root
  while (treeList.length) {
    node = treeList.shift();

    if (node.path.length === 1) {
      // only keep the first occurrence (states can be duplicates among siblings if generated by different moves, only paths are unique)
      if (found) { continue; }

      found = true;
      for (let i = 0; i < encGrid.length; i++) {
        found = found && (encGrid[i] === node.grid[i]);
      }

      if (found) {
        direction = node.path[0];
        nthChild = node.nthChild[0];
      }
    // nodes in the list are in increasing order of path length so we can return when the length > 1 and no match is found
    } else if (node.path.length > 1) {
      if (!found) {
        break;
      } else {
        // prune the branches
        if (node.path[0] === direction && node.nthChild[0] === nthChild) {
          node.path.shift();
          node.nthChild.shift();
          node.tilePathProb.shift();
          node.tilePathProb[0] = 1;

          newTreeList.push(node);

          if (node.path.length < maxDepth) {
            firstLeaf++;
          }
        }
      }
    }
  }

  return [newTreeList, firstLeaf];
};

// each node is added in the list breadth-first
export const genTreeList = (grid, moveCount, prevTreeList = [], maxDepth = DEFAULT_TREE_DEPTH) => {
  let tempGrid;
  let curNode;

  let treeList = pruneTreeList(grid, prevTreeList);
  let prob = bayesBetaUpdate(grid, moveCount);
  let curDepth = 0;

  // Breadth First nodes generation 
  let i = 0;
  while (i < treeList.length) {
    curNode = treeList[i];

    // Stochastic pruning of very unlikely paths (paths where disproportionally too many 4s appear) - risky heuristic
    if (curNode.path.length <= 2 || curNode.tilePathProb ** (1 / curNode.path.length) >= PATH_PROB_THRESHOLD) {

      // process move for each direction
      for (let direction of [UP, LEFT, RIGHT, DOWN]) {
        let {newGrid: computedGrid, validMove} = processMove(direction, decodeState(curNode.grid));
    
        // if the move is valid generate 2 and 4 tile for each empty spot
        if (validMove) {
          let nthChild = 0;

          for (let i = 0; i < GAME_GRID_SIZE_N; i++) {
            for (let j = 0; j < GAME_GRID_SIZE_M; j++) {
              if (computedGrid[i][j] === 0) {
                for (let value of [2, 4]) {
                  tempGrid = copyGrid(computedGrid);
                  tempGrid[i][j] = value;
    
                  let newNode = genNode(
                    tempGrid, 
                    [...curNode.path, direction],
                    [...curNode.nthChild, nthChild],
                    curNode.tilePathProb * (value === 2 ? prob : 1 - prob),
                  );
  
                  // when a new node reaches a new depth, stop if the number of leaves has reached a certain threshold or depth reached a certain level
                  if (
                    curDepth !== newNode.path.length && 
                    (treeList.length > FORECAST_TREE_SIZE_THRESHOLD || newNode.path.length >= maxDepth)
                  ) {
                    return treeList;
                  } else {
                    treeList.push(newNode);
                  }
  
                  curDepth = newNode.path.depth;
                  nthChild++;
                }
              }
            }
          }
        }
      }
    }

    i++;
  }

  return treeList;
};

export const optimalMove = (grid, moveCount) => {
  
};