import {UPDATE_GAME, RESET_GAME, AI_TOGGLE, ROLLBACK_HISTORY} from "./types";

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