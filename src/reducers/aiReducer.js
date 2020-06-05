import {AI_TOGGLE} from "../actions/types";
import {REDUX_INITIAL_STATE} from "../globalOptions";

const aiReducer = (state = REDUX_INITIAL_STATE, action) => {
  switch (action.type) {
    case AI_TOGGLE:
      return {...state, aiActive: !state.aiActive};
    default:
      return state;
  }
}

export default aiReducer;