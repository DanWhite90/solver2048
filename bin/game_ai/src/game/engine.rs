/*
This module defines the game engine module.
Exposes functions for mapping a move to a resulting grid state.
*/

use crate::encoding;
use super::moves::StackingResult;
use std::collections::HashMap;

use super::*;


//////////////////////////////////////////////////
// Grid
//////////////////////////////////////////////////

pub struct Grid {
  encoded_state: EncodedGrid,
}

impl Grid {

  pub fn new(tiles: &DecodedGrid) -> Grid {
    // validation ignored for performance

    let state: EncodedGrid = Grid::encode_state(tiles);

    Grid {encoded_state: state}
  }

  // Getters
  pub fn get_encoded_state(&self) -> EncodedGrid {
    self.encoded_state
  }

  pub fn get_decoded_state(&self) -> DecodedGrid {
    let mut decoded_grid: DecodedGrid = [[0; GRID_SIDE]; GRID_SIDE];

    for (i, &encoded_line) in self.encoded_state.iter().enumerate() {
      decoded_grid[i] = encoding::decode_line(encoded_line);
    }

    decoded_grid
  }

  // Other features
  fn encode_state(decoded_grid: &DecodedGrid) -> EncodedGrid {
    let mut grid: EncodedGrid = [0; GRID_SIDE];

    for (i, decoded_line) in decoded_grid.iter().enumerate() {
      grid[i] = encoding::encode_line(decoded_line);
    }

    grid
  }

  pub fn transpose(&mut self) -> &mut Self {

    let mut decoded_grid: DecodedGrid = self.get_decoded_state();

    let mut tmp: u32;
    for i in 0..GRID_SIDE {
      for j in (i + 1)..GRID_SIDE {
        tmp = decoded_grid[i][j];
        decoded_grid[i][j] = decoded_grid[j][i];
        decoded_grid[j][i] = tmp;
      }
    }
    
    self.encoded_state = Grid::encode_state(&decoded_grid);

    self
  }

