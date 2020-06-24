import {TILE_2_PROBABILITY, GAME_GRID_SIZE_N, GAME_GRID_SIZE_M} from "../../../globalOptions";
import {zeroCount, transpose, copyGrid} from "./gameEngine";

const totalMonotonicityDivisor = (GAME_GRID_SIZE_N - 1) * GAME_GRID_SIZE_M + GAME_GRID_SIZE_N * (GAME_GRID_SIZE_M - 1);
const totalTiles = GAME_GRID_SIZE_N * GAME_GRID_SIZE_M;

// provides a monotonicity score in the interval [0, 1]
export const monotonicityScore = grid => {
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

  return (Math.max(incH, decH) + Math.max(incV, decV) - totalMonotonicityDivisor / 2) / totalMonotonicityDivisor * 2;
}

export const emptinessScore = grid => {
  let free = zeroCount(grid);
}

export const computeOptimalMove = grid => {

}