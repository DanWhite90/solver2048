import gridReducer from "../gridReducer";
import aiReducer from "../aiReducer";
import {REDUX_INITIAL_STATE} from "../../globalOptions";
import {UPDATE_GRID, AI_TOGGLE} from "../../actions/types";

describe("gridReducer", () => {

  it("updates the state properly", () => {
    let action = {
      type: UPDATE_GRID,
      payload: [[1,3,6,7],[4,8,0,1],[12,3,4,5],[78,6,5,4]]
    }

    let result = {...REDUX_INITIAL_STATE, grid: action.payload};

    expect(JSON.stringify(gridReducer(REDUX_INITIAL_STATE, action))).toEqual(JSON.stringify(result));
  });

});

describe("aiReducer", () => {

  it("updates the state properly", () => {
    let action = {
      type: AI_TOGGLE
    }

    let result = {...REDUX_INITIAL_STATE, aiActive: !REDUX_INITIAL_STATE.aiActive};

    expect(JSON.stringify(aiReducer(REDUX_INITIAL_STATE, action))).toEqual(JSON.stringify(result));
  });

});