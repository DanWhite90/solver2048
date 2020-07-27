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

// Cobb-Douglas utility with equal weights
export const utility = grid => {
  const ms = monotonicityScore(grid, scoringFunctions.get(SCORE_LINEAR));
  const es = emptinessScore(grid, scoringFunctions.get(SCORE_LINEAR));

  const alpha = 0.4; // weight of emptiness
  const scale = 4;

  return es ** (scale * alpha) * ms ** (scale * (1 - alpha));
};

export const bayesBetaUpdate = (grid, moveCount) => (ALPHA + 2 * (moveCount + 1) - 0.5 * gridSum(grid)) / (ALPHA + BETA + moveCount + 1);

///////////////////////////////////////////////////////////////////////////////
// Game tree manipulation functions

export const genNode = (grid, originatingMove = null, pathProb = 1, depth = 0) => ({
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
    
                  let newNode = genNode(
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
  let leaves = genLeaves(genNode(grid), moveCount);

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

    if (value.expectedUtility > maxUtil) {
      maxUtil = value.expectedUtility;
      optMove = direction;
    }
  }

  return optMove;
}


//////////////////////////////////////////////////////////////
// OLD CODE

// export const generateForecastNode = (grid, originatingPath = []) => ({
//   grid: encodeState(grid),
//   originatingPath
// });

// // has to be recomputed for each new grid, because it returns only the leaves of the game tree for memory constraints
// export const generateForecasts = (nodes, maxDepth = DEFAULT_TREE_DEPTH) => {
//   let tempGrid;
//   let curNode;

//   let queue = nodes.slice(0);
//   let curDepth = nodes[0].originatingPath.length;

//   while (queue.length) {
//     curNode = queue.shift();

//     for (let direction of [UP, LEFT, RIGHT, DOWN]) {
//       let {newGrid: computedGrid, validMove} = processMove(direction, decodeState(curNode.grid));
  
//       if (validMove) {
//         for (let i = 0; i < GAME_GRID_SIZE_N; i++) {
//           for (let j = 0; j < GAME_GRID_SIZE_M; j++) {
//             if (computedGrid[i][j] === 0) {
//               for (let value of [2, 4]) {
//                 tempGrid = copyGrid(computedGrid);
//                 tempGrid[i][j] = value;
  
//                 let newNode = generateForecastNode(tempGrid, [...curNode.originatingPath, {direction, tile: encodeTile({i, j, value})}]);

//                 // when a new node reaches a new depth, stop if the number of leaves has reached a certain threshold or depth reached a certain level
//                 if (curDepth !== newNode.originatingPath.length && (queue.length > FORECAST_TREE_SIZE_THRESHOLD || newNode.originatingPath.length > maxDepth)) {
//                   queue.unshift(curNode);
//                   return queue;
//                 } else {
//                   queue.push(newNode);
//                 }

//                 curDepth = newNode.originatingPath.length;
//               }
//             }
//           }
//         }
//       }
//     }
//   }

//   if (maxDepth > 0) {
//     // if the queue gets emptied before returning it means that maxDepth step ahead had only game-over states so retries with less depth
//     return generateForecasts(nodes, maxDepth - 1);
//   } else {
//     // game over
//     return [];
//   }
// }

// // prune the forecast leaves based on what move has ben made and what random tile appeared tile = {i: number, j: number, value: number}
// export const pruneForecasts = (nodes, direction, tile) => {
//   if (!nodes.length || !nodes[0].originatingPath.length) {
//     return [];
//   }

//   let newNodes = [];

//   for (let node of nodes) {
//     if (node.originatingPath[0].direction === direction && node.originatingPath[0].tile === encodeTile(tile)) {
//       node.originatingPath.shift();
//       newNodes.push(node);
//     }
//   }

//   return newNodes;
// }

// // This is supposed to be the public API for managing the forecast tree
// export const slideForecasts = (nodes, direction, tile, maxDepth = DEFAULT_TREE_DEPTH) => {
//   return generateForecasts(pruneForecasts(nodes, direction, tile), maxDepth);
// }

// export const optimalMove = (nodes, grid, moveCount) => {
//   if (!nodes.length || !nodes[0].originatingPath.length) {
//     return null;
//   }

//   let optMove = null;
//   let utilities = new Map([UP, LEFT, RIGHT, DOWN].map(direction => [direction, {expectedUtility: 0, count: 0}]));
//   let p_hat = bayesBetaUpdate(grid, moveCount);

//   for (let node of nodes) {
//     let {direction: dir, tile} = node.originatingPath[0];
//     tile = decodeTile(tile);

//     utilities.get(dir).expectedUtility += tile.value === 2 ? p_hat * utility(decodeState(node.grid)) : (1 - p_hat) * utility(decodeState(node.grid));
//     utilities.get(dir).count++;
//   }
  
//   let maxUtil = -Infinity; 
//   for (let [dir, value] of utilities.entries()) {
//     value.expectedUtility /= value.count ? value.count : 1;

//     if (value.expectedUtility > maxUtil) {
//       maxUtil = value.expectedUtility;
//       optMove = dir;
//     }
//   }

//   return optMove;
// }