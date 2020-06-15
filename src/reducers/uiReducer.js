import {STORE_DESTINATIONS} from "../actions/types";
import {REDUX_INITIAL_STATE} from "../globalOptions";

const uiReducer = (state = REDUX_INITIAL_STATE.ui, action) => {
  switch (action.type) {
    case STORE_DESTINATIONS:
      return {...state, direction: action.payload.direction, destinations: action.payload.destinations};
    default:
      return {...state};
  }
};

export default uiReducer;