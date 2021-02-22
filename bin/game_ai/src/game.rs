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
pub struct GameGrid {
  encoded_state: EncodedGrid,
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

/// Marker trait to define an object that is capable of exhibiting a grid-like behavior
trait GridLike {}

/// Implements the transposition for method for `GridLike` structures
trait Transpose<T: EntryType>: GridLike {

  /// Returns a `Copy` value of the transposed `GridLike` object
  fn transpose(&mut self) -> &mut Self;
}

/// Implements the horizontal reverse of a `GridLike` structure
trait Reverse: GridLike {

  /// Reverses the `GridLike` object in place horizontally and returns the mutable reference to itself for chaining
  fn reverse<T: EntryType>(&self) -> Grid<T>;
}


//------------------------------------------------
// Implementations
//------------------------------------------------


// Primitives

impl EntryType for GameGridPrimitive {}
impl EntryType for DestGridPrimitive {}

// Grid

impl<T: EntryType> GridLike for Grid<T> {}

// GameGrid

impl Clone for GameGrid {
  fn clone(&self) -> Self {
    *self
  }
}
impl Copy for GameGrid {}

#[cfg(test)]
mod tests {


}


// Blanket