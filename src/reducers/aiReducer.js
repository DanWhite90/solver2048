import {UPDATE_AI_TREE, AI_TOGGLE} from "../actions/types";
import {REDUX_INITIAL_STATE} from "../globalOptions";

const aiReducer = (state = REDUX_INITIAL_STATE().ai, action) => {
  switch (action.type) {
    case AI_TOGGLE:
      return {...state, aiActive: !state.aiActive};
    case UPDATE_AI_TREE:
      return {...state, forecastLeaves: action.payload};
    default:
      return state;
  }
}

export default aiReducer;