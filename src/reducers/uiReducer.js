import {STORE_DESTINATIONS, SET_ANIMATION_PHASE} from "../actions/types";
import {REDUX_INITIAL_STATE} from "../globalOptions";

const uiReducer = (state = REDUX_INITIAL_STATE().ui, action) => {
  switch (action.type) {
    case STORE_DESTINATIONS:
      return {...state, direction: action.payload.direction, destinations: action.payload.destinations};
    case SET_ANIMATION_PHASE:
      return {...state, animPhase: action.payload};
    default:
      return {...state};
  }
};

export default uiReducer;