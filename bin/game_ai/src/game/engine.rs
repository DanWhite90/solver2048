//! # `engine` module
//! 
//! This module defines the game logic functionalities.
//! Exposes the Game API to the user.

use std::collections::HashMap;

use crate::core::*;

use super::*;
use moves::{LineStackingResult, MoveResult};


//------------------------------------------------
// Types and Definitions
//------------------------------------------------

/// `enum` encoding the status of the `Game`, values are: {`New`, `Playing`, `Over`}.
#[derive(Copy, Clone)]
pub enum GameState {
  New,
  Playing,
  Over,
}

/// The `Game` object the player interacts with.
pub struct Game {
  grid: Grid<EncodedGrid>,
  status: GameState,
  victory: bool,
  precomputed_moves: HashMap<EncodedEntryType, LineStackingResult>,
}


//------------------------------------------------
// Implementations
//------------------------------------------------

// Inherent

impl Game {

  /// Constructor.
  pub fn new() -> Self {
    Game {
      grid: *add_random_tile(&mut Grid::new(&[0; GRID_SIDE])),
      status: GameState::New,
      victory: false,
      precomputed_moves: moves::make_precomputed_hashmap(),
    }
  }

  /// Reset the game
  pub fn reset(&mut self) {
    self.grid = *add_random_tile(&mut Grid::new(&[0; GRID_SIDE]));
    self.status = GameState::New;
    self.victory = false;
  }

  /// Gets an immutable reference to the content of the encoded game grid of the game.
  pub fn get_grid(&self) -> &Grid<EncodedGrid> {
    &self.grid
  }

  /// Gets the status of the game.
  pub fn get_status(&self) -> GameState {
    self.status
  }

  /// Gets the status of the game.
  pub fn get_victory(&self) -> bool {
    self.victory
  }

  /// Gets an immutable reference to the precomuted partial moves `HashMap<EncodedEntryType, LineStackingResult>`.
  pub fn get_precomputed_moves(&self) -> &HashMap<EncodedEntryType, LineStackingResult> {
    &self.precomputed_moves
  }

  /// Process the `PlayerMove` to transition to a new grid state by stacking the grid and adding a random tile
  pub fn process_move(&mut self, player_move: PlayerMove) {
    let move_result = moves::process_grid_stacking(player_move, self.grid, &self.precomputed_moves);

    // TODO:
    // - Validate move
    // - Check if it causes game over
    // - Check if it causes a victory

  }
  
}


//------------------------------------------------
// Functions
//------------------------------------------------

/// Adds a random tile to the grid
pub fn add_random_tile(grid: &mut Grid<EncodedGrid>) -> &mut Grid<EncodedGrid> {

  // Generate random tile according to the probability of spawning a 2 or a 4
  let mut new_tile: EntryType = 2;
  if rand::random::<f64>() >= PROB_TILE2 {
    new_tile = 4;
  }

  // Get a position among the empty tiles in the grid in "reading order" where we place the new tile
  let position: isize = (rand::random::<f64>() * grid.get_zeros() as f64) as isize;

  grid.add_tile_to_position(new_tile, position)
}

/// Checks if a game grid is in a victory state 
pub fn is_victory(grid: &Grid<EncodedGrid>) -> bool {

  let mut bit_mask = (ENCODING_BITS as f64).exp2() as EncodedEntryType - 1;

  // Run through each column first to change the bit_mask in O(n) time rather than O(n^2)
  for j in 0..GRID_SIDE {

    for i in 0..GRID_SIDE {

      // check if the masked number shifted back to the least significant bit is greater than or equal to the log2 of the victory threshold
      if (grid.state[i] & bit_mask) >> ENCODING_BITS * j >= (VICTORY_THRESHOLD as f64).log2() as EncodedEntryType {
        return true;
      }
    }
    
    // shift to new column
    bit_mask <<= ENCODING_BITS * j;
  }

  false
}

pub fn is_game_over(grid: &Grid<EncodedGrid>, moves_table: &HashMap<EncodedEntryType, LineStackingResult>) -> bool {

  // Progressive optimization, if at least one entry is zero you can always make a move
  if grid.get_zeros() > 0 { return false; }

  // When the grid is full, if at least one move is possible then it's not game over
  if is_effective_move(&moves::process_grid_stacking(PlayerMove::Up, *grid, moves_table)) { return false; }
  if is_effective_move(&moves::process_grid_stacking(PlayerMove::Left, *grid, moves_table)) { return false; }
  if is_effective_move(&moves::process_grid_stacking(PlayerMove::Right, *grid, moves_table)) { return false; }
  if is_effective_move(&moves::process_grid_stacking(PlayerMove::Down, *grid, moves_table)) { return false; }

  // No move is possible, game over
  true
}

fn is_effective_move(move_result: &MoveResult) -> bool {

  let dest_grid = move_result.get_destination_grid();

  for i in 0..GRID_SIDE {
    for j in 0..GRID_SIDE {
      if dest_grid[i][j] != 0 {
        return true;
      }
    }
  }

  false
}


//------------------------------------------------
// Unit tests
//------------------------------------------------

#[cfg(test)]
mod tests {

  use super::*;

  #[test]
  pub fn test_is_victory_false() {
    let grid = Grid::new_from_decoded(&[
      [0, 0, 0, 2],
      [0, 0, 2, 8],
      [0, 0, 4, 8],
      [0, 1024, 4, 4],
    ]);

    assert_eq!(is_victory(&grid), false);
  }

  #[test]
  pub fn test_is_victory_true() {
    let grid = Grid::new_from_decoded(&[
      [0, 0, 0, 2],
      [0, 0, 2, 8],
      [0, 0, 4, 8],
      [0, 4, 4, 2048],
    ]);

    assert_eq!(is_victory(&grid), true);
  }

  #[test]
  pub fn test_is_effective_move_false() {
    let move_result = MoveResult::new(
      &Grid::new(&[0; GRID_SIDE]),
      &Grid::new(&[0; GRID_SIDE]),
      0,
      &Grid::new(&[[0; GRID_SIDE]; GRID_SIDE]),
    );

    assert_eq!(is_effective_move(&move_result), false);
  }

  #[test]
  pub fn test_is_effective_move_true() {
    let move_result = MoveResult::new(
      &Grid::new(&[0; GRID_SIDE]),
      &Grid::new(&[0; GRID_SIDE]),
      0,
      &Grid::new(&[
        [0, -1, 0, 0],
        [0; GRID_SIDE],
        [0; GRID_SIDE],
        [0; GRID_SIDE],
      ]),
    );

    assert_eq!(is_effective_move(&move_result), true);
  }

  #[test]
  pub fn test_is_game_over_on_sparse_grid() {
    let grid = Grid::new_from_decoded(&[
      [0, 4, 4, 8],
      [2, 4, 8, 8],
      [2, 0, 0, 8],
      [2, 2, 8, 8],
    ]);

    assert_eq!(is_game_over(&grid, &moves::make_precomputed_hashmap()), false);
  }

  #[test]
  pub fn test_is_game_over_on_full_non_game_over() {
    let grid = Grid::new_from_decoded(&[
      [2, 4, 2, 2],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ]);

    assert_eq!(is_game_over(&grid, &moves::make_precomputed_hashmap()), false);
  }

  #[test]
  pub fn test_is_game_over_on_full_game_over() {
    let grid = Grid::new_from_decoded(&[
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ]);

    assert_eq!(is_game_over(&grid, &moves::make_precomputed_hashmap()), true);
  }

}