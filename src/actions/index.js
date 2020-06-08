import {UPDATE_GAME, RESET_GAME, AI_TOGGLE, ROLLBACK_HISTORY, START_GAME, SET_TOUCH_STATUS} from "./types";

// Game action creators
export const updateGame = (grid, deltaScore) => {
  return {
    type: UPDATE_GAME,
    payload: {grid, deltaScore}
  };
};

export const resetGame = () => {
  return {
    type: RESET_GAME
  };
}

export const rollbackHistory = () => {
  return {
    type: ROLLBACK_HISTORY
  };
}

export const toggleAI = () => {
  return {
    type: AI_TOGGLE
  };
}

export const startGame = () => {
  return {
    type: START_GAME
  }
}


// Device action creators
export const setTouchStatus = () => {
  return {
    type: SET_TOUCH_STATUS
  }
}