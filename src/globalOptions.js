// All the values here are meant to be untouched, almost all of them would break the app if changed

// Game constants
export const GAME_TILE_DEFAULT_VALUE = 0;
export const GAME_GRID_SIZE_N = 4;
export const GAME_GRID_SIZE_M = 4;
export const ENCODING_BITS = 5;
export const UP = "UP";
export const LEFT = "LEFT";
export const RIGHT = "RIGHT";
export const DOWN = "DOWN";
export const directions = new Map([
  ["ArrowUp", UP],
  ["ArrowLeft", LEFT],
  ["ArrowRight", RIGHT],
  ["ArrowDown", DOWN],
  ["w", UP],
  ["a", LEFT],
  ["d", RIGHT],
  ["s", DOWN],
]);
export const TILE_2_PROBABILITY = 0.9;

export const GRID_INITIAL_STATE = (n = GAME_GRID_SIZE_N, m = GAME_GRID_SIZE_M) => {
  let grid = [];
  for (let i = 0; i < n; i++) {
    grid.push(new Array(m).fill(GAME_TILE_DEFAULT_VALUE));
  }
  return grid;
};


// Redux store constants
export const REDUX_INITIAL_STATE = {
  game: {
    grid: GRID_INITIAL_STATE(),
    aiActive: false,
    score: 0,
    gridHistory: [],
    gameStarted: false
  },
  device: {
    isTouchDevice: false
  }
};

export const GRID_HISTORY_MAX_LENGTH = 20;