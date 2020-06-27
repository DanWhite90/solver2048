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
export const GRID_HISTORY_MAX_LENGTH = 20;

export const GRID_INITIAL_STATE = (n = GAME_GRID_SIZE_N, m = GAME_GRID_SIZE_M) => {
  let grid = [];
  for (let i = 0; i < n; i++) {
    grid.push(new Array(m).fill(GAME_TILE_DEFAULT_VALUE));
  }
  return grid;
};

export const GAME_INIT = 0;
export const GAME_STARTED = 1;
export const GAME_OVER = 2;


// UI Constants
export const ANIM_NONE = 0;
export const ANIM_SLIDE = 1;
export const ANIM_NEW_TILE = 2;
export const TOUCH_SLIDE_MIN_RADIUS = 50;

// Redux store constants
export const REDUX_INITIAL_STATE = () => ({
  game: {
    grid: GRID_INITIAL_STATE(),
    aiActive: false,
    score: 0,
    gridHistory: [],  // encoded with the encoding library for efficiency
    status: GAME_INIT,
    moveCount: 0,
    // breakdown of grid updates in animations
    newTile: {i: 0, j: 0, value: 0},
    computedGrid: GRID_INITIAL_STATE(), // resulting grid after stacking but before adding new tile
    computedScore: 0
  },
  device: {
    isTouchDevice: false
  },
  ui: {
    direction: LEFT,
    destinations: GRID_INITIAL_STATE(),
    animPhase: ANIM_NEW_TILE
  },
  ai: {
    gameTree: new Map()
  }
});

// AI Engine config
export const SCORE_LINEAR = "SCORE_LINEAR";
export const SCORE_POWER = "SCORE_POWER";
export const SCORE_NEG_EXP = "SCORE_NEG_EXP";
export const SCORE_POS_EXP = "SCORE_POS_EXP";
export const SCORE_HYPERBOLIC = "SCORE_HYPERBOLIC";
export const SCORE_SIGMOID = "SCORE_SIGMOID";

export const defaultScoringFunction = SCORE_LINEAR;

// scoring functions with following properties:
// - domain [0, 1]
// - monotonically increasing
// - f(0) = 0 (or close from above)
// - f(1) = 1 (or close from below)
export const scoringFunctions = new Map([
  [SCORE_LINEAR, x => x],
  [SCORE_POWER, x => x ** 0.3], // very sensitive (fast growth) close to 0 but slow after
  [SCORE_NEG_EXP, x => 1 - Math.exp(-5 * x)], // good utility function shape in [0, 1]
  [SCORE_POS_EXP, x => (2 ** (2 * x) - 1) / (2 ** 5)], // convex, values high scores more
  [SCORE_HYPERBOLIC, x => 2 * x / (x + 1)], // concave but not much
  [SCORE_SIGMOID, x => 1 / (1 + Math.exp(-8 * (x - 0.5)))] // significant variation only in [0.2, 0.8]
]);

// Bayesian estimation parameters
export const ALPHA = 1;
export const BETA = 1;
