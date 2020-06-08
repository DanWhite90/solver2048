import {combineReducers} from "redux";

import gameReducer from "./gameReducer";
import deviceReducer from "./deviceReducer";

export default combineReducers({
  game: gameReducer,
  device: deviceReducer
});