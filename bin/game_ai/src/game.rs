//! # `game` module
//!
//! This module should define the function that generates the precomputed moves as well as the engine.
//! Contains all the base definitions and implementations for the game.

#![allow(dead_code)]
#![allow(type_alias_bounds)]

mod encoding;
pub mod moves;
mod engine;


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

type Row<T: EntryType> = [T; GRID_SIDE];
type EncodedGrid = [EncodedGameGridPrimitive; GRID_SIDE];

type Grid<T: EntryType> = [Row<T>; GRID_SIDE];

type VecGrid<T: EntryType> = [T; GRID_SIZE];

/// Player move `enum`.
pub enum PlayerMove {
  Up = 0,
  Left = 1,
  Right = 2,
  Down = 3,
}

/// `GameGrid` type containing the encoded grid state, defining the grid behavior.
pub struct GameGrid<T: GameGridState> {
  state: T,
  encoded: bool,
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

/// Marker trait to define the set of types that a grid tile can assume
trait EntryType {}

/// Marker trait to define a set of types for the state of `GameGrid`
trait GameGridState {}

/// Trait to define an object that is capable of exhibiting a grid-like behavior
trait GridLike {
  type Target: EntryType;

  /// Gets a mutable reference to the `Grid<T>` underlying the GridLike object
  fn get_grid_mut(&mut self) -> &mut Grid<Self::Target>;

  /// Gets an immutable reference to the `Grid<T>` underlying the GridLike object
  fn get_grid(&self) -> &Grid<Self::Target> {
    // deref coercion to immutable
    self.get_grid_mut()
  }
}

/// Implements the transposition for method for `GridLike` structures
trait Transpose: GridLike {

  /// Returns a `Copy` value of the transposed `GridLike` object
  fn get_transpose(&self) -> Grid<Self::Target> {

    // grid is Copy so can do
    let grid = *self.get_grid();

    let mut tmp;
    for i in 0..GRID_SIDE {
      for j in (i + 1)..GRID_SIDE {
        tmp = grid[i][j];
        grid[i][j] = grid[j][i];
        grid[j][i] = tmp;
      }
    }

    grid
  }

  /// Transposes the `GridLike` object in place
  fn transpose(&mut self) -> &mut Self {
    
    *self.get_grid_mut() = self.get_transpose();

    self
  }
}

/// Implements the horizontal reverse of a `GridLike` structure
trait Reverse: GridLike {

  /// Return a copy of the horizontally reversed grid in the `GridLike` object
  fn get_reverse(&self) -> Grid<Self::Target> {

    // grid is Copy so can do
    let grid = *self.get_grid();

    let mut tmp;
    for i in 0..GRID_SIDE {
      for j in 0..(GRID_SIDE / 2) {
        tmp = grid[i][j];
        grid[i][j] = grid[i][GRID_SIDE - 1 - j];
        grid[i][GRID_SIDE - 1 - j] = tmp;
      }
    }

    grid
  }

  /// Reverses the `GridLike` object in place horizontally and returns the mutable reference to itself for chaining
  fn reverse(&mut self) -> &mut Self {
    
    *self.get_grid_mut() = self.get_reverse();

    self
  }
}


//------------------------------------------------
// Implementations
//------------------------------------------------


// Primitives

impl EntryType for GameGridPrimitive {}
impl EntryType for DestGridPrimitive {}
impl GameGridState for Grid<GameGridPrimitive> {}
impl GameGridState for EncodedGrid {}


// Grid

impl<T: EntryType> GridLike for Grid<T> {}
impl<T: EntryType> Transpose for Grid<T> {}
impl<T: EntryType> Reverse for Grid<T> {}


// GameGrid

impl<T: GameGridState> Clone for GameGrid<T> {
  fn clone(&self) -> Self {
    *self
  }
}

impl<T: GameGridState> Copy for GameGrid<T> {}

impl<T: GameGridState> GridLike for GameGrid<T> {}
impl<T: GameGridState> Transpose for GameGrid<T> {}
impl<T: GameGridState> Reverse for GameGrid<T> {}


//------------------------------------------------
// Unit tests
//------------------------------------------------

#[cfg(test)]
mod tests {

}
