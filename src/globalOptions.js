// All the values here are meant to be untouched, almost all of them would break the app if changed

// Game constants
export const GAME_TILE_DEFAULT_VALUE = 0;
export const GAME_GRID_SIZE_X = 4;
export const GAME_GRID_SIZE_Y = 4;

export const GRID_INITIAL_STATE = (n = GAME_GRID_SIZE_X, m = GAME_GRID_SIZE_Y) => {
  let grid = [];
  for (let i = 0; i < n; i++) {
    grid.push(new Array(m).fill(GAME_TILE_DEFAULT_VALUE));
  }
  return grid;
};

export const ENCODING_BITS = 5;

// Redux store constants
export const REDUX_INITIAL_STATE = {
  grid: GRID_INITIAL_STATE(),
  aiActive: false
};