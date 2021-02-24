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
use std::{ fmt, fmt::Display };


//------------------------------------------------
// Core Types and Definitions
//------------------------------------------------

// These are kept const and never meant to be changed to allow for variable size grids.
// Changing it would possibly break the encoding and other parts of the code that were optimized for this const value
const GRID_SIDE: usize = 4;
const GRID_SIZE: usize = GRID_SIDE * GRID_SIDE;


// TYPES

type GameGridPrimitive = u32;
type EncodedGameGridPrimitive = u32;
type DestGridPrimitive = i8;

type Row<T: Copy> = [T; GRID_SIDE];
type EncodedGrid = [EncodedGameGridPrimitive; GRID_SIDE];

type Grid<T: Copy> = [Row<T>; GRID_SIDE];

type VecGrid<T: Copy> = [T; GRID_SIZE];


// DATA STRUCTURES

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
/// All the values are encoded where possible.
pub struct LineStackingResult {
  prev_line: EncodedGameGridPrimitive,
  new_line: EncodedGameGridPrimitive,
  delta_score: u32,
  destinations: Row<DestGridPrimitive>,
}

/// Contains the information regarding the encoded processing of the move for the entire grid.
/// All the values are encoded where possible.
pub struct MoveResult {
  prev_grid: EncodedGrid,
  new_grid: EncodedGrid,
  delta_score: u32,
  destination_grid: Grid<DestGridPrimitive>,
}


// TRAITS

/// A trait for an object that can return and encoded version if itself
trait Encode {
  type Output;

  fn get_encoded(&self) -> Self::Output;
}

/// A trait for an object that can return a decoded version of itself
trait Decode {
  type Output;

  fn get_decoded(&self) -> Self::Output;
}

/// A market trait for structures capable of exhibiting grid-like behavior
trait GridLike: IndexMut<usize> {
  type EntryType: Copy;
  
  /// Gets an immutable reference to the underlying state of the grid
  fn get_state(&self) -> &Grid<Self::EntryType>;

  /// Gets a mutable reference to the underlying state of the grid
  fn get_state_mut(&mut self) -> &mut Grid<Self::EntryType>;

}

/// Implements the transposition for method for `GridLike` structures
trait Transpose: GridLike {

  /// Transposes the `GridLike` object in place
  fn transpose(&mut self) -> &mut Self {

    let grid = self.get_state_mut();

    let (n, m) = (grid.len(), grid[0].len());

    let mut tmp;
    for i in 0..n {
      for j in (i + 1)..m {
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
    
    let (n, m) = (grid.len(), grid[0].len());

    let mut tmp;
    for i in 0..n {
      for j in 0..(m / 2) {
        tmp = grid[i][j];
        grid[i][j] = grid[i][m - 1 - j];
        grid[i][m - 1 - j] = tmp;
      }
    }

    self
  }

}

/// Implements the ability to change the sign of an object
trait ChangeSign {

  /// Reverses the sign of each entry in `Grid`
  fn change_sign(&mut self) -> &mut Self;

}


//------------------------------------------------
// Implementations
//------------------------------------------------


// GameGrid

impl GameGrid {

  fn new(state: &Grid<GameGridPrimitive>) -> Self {
    GameGrid { state: *state }
  }

}

impl Display for GameGrid{

  fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {

    write!(f, "GameGrid::state = [\n")?;
    for i in 0..GRID_SIDE {
      write!(f, "  {:?}\n", self.state[i])?;
    }
    write!(f, "]\n")?;

    Ok(())
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
  type EntryType = GameGridPrimitive;

  fn get_state(&self) -> &Grid<Self::EntryType> {
    &self.state
  }

  fn get_state_mut(&mut self) -> &mut Grid<Self::EntryType> {
    &mut self.state
  }
  
}

impl Encode for GameGrid {
  type Output = EncodedGrid;

  fn get_encoded(&self) -> Self::Output {
    encoding::encode_grid(&self.state)
  }
}

impl Transpose for GameGrid {}
impl Reverse for GameGrid {}


// Row<GameGridPrimitive>

impl Encode for Row<GameGridPrimitive> {
  type Output = EncodedGameGridPrimitive;

  fn get_encoded(&self) -> Self::Output {
    encoding::encode_line(self)
  }
}


// EncodedGameGridPrimitive

impl Decode for EncodedGameGridPrimitive {
  type Output = Row<GameGridPrimitive>;

  fn get_decoded(&self) -> Self::Output {
    encoding::decode_line(*self)
  }
}


// Grid

impl<T: Copy> GridLike for Grid<T> {
  type EntryType = T;

  fn get_state(&self) -> &Grid<Self::EntryType> {
    self
  }

  fn get_state_mut(&mut self) -> &mut Grid<Self::EntryType> {
    self
  }

}

impl<T: Copy> Transpose for Grid<T> {}
impl<T: Copy> Reverse for Grid<T> {}

impl Encode for Grid<GameGridPrimitive> {
  type Output = EncodedGrid;

  fn get_encoded(&self) -> Self::Output {
    encoding::encode_grid(self)
  }
}

impl ChangeSign for Grid<DestGridPrimitive> {

  fn change_sign(&mut self) -> &mut Self {

    for i in 0..GRID_SIDE {
      for j in 0..GRID_SIDE {
        self[i][j] *= -1;
      }
    }

    self
  }

}


// EncodedGrid

impl Decode for EncodedGrid {
  type Output = Grid<GameGridPrimitive>;

  fn get_decoded(&self) -> Self::Output {
    encoding::decode_grid(self)
  }
}


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
  pub fn get_destinations(& self) -> Row<DestGridPrimitive> { self.destinations }

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
