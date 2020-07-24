import {
  UPDATE_GAME, 
  RESET_GAME, 
  AI_TOGGLE, 
  ROLLBACK_HISTORY, 
  SET_GAME_STATUS, 
  SET_TOUCH_STATUS, 
  STORE_DESTINATIONS, 
  INCREASE_MOVE_COUNT, 
  STORE_PARTIAL_MOVE, 
  SET_ANIMATION_PHASE,
  UPDATE_AI_TREE
} from "./types";

// Game action creators
export const updateGame = (grid, deltaScore, newTile, updateHistory = false) => {
  return {
    type: UPDATE_GAME,
    payload: {grid, deltaScore, newTile},
    updateHistory: updateHistory
  };
};

export const increaseMoveCount = () => {
  return {
    type: INCREASE_MOVE_COUNT
  }
}

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

export const setGameStatus = status => {
  return {
    type: SET_GAME_STATUS,
    payload: status
  }
}

export const storePartialMove = (computedGrid, computedScore) => {
  return {
    type: STORE_PARTIAL_MOVE,
    payload: {computedGrid, computedScore}
  }
}


// Device action creators
export const setTouchStatus = () => {
  return {
    type: SET_TOUCH_STATUS
  }
}

// UI action creators
export const storeDestinations = (direction, destinations) => {
  return {
    type: STORE_DESTINATIONS,
    payload: {direction, destinations}
  };
}

export const setAnimationPhase = phase => {
  return {
    type: SET_ANIMATION_PHASE,
    payload: phase
  };
}

// AI action creators
export const updateTreeStatus = leaves => {
  return {
    type: UPDATE_AI_TREE,
    payload: leaves
  };
}