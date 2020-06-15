import {combineReducers} from "redux";

import gameReducer from "./gameReducer";
import deviceReducer from "./deviceReducer";
import uiReducer from "./uiReducer";

export default combineReducers({
  game: gameReducer,
  device: deviceReducer,
  ui: uiReducer
});