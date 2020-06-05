import {UPDATE_GRID, AI_TOGGLE} from "./types";

export const updateGrid = grid => {
  return {
    type: UPDATE_GRID,
    payload: grid
  };
};

export const toggleAI = () => {
  return {
    type: AI_TOGGLE
  };
}