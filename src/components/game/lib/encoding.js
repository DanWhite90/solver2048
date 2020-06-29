import {GRID_INITIAL_STATE, ENCODING_BITS, GAME_GRID_SIZE_N, GAME_GRID_SIZE_M} from "../../../globalOptions";

// These methods allow to compress the state of the game for memory efficiency, primarily to keep a history of the moves performed.

export function encodeState(grid) {
  // encode exponents of tiles for 2**80 possible states achievable with 5 a minimum of bits
  // so 12 bytes in an unsigned 32 bits integer array on length 3
  let encoded = new Uint32Array(new ArrayBuffer(12));
  let count = 0;
  let k = 0;

  for (let row of grid) {
    for (let tile of row) {
      if (tile !== 0) {
        encoded[k] += Math.log2(tile) * 2**(ENCODING_BITS*count);
      }
      count++;
      if (count >= Math.floor(32 / ENCODING_BITS)) {
        k++;
        count = 0;
      }
    }
  }

  return encoded;
}

export function decodeState(encoded) {
  let enc = encoded.slice(0);
  let grid = GRID_INITIAL_STATE();
  let count = 0;
  let k = 0;
  let tile = 0;

  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      tile = 2**(enc[k] % 2**ENCODING_BITS);
      enc[k] = enc[k] >> ENCODING_BITS;
      if (tile > 1) {
        grid[i][j] = tile;
      }
      count++;
      if (count >= Math.floor(32 / ENCODING_BITS)) {
        k++;
        count = 0;
      }
    }
  }

  return grid;
}

export const encodeTile = tile => tile.i * GAME_GRID_SIZE_M + tile.j + (tile.value === 4 ? GAME_GRID_SIZE_N * GAME_GRID_SIZE_M : 0);

export const decodeTile = num => {
  let i, j, value;

  if (num >= GAME_GRID_SIZE_N * GAME_GRID_SIZE_M) {
    value = 4;
    num -= GAME_GRID_SIZE_N * GAME_GRID_SIZE_M;
  } else {
    value = 2;
  }
  
  i = Math.floor(num / GAME_GRID_SIZE_M);
  j = num - i * GAME_GRID_SIZE_M;

  return {i, j, value};
};

export const encodeRow = row => {
  let num = 0;
  let count = 0;

  for (let tile of row) {
    if (tile !== 0) {
      num += Math.log2(tile) * 2**(ENCODING_BITS*count);
    }
    count++;
  }

  return num;
};

export const decodeRow = num => {
  let row = [0,0,0,0];
  let tile = 0;

  for (let i = 0; i < row.length; i++) {
    tile = 2**(num % 2**ENCODING_BITS);
    num = num >> ENCODING_BITS;
    if (tile > 1) {
      row[i] = tile;
    }
  }

  return row;
};