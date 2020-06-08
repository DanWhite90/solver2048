import {SET_TOUCH_STATUS} from "../actions/types";
import {REDUX_INITIAL_STATE} from "../globalOptions";

const deviceReducer = (state = REDUX_INITIAL_STATE.device, action) => {
  switch (action.type) {

    case SET_TOUCH_STATUS:
      return {...state, isTouchDevice: true};

    default:
      return state;
  }
}

export default deviceReducer;