import {STORE_DESTINATIONS, SET_ANIMATION_PHASE, RESET_GAME} from "../actions/types";
import {REDUX_INITIAL_STATE} from "../globalOptions";

const uiReducer = (state = REDUX_INITIAL_STATE().ui, action) => {
  switch (action.type) {
    case STORE_DESTINATIONS:
      return {...state, direction: action.payload.direction, destinations: action.payload.destinations};
    case SET_ANIMATION_PHASE:
      return {...state, animPhase: action.payload};
    case RESET_GAME:
      return {...REDUX_INITIAL_STATE().ui}
    default:
      return {...state};
  }
};

export default uiReducer;