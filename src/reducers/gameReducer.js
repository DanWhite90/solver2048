import {UPDATE_GAME, AI_TOGGLE, RESET_GAME, ROLLBACK_HISTORY, START_GAME} from "../actions/types";
import {REDUX_INITIAL_STATE, GRID_HISTORY_MAX_LENGTH, GAME_STARTED} from "../globalOptions";
import {encodeState, decodeState} from "../components/game/lib/encoding";

const gameReducer = (state = REDUX_INITIAL_STATE.game, action) => {
  switch (action.type) {

    case UPDATE_GAME:
      if (state.gridHistory.length >= GRID_HISTORY_MAX_LENGTH) {
        state.gridHistory = state.gridHistory.slice(Math.max(1, state.gridHistory.length - GRID_HISTORY_MAX_LENGTH));
      } 
      state.gridHistory.push({
        score: state.score,
        encoded: encodeState(state.grid)
      });
      return {
        ...state, 
        grid: action.payload.grid, 
        score: state.score + action.payload.deltaScore
      };

    case RESET_GAME:
      return {...REDUX_INITIAL_STATE.game, gridHistory: [], status: GAME_STARTED};

    case ROLLBACK_HISTORY:
      if (state.gridHistory.length) {
        const {score, encoded} = state.gridHistory.pop();
        return {...state, grid: decodeState(encoded), score};
      } else {
        return state;
      }

    case AI_TOGGLE:
      return {...state, aiActive: !state.aiActive};

    case START_GAME:
      return {...state, status: GAME_STARTED};

    default:
      return state;
  }
}

export default gameReducer;