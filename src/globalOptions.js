// All the values here are meant to be untouched, almost all of them would break the app if changed

// Game constants
export const GAME_TILE_DEFAULT_VALUE = 0;
export const GAME_GRID_SIZE_X = 4;
export const GAME_GRID_SIZE_Y = 4;
export const ENCODING_BITS = 5;
export const UP = "UP";
export const LEFT = "LEFT";
export const RIGHT = "RIGHT";
export const DOWN = "DOWN";

export const GRID_INITIAL_STATE = (n = GAME_GRID_SIZE_X, m = GAME_GRID_SIZE_Y) => {
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