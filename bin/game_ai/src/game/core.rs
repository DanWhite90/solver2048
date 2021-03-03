//! # `core` module
//! 
//! This module contains the core types and definitions for the entire project.

use std::ops::IndexMut;


//------------------------------------------------
// Core Types and Definitions
//------------------------------------------------

// These parameters are kept const and never meant to be changed.
// Changing it would possibly break the encoding and other parts of the code that were optimized for these parameters.
pub const GRID_SIDE: usize = 4;
pub const LARGEST_TILE: EntryType = 65536;
pub const ENCODING_BITS: usize = 5;
pub const PROB_TILE2: f64 = 0.9;
pub const VICTORY_THRESHOLD: EntryType = 2048;
pub const HISTORY_LENGTH: usize = 20;


// TYPES

pub type EntryType = u32;
pub type EncodedEntryType = u32;
pub type DestEntryType = i8;

pub type Array1D<T> = [T; GRID_SIDE];
pub type Array2D<T> = [Array1D<T>; GRID_SIDE];

pub type EncodedGrid = Array1D<EncodedEntryType>;
pub type DestinationsGrid = Array2D<DestEntryType>;


//------------------------------------------------
// Traits
//------------------------------------------------

/// Marker trait to label the types allowed for `Grid<T: GridState>`.
pub trait GridState: Copy + IndexMut<usize> + Eq {}

/// Trait for transposing the grid
pub trait Transpose {

  /// Transposes the grid in place and returns a mutable reference of itself for chaining.
  fn transpose(&mut self) -> &mut Self;
    
}

/// Trait for Reverse 
pub trait Reverse {

  /// Horizontally reverses the grid in place and returns a mutable reference of itself for chaining.
  fn reverse(&mut self) -> &mut Self;

}


//------------------------------------------------
// Implementations
//------------------------------------------------

// GridState

impl GridState for EncodedGrid {}
impl GridState for DestinationsGrid {}