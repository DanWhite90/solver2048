import {UPDATE_GRID} from "../actions/types";
import {REDUX_INITIAL_STATE} from "../globalOptions";

const gridReducer = (state = REDUX_INITIAL_STATE, action) => {
  switch (action.type) {
    case UPDATE_GRID:
      return {...state, grid: action.payload};
    default:
      return state;
  }
}

export default gridReducer;