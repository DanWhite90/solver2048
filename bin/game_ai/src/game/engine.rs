/*
This module defines the game engine module.
Exposes functions for mapping a move to a resulting grid state.
*/

use crate::encoding;
use super::moves::StackingResult;
use std::collections::HashMap;

use super::{GRID_SIDE, GRID_SIZE, DestinationGrid, EncodedGrid, DecodedGrid};

pub enum Move {
  Up = 0,
  Left = 1,
  Right = 2,
  Down = 3,
}

pub struct Grid {
  encoded_state: EncodedGrid,
}

impl Grid {

  fn validate_new(tiles: &[u32]) {

    // validate length
    if tiles.len() < GRID_SIZE {
      panic!("Need {size} tiles to construct a grid {len} provided", size = GRID_SIZE, len = tiles.len());
    }

    // validate content as powers of 2
    for tile in &tiles[0..GRID_SIZE] {
      let mut value: usize = *tile as usize;
      let mut count: usize = 0;

      while value > 0 {  
        if value % 2 > 0 {
          count += 1;
        }
        value /= 2;
  
        if count > 1 {
          panic!("At least one of the numbers provided in the list is not a power of 2");
        }
      }

    }

  }

  // should validate length and admissible values
  pub fn new(tiles: &[u32]) -> Grid {
    // Grid::validate_new(tiles);

    let mut state: EncodedGrid = [0; GRID_SIDE];

    for i in 0..GRID_SIDE {
      state[i] = encoding::encode_line(&tiles[(i * GRID_SIDE) .. ((i + 1) * GRID_SIDE)])
    }

    Grid {encoded_state: state}
  }

  // Getter
  pub fn get_encoded_state(&self) -> EncodedGrid {
    self.encoded_state
  }

  pub fn transpose(&mut self) -> &mut Self {

    let mut decoded_grid: DecodedGrid = [[0; GRID_SIDE]; GRID_SIDE];

    let mut i: usize = 0;
    for encoded_line in &self.encoded_state {
      decoded_grid[i] = encoding::decode_line(*encoded_line);
      i += 1;
    }

    self
  }

  pub fn reverse(&mut self) -> &mut Self {
    self
  }

}


// Traits for Grid

impl Copy for Grid {}

impl Clone for Grid {
  fn clone(&self) -> Self {
    *self
  }
}

pub struct MoveResult {
  prev_grid: EncodedGrid,
  new_grid: EncodedGrid,
  delta_score: u32,
  destination_grid: DestinationGrid,
}

impl MoveResult {

  pub fn new(prev: EncodedGrid, new: EncodedGrid, delta: u32, dest: DestinationGrid) -> Self {
    MoveResult {
      prev_grid: prev,
      new_grid: new,
      delta_score: delta,
      destination_grid: dest,
    }
  }

  // Getters
  pub fn get_prev_grid(&self) -> EncodedGrid { self.prev_grid }
  pub fn get_new_grid(&self) -> EncodedGrid { self.new_grid }
  pub fn get_delta_score(&self) -> u32 { self.delta_score }
  pub fn get_destination_grid(&self) -> DestinationGrid { self.destination_grid }

}

impl Copy for MoveResult {}

impl Clone for MoveResult {
  fn clone(&self) -> Self {
    *self
  }
}

// Public API

pub fn process_move(player_move: Move, mut grid: Grid, moves_table: &HashMap<u32, StackingResult>) -> MoveResult {
  let prev_grid = grid;
  let mut tot_delta_score: u32 = 0;
  let mut dest_grid: DestinationGrid = [[0; GRID_SIDE]; GRID_SIDE];

  // normalize to only operate on left moves
  match player_move {
    Move::Up => grid.transpose(),
    Move::Left => &mut grid,
    Move::Right => grid.reverse(),
    Move::Down => grid.transpose().reverse(),
  };

  // find new state from move_table
  for i in 0..grid.encoded_state.len() {

    // process each row if in table, else it means that it had no effect 
    if moves_table.contains_key(&prev_grid.encoded_state[i]) {
      let result = moves_table.get(&prev_grid.encoded_state[i]).unwrap();

      grid.encoded_state[i] = result.get_new_line();
      tot_delta_score += result.get_delta_score();
      dest_grid[i] = result.get_destinations();
    }
  }

  // restore grid
  match player_move {
    Move::Up => grid.transpose(),
    Move::Left => &mut grid,
    Move::Right => grid.reverse(),
    Move::Down => grid.transpose().reverse(),
  };

  MoveResult::new(prev_grid.get_encoded_state(), grid.get_encoded_state(), tot_delta_score, dest_grid)
}


// Unit Tests

#[cfg(test)]
mod tests {

  const moves_table: super::HashMap<u32, super::StackingResult> = crate::game::moves::make_precomputed_hashmap();

  #[test]
  pub fn test_process_move() {
    // let grid: 
  }
}