//! # `game` module
//!
//! This module should define the function that generates the precomputed moves as well as the engine.
//! Contains all the base definitions and implementations for the game.

#![allow(dead_code)]
#![allow(type_alias_bounds)]

mod encoding;
pub mod moves;
mod engine;

use std::ops::{ Index, IndexMut };


//------------------------------------------------
// Core Types and Definitions
//------------------------------------------------

// These are kept const and never meant to be changed to allow for variable size grids.
// Changing it would possibly break the encoding and other parts of the code that were optimized for this const value
const GRID_SIDE: usize = 4;
const GRID_SIZE: usize = GRID_SIDE * GRID_SIDE;


// DATA STRUCTURES

type GameGridPrimitive = u32;
type EncodedGameGridPrimitive = u32;
type DestGridPrimitive = i8;

type Row<T: Copy + Sized> = [T; GRID_SIDE];
type EncodedGrid = [EncodedGameGridPrimitive; GRID_SIDE];

type Grid<T: Copy + Sized> = [Row<T>; GRID_SIDE];

type VecGrid<T: Copy + Sized> = [T; GRID_SIZE];

/// Player move `enum`.
pub enum PlayerMove {
  Up = 0,
  Left = 1,
  Right = 2,
  Down = 3,
}

/// `GameGrid` type containing the encoded grid state, defining the grid behavior.
pub struct GameGrid {
  state: Grid<GameGridPrimitive>,
}

/// Contains the information regarding the encoded processing of the move for a single row in the grid.
pub struct LineStackingResult {
  prev_line: EncodedGameGridPrimitive,
  new_line: EncodedGameGridPrimitive,
  delta_score: u32,
  destinations: Row<DestGridPrimitive>,
}

/// Contains the information regarding the encoded processing of the move for the entire grid.
pub struct MoveResult {
  prev_grid: EncodedGrid,
  new_grid: EncodedGrid,
  delta_score: u32,
  destination_grid: Grid<DestGridPrimitive>,
}


// TRAITS

/// A market trait for structures capable of exhibiting grid-like behavior
trait GridLike: IndexMut<usize> + Sized {
  
  /// Gets an immutable reference to the underlying state of the grid
  fn get_state(&self) -> &Grid<GameGridPrimitive>;

  /// Gets a mutable reference to the underlying state of the grid
  fn get_state_mut(&mut self) -> &mut Grid<GameGridPrimitive>;

}

/// Implements the transposition for method for `GridLike` structures
trait Transpose: GridLike {

  /// Transposes the `GridLike` object in place
  fn transpose(&mut self) -> &mut Self {

    let grid = self.get_state_mut();

    let mut tmp;
    for i in 0..GRID_SIDE {
      for j in (i + 1)..GRID_SIDE {
        tmp = grid[i][j];
        grid[i][j] = grid[j][i];
        grid[j][i] = tmp;
      }
    }

    self
  }
}

/// Implements the horizontal reverse of a `GridLike` structure
trait Reverse: GridLike {

  /// Reverses the `GridLike` object in place horizontally and returns the mutable reference to itself for chaining
  fn reverse(&mut self) -> &mut Self {

    let grid = self.get_state_mut();

    let mut tmp;
    for i in 0..GRID_SIDE {
      for j in 0..(GRID_SIDE / 2) {
        tmp = grid[i][j];
        grid[i][j] = grid[i][GRID_SIDE - 1 - j];
        grid[i][GRID_SIDE - 1 - j] = tmp;
      }
    }

    self
  }
}


//------------------------------------------------
// Implementations
//------------------------------------------------


// GameGrid

impl GameGrid {

  fn new(state: &Grid<GameGridPrimitive>) -> Self {
    GameGrid { state: *state }
  }

  fn get_encoded_state(&self) -> EncodedGrid {
    encoding::encode_grid(&self.state)
  }

}

impl Clone for GameGrid {

  fn clone(&self) -> Self {
    *self
  }

}

impl Copy for GameGrid {}

impl Index<usize> for GameGrid {
  type Output = Row<GameGridPrimitive>;

  fn index(&self, index: usize) -> &Self::Output {
    &self.state[index]
  }

}

impl IndexMut<usize> for GameGrid {

  fn index_mut(&mut self, index: usize) -> &mut Self::Output {
    &mut self.state[index]
  }

}

impl GridLike for GameGrid {

  fn get_state(&self) -> &Grid<GameGridPrimitive> {
    &self.state
  }

  fn get_state_mut(&mut self) -> &mut Grid<GameGridPrimitive> {
    &mut self.state
  }
  
}

impl Transpose for GameGrid {}
impl Reverse for GameGrid {}


// LineStackingResult

impl LineStackingResult {

  fn new(prev_line: &Row<GameGridPrimitive>, new_line: &Row<GameGridPrimitive>, delta_score: u32, destinations: &Row<DestGridPrimitive>) -> Self {
    LineStackingResult {
      prev_line: encoding::encode_line(prev_line),
      new_line: encoding::encode_line(new_line),
      delta_score,
      destinations: *destinations,
    }
  }

  // Getters

  pub fn get_prev_line(&self) -> u32 { self.prev_line }
  pub fn get_new_line(&self) -> u32 { self.new_line }
  pub fn get_delta_score(&self) -> u32 { self.delta_score }
  pub fn get_destinations<'a>(&'a self) -> Row<DestGridPrimitive> { self.destinations }

  #[allow(dead_code)]
  /// Formats stacking result into a valid JavaScript array declaration, to insert into `Map()` API.
  pub fn format_js_array(&self) -> String {
    format!("[{}, [{}, {}, {:?}]],\n", self.prev_line, self.new_line, self.delta_score, self.destinations)
  }
}


// MoveResult

impl MoveResult {

  pub fn new(prev: EncodedGrid, new: EncodedGrid, delta: u32, dest: Grid<DestGridPrimitive>) -> Self {
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
  pub fn get_destination_grid(&self) -> Grid<DestGridPrimitive> { self.destination_grid }

}




//------------------------------------------------
// Unit tests
//------------------------------------------------

#[cfg(test)]
mod tests {

  use super::*;


  #[test]
  pub fn test_gamegrid_transpose() {
    let mut grid: GameGrid = GameGrid::new(&[
      [0, 2, 4, 8],
      [4, 4, 4, 4],
      [8, 8, 4, 4],
      [8, 4, 2, 2],
    ]);

    let res: GameGrid = GameGrid::new(&[
      [0, 4, 8, 8],
      [2, 4, 8, 4],
      [4, 4, 4, 2],
      [8, 4, 4, 2],
    ]);

    assert_eq!(*grid.transpose().get_state(), *res.get_state());
  }

  #[test]
  pub fn test_gamegrid_reverse() {
    let mut grid: GameGrid = GameGrid::new(&[
      [0, 2, 4, 8],
      [4, 4, 4, 4],
      [8, 8, 4, 4],
      [8, 4, 2, 2],
    ]);

    let res: GameGrid = GameGrid::new(&[
      [8, 4, 2, 0],
      [4, 4, 4, 4],
      [4, 4, 8, 8],
      [2, 2, 4, 8],
    ]);

    assert_eq!(*grid.reverse().get_state(), *res.get_state());
  }

}
