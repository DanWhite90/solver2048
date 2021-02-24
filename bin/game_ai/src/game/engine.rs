//! # `engine` module
//! 
//! This module defines the game engine module.
//! Exposes functions to generate a new grid and new random tile given the old grid and the player move.

use std::collections::HashMap;

use super::*;

//------------------------------------------------
// Types and Definitions
//------------------------------------------------

const PROB_TILE2: f64 = 0.9;

pub enum GameState {
  New,
  Playing,
  Over,
}

pub struct Game {
  grid: GameGrid,
  status: GameState,
}


//------------------------------------------------
// Implementations
//------------------------------------------------

impl Game {
  
}


//------------------------------------------------
// Functions
//------------------------------------------------

/// adds a "new_tile" value to a certain "position" in the listed empty tiles in reading order within the grid starting from 0 as the first index
fn add_tile_to_position(grid: &mut GameGrid, new_tile: GameGridPrimitive, mut position: isize) -> &mut GameGrid {

  // Loop through all the empty tiles 
  for i in 0..GRID_SIDE {
    for j in 0..GRID_SIDE {

      // Decrement the position counter only when an entry is zero
      if grid[i][j] == 0 {
        position -= 1;

        // When we exhaust the position counter we found the tile and break out of the loop
        if position < 0 {
          grid[i][j] = new_tile;
          break;
        }

      }

    }

    if position < 0 { break; }

  }

  grid
}

/// Adds a random tile to the given `GameGrid` 
fn add_random_tile(grid: &mut GameGrid) -> &mut GameGrid {

  // Generate random tile according to the probability of spawning a 2 or a 4
  let mut new_tile: GameGridPrimitive = 2;
  if rand::random::<f64>() >= PROB_TILE2 {
    new_tile = 4;
  }

  // Get a position among the empty tiles in the grid in "reading order" where we place the new tile
  let position: isize = (rand::random::<f64>() * grid.get_zeros() as f64) as isize;

  add_tile_to_position(grid, new_tile, position)
}

/// Given the `PlayerMove` and the old `GameGrid::state` produces the new state by stacking the tiles and adding a random tile
fn state_transition<'a>(grid: &'a mut GameGrid, player_move: PlayerMove, moves_table: &HashMap<EncodedGameGridPrimitive, LineStackingResult>) -> &'a mut GameGrid {

  moves::process_move(player_move, *grid, moves_table);

  // TO BE COMPLETED

  // Need also to:
  // - Refactor core types into ./src/core.rs
  // - Add struct Game {} for Game state management to export to wasm
  // - Make process_move() encoded to encoded for max speed avoiding translation, transposition and reversion
  // - Make process_move() to work on mutable references of grid to allow ai module to process moves as well

  grid
}


//------------------------------------------------
// Unit tests
//------------------------------------------------

#[cfg(test)]
mod tests {

  use super::*;

  #[test]
  pub fn test_add_tile_to_position() {
    let mut grid = GameGrid::new(&[
      [2, 4, 4, 0],
      [4, 2, 0, 0],
      [8, 8, 2, 2],
      [0, 0, 4, 2],
    ]);
    
    let res = GameGrid::new(&[
      [2, 4, 4, 0],
      [4, 2, 0, 2],
      [8, 8, 2, 2],
      [0, 0, 4, 2],
    ]);

    add_tile_to_position(&mut grid, 2, 2);

    assert_eq!(*grid.get_state(), *res.get_state());
  }

}