  pub fn reverse(&mut self) -> &mut Self {

    let mut decoded_grid: DecodedGrid = self.get_decoded_state();

    let mut tmp: u32;
    for i in 0..GRID_SIDE {
      for j in 0..(GRID_SIDE / 2) {
        tmp = decoded_grid[i][j];
        decoded_grid[i][j] = decoded_grid[i][GRID_SIDE - 1 - j];
        decoded_grid[i][GRID_SIDE - 1 - j] = tmp;
      }
    }
    
    self.encoded_state = Grid::encode_state(&decoded_grid);

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

impl GridLike for Grid {}


//////////////////////////////////////////////////
// MoveResult
//////////////////////////////////////////////////

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


// Traits for MoveResult

impl Copy for MoveResult {}

impl Clone for MoveResult {
  fn clone(&self) -> Self {
    *self
  }
}


//////////////////////////////////////////////////
// Public API
//////////////////////////////////////////////////

pub fn process_move(player_move: Move, mut grid: Grid, moves_table: &HashMap<u32, StackingResult>) -> MoveResult {
  let prev_grid = grid;
  let mut tot_delta_score: u32 = 0;
  let mut dest_grid: DestinationGrid = [[0; GRID_SIDE]; GRID_SIDE];

  println!("\nInitial state:\n{:?}\n", grid.get_decoded_state());

  // normalize to only operate on left moves
  match player_move {
    Move::Up => { grid.transpose(); () },
    Move::Left => (),
    Move::Right => { grid.reverse(); () },
    Move::Down => { grid.transpose().reverse(); () },
  };

  println!("\nAfter normalization:\n{:?}\n", grid.get_decoded_state());

  // find new state from move_table
  for i in 0..GRID_SIDE {

    // process each row if in table, else it means that it had no effect so the old value is kept 
    if moves_table.contains_key(&prev_grid.encoded_state[i]) {
      let result = moves_table.get(&prev_grid.encoded_state[i]).unwrap();

      grid.encoded_state[i] = result.get_new_line();
      tot_delta_score += result.get_delta_score();
      dest_grid[i] = result.get_destinations();
    }

  }

  println!("\nAfter matching moves transition:\n{:?}\n", grid.get_decoded_state());

  // restore grid
  match player_move {
    Move::Up => grid.transpose(),
    Move::Left => &mut grid,
    Move::Right => grid.reverse(),
    Move::Down => grid.reverse().transpose(),
  };

  println!("\nFinal state:\n{:?}\n", grid.get_decoded_state());

  MoveResult::new(prev_grid.get_encoded_state(), grid.get_encoded_state(), tot_delta_score, dest_grid)
}


//////////////////////////////////////////////////
// Unit tests
//////////////////////////////////////////////////

#[cfg(test)]
mod tests {

  use super::*;


  // Grid

  #[test]
  pub fn test_grid_encode_state() {
    let encoded_state: EncodedGrid = Grid::encode_state(&[
      [0, 2, 4, 8],
      [4, 4, 4, 4],
      [8, 8, 4, 4],
      [8, 4, 2, 2],
    ]);

    assert_eq!(encoded_state, [100384, 67650, 67683, 33859]);
  }

  #[test]
  pub fn test_grid_get_decoded_state() {
    let decoded_grid: DecodedGrid = [
      [0, 2, 4, 8],
      [4, 4, 4, 4],
      [8, 8, 4, 4],
      [8, 4, 2, 2],
    ];

    let grid: Grid = Grid::new(&decoded_grid);

    assert_eq!(grid.get_decoded_state(), decoded_grid);
  }

  #[test]
  pub fn test_grid_transpose() {
    let mut grid: Grid = Grid::new(&[
      [0, 2, 4, 8],
      [4, 4, 4, 4],
      [8, 8, 4, 4],
      [8, 4, 2, 2],
    ]);

    let res: Grid = Grid::new(&[
      [0, 4, 8, 8],
      [2, 4, 8, 4],
      [4, 4, 4, 2],
      [8, 4, 4, 2],
    ]);

    assert_eq!(grid.transpose().encoded_state, res.encoded_state);
  }

  #[test]
  pub fn test_grid_reverse() {
    let mut grid: Grid = Grid::new(&[
      [0, 2, 4, 8],
      [4, 4, 4, 4],
      [8, 8, 4, 4],
      [8, 4, 2, 2],
    ]);

    let res: Grid = Grid::new(&[
      [8, 4, 2, 0],
      [4, 4, 4, 4],
      [4, 4, 8, 8],
      [2, 2, 4, 8],
    ]);

    assert_eq!(grid.reverse().encoded_state, res.encoded_state);
  }


  // process_move()

  #[test]
  pub fn test_up_move() {
    let moves_table: HashMap<u32, StackingResult> = crate::game::moves::make_precomputed_hashmap();

    let grid: Grid = Grid::new(&[
      [0, 2, 2, 0],
      [2, 2, 2, 2],
      [0, 0, 4, 0],
      [8, 0, 4, 2],
    ]);

    let new_grid: Grid = Grid::new(&[
      [2, 4, 4, 4],
      [8, 0, 8, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);

    let dest_grid: DestinationGrid = [
      [0, 0, 0, 0],
      [-1, -1, -1, -1],
      [0, 0, -1, 0],
      [-2, 0, -2, -1],
    ];

    let result: MoveResult = process_move(Move::Up, grid, &moves_table);

    assert_eq!(result.get_new_grid(), new_grid.get_encoded_state());
    assert_eq!(result.get_delta_score(), 20);
    assert_eq!(result.get_destination_grid(), dest_grid);
  }

  #[test]
  #[ignore]
  pub fn test_down_move() {
    let moves_table: HashMap<u32, StackingResult> = crate::game::moves::make_precomputed_hashmap();

    let grid: Grid = Grid::new(&[
      [0, 2, 2, 0],
      [2, 2, 2, 2],
      [0, 0, 4, 0],
      [8, 0, 4, 2],
    ]);

    let new_grid: Grid = Grid::new(&[
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [2, 0, 4, 0],
      [8, 4, 8, 4],
    ]);

    let dest_grid: DestinationGrid = [
      [0, 3, 2, 0],
      [1, 2, 1, 2],
      [0, 0, 1, 0],
      [0, 0, 0, 0],
    ];

    let result: MoveResult = process_move(Move::Down, grid, &moves_table);

    assert_eq!(result.get_new_grid(), new_grid.get_encoded_state());
    assert_eq!(result.get_delta_score(), 20);
    assert_eq!(result.get_destination_grid(), dest_grid);
  }
}