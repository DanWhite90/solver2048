import {UPDATE_GRID, AI_TOGGLE} from "../actions/types";
import {REDUX_INITIAL_STATE} from "../globalOptions";

const gameReducer = (state = REDUX_INITIAL_STATE, action) => {
  switch (action.type) {
    case UPDATE_GRID:
      return {...state, grid: action.payload};
    case AI_TOGGLE:
      return {...state, aiActive: !state.aiActive};
    default:
      return state;
  }
}

export default gameReducer;