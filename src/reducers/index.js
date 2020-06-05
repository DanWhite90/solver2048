import {combineReducers} from "redux";

import gridReducer from "./gridReducer";
import aiReducer from "./aiReducer";

export default combineReducers({
  grid: gridReducer,
  aiActive: aiReducer
});