import {UPDATE_GAME, RESET_GAME, ROLLBACK_HISTORY, SET_GAME_STATUS, INCREASE_MOVE_COUNT, STORE_PARTIAL_MOVE} from "../actions/types";
import {REDUX_INITIAL_STATE, GRID_HISTORY_MAX_LENGTH, GAME_STARTED} from "../globalOptions";
import {encodeState, decodeState} from "../components/game/lib/encoding";
import {isNonEmpty} from "../components/game/lib/gameEngine";

const gameReducer = (state = REDUX_INITIAL_STATE().game, action) => {
  switch (action.type) {

    case UPDATE_GAME:
      if (isNonEmpty(state.grid) && action.updateHistory) {
        if (state.gridHistory.length >= GRID_HISTORY_MAX_LENGTH) {
          state.gridHistory = state.gridHistory.slice(Math.max(1, state.gridHistory.length - GRID_HISTORY_MAX_LENGTH));
        }
        state.gridHistory.push({
          score: state.score,
          encoded: encodeState(state.grid)
        });
      }
      return {
        ...state, 
        grid: action.payload.grid, 
        score: state.score + action.payload.deltaScore,
        newTile: action.payload.newTile
      };

    case INCREASE_MOVE_COUNT:
      return {...state, moveCount: state.moveCount + 1};

    case RESET_GAME:
      return {...REDUX_INITIAL_STATE().game, status: GAME_STARTED};

    case ROLLBACK_HISTORY:
      if (state.gridHistory.length) {
        const {score, encoded} = state.gridHistory.pop();
        return {...state, grid: decodeState(encoded), score};
      } else {
        return state;
      }

    case SET_GAME_STATUS:
      return {...state, status: action.payload};

    case STORE_PARTIAL_MOVE:
      return {...state, computedGrid: action.payload.computedGrid, computedScore: action.payload.computedScore};

    default:
      return state;
  }
}

export default gameReducer;