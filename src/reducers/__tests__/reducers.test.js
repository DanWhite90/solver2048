import gameReducer from "../gameReducer";
import {REDUX_INITIAL_STATE} from "../../globalOptions";
import {UPDATE_GAME, AI_TOGGLE, RESET_GAME} from "../../actions/types";

describe("gameReducer", () => {

  it("updates the game properly", () => {
    let action = {
      type: UPDATE_GAME,
      payload: {
        grid: [[1,3,6,7],[4,8,0,1],[12,3,4,5],[78,6,5,4]],
        deltaScore: 16
      }
    }

    let result = {
      ...REDUX_INITIAL_STATE, 
      grid: [[1,3,6,7],[4,8,0,1],[12,3,4,5],[78,6,5,4]],
      score: REDUX_INITIAL_STATE.game.score + 16
    };

    expect(JSON.stringify(gameReducer(REDUX_INITIAL_STATE, action))).toEqual(JSON.stringify(result));
  });

  it("resets the game properly", () => {
    let action = {
      type: RESET_GAME
    }

    let result = {
      ...REDUX_INITIAL_STATE.game
    };

    expect(JSON.stringify(gameReducer(REDUX_INITIAL_STATE, action))).toEqual(JSON.stringify(result));
  });

  it("updates AI status properly", () => {
    let action = {
      type: AI_TOGGLE
    }

    let result = {...REDUX_INITIAL_STATE, aiActive: !REDUX_INITIAL_STATE.aiActive};

    expect(JSON.stringify(gameReducer(REDUX_INITIAL_STATE, action))).toEqual(JSON.stringify(result));
  });

});