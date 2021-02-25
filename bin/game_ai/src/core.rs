//! # `core` module
//! 
//! This module contains the core types and definitions for the entire project.

use num_traits::Num;
use std::{fmt, fmt::Display};
use std::ops::{Index, IndexMut};

use crate::{encoding, encoding::ENCODING_BITS};


//------------------------------------------------
// Core Types and Definitions
//------------------------------------------------

// These are kept const and never meant to be changed to allow for variable size grids.
// Changing it would possibly break the encoding and other parts of the code that were optimized for this const value.
pub const GRID_SIDE: usize = 4;


// TYPES

pub type EntryType = u32;
pub type EncodedEntryType = u32;
pub type DestEntryType = i8;

pub type Array1D<T: Num> = [T; GRID_SIDE];
pub type Array2D<T: Num> = [Array1D<T>; GRID_SIDE];

pub type EncodedGrid = Array1D<EncodedEntryType>;
pub type DestinationsGrid = Array2D<DestEntryType>;


// DATA STRUCTURES

/// Grid type containing encapsulating it's state.
pub struct Grid<T: GridState> {
  state: T,
}


//------------------------------------------------
// Traits
//------------------------------------------------

/// Marker trait to label the types allowed for `Grid<T: GridState>`
pub trait GridState: Copy + IndexMut<usize> {}


//------------------------------------------------
// Implementations
//------------------------------------------------

// Inherent

impl<T: GridState> Grid<T> {

  /// Constructor.
  pub fn new(state: &T) -> Self {
    Grid::<T> { 
      state: *state,
    }
  }

  pub fn get_state(&self) -> &T {
    &self.state
  }

}

impl Grid<EncodedGrid> {

  /// Constructor from decoded to be encoded.
  pub fn new_from_decoded(grid: &Array2D<EntryType>) -> Self {
    Self {
      state: encoding::encode_grid(grid),
    }
  }

  /// Gets the number of zeros.
  pub fn get_zeros(&self) -> usize {
    let mut count: usize = 0;
    let mut bit_mask: EncodedEntryType =  (ENCODING_BITS as f64).exp2() as EncodedEntryType - 1;

    for i in 0..GRID_SIDE {
      for j in 0..GRID_SIDE {
        if self.state[i] & bit_mask == 0 {
          count += 1;
        }

        bit_mask <<= ENCODING_BITS;
      }
    }

    count
  }

}

impl Grid<DestinationsGrid> {

  /// Transposes the grid in place and returns the mutable reference to itself for chaining.
  pub fn transpose(&mut self) -> &mut Self {

    let grid = &mut self.state;

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
  
  /// Reverses the grid in place horizontally and returns the mutable reference to itself for chaining.
  pub fn reverse(&mut self) -> &mut Self {

    let grid = &mut self.state;
    
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

  /// Changes the sign of the entries in place and returns the mutable reference to itself for chaining.
  pub fn change_sign(&mut self) -> &mut Self {

    for i in 0..GRID_SIDE {
      for j in 0..GRID_SIDE {
        self.state[i][j] *= -1;
      }
    }

    self
  }

}

// GridState

impl GridState for EncodedGrid {}
impl GridState for DestinationsGrid {}


// Decode

impl encoding::Decode for Grid<EncodedGrid> {
  type Output = Array2D<EntryType>;

  fn get_decoded(&self) -> Self::Output {
    encoding::decode_grid(&self.state)
  }

}


// Display

impl Display for Grid<EncodedGrid> {

  fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {

    write!(f, "GameGrid::state = [\n")?;
    for i in 0..GRID_SIDE {
      write!(f, "  {:?}\n", encoding::decode_line(self.state[i]))?;
    }
    write!(f, "]\n")?;

    Ok(())
  }
}

impl Display for Grid<DestinationsGrid> {

  fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {

    write!(f, "GameGrid::state = [\n")?;
    for i in 0..GRID_SIDE {
      write!(f, "  {:?}\n", self.state[i])?;
    }
    write!(f, "]\n")?;

    Ok(())
  }
}


// Clone and Copy

impl<T: GridState> Clone for Grid<T> {

  fn clone(&self) -> Self {
    *self
  }

}

impl<T: GridState> Copy for Grid<T> {}


// Index and IndexMut

impl Index<usize> for Grid<EncodedGrid> {
  type Output = EncodedEntryType;

  fn index(&self, index: usize) -> &Self::Output {
    &self.state[index]
  }

}

impl IndexMut<usize> for Grid<EncodedGrid> {

  fn index_mut(&mut self, index: usize) -> &mut Self::Output {
    &mut self.state[index]
  }

}

impl Index<usize> for Grid<DestinationsGrid> {
  type Output = Array1D<DestEntryType>;

  fn index(&self, index: usize) -> &Self::Output {
    &self.state[index]
  }

}

impl IndexMut<usize> for Grid<DestinationsGrid> {

  fn index_mut(&mut self, index: usize) -> &mut Self::Output {
    &mut self.state[index]
  }

}


//------------------------------------------------
// Unit tests
//------------------------------------------------

#[cfg(test)]
mod tests {

  use super::*;


  #[test]
  pub fn test_gamegrid_get_zeros() {
    let grid = Grid::new_from_decoded(&[
      [0, 0, 0, 2],
      [0, 0, 0, 0],
      [2, 2, 2, 2],
      [4, 4, 4, 4],
    ]);

    assert_eq!(grid.get_zeros(), 7);
  }

  #[test]
  pub fn test_destgrid_transpose() {
    let mut grid = Grid::<DestinationsGrid>::new(&[
      [0, 2, 4, 8],
      [4, 4, 4, 4],
      [8, 8, 4, 4],
      [8, 4, 2, 2],
    ]);

    let res = Grid::<DestinationsGrid>::new(&[
      [0, 4, 8, 8],
      [2, 4, 8, 4],
      [4, 4, 4, 2],
      [8, 4, 4, 2],
    ]);

    assert_eq!(*grid.transpose().get_state(), *res.get_state());
  }

  #[test]
  pub fn test_gamegrid_reverse() {
    let mut grid = Grid::<DestinationsGrid>::new(&[
      [0, 2, 4, 8],
      [4, 4, 4, 4],
      [8, 8, 4, 4],
      [8, 4, 2, 2],
    ]);

    let res = Grid::<DestinationsGrid>::new(&[
      [8, 4, 2, 0],
      [4, 4, 4, 4],
      [4, 4, 8, 8],
      [2, 2, 4, 8],
    ]);

    assert_eq!(*grid.reverse().get_state(), *res.get_state());
  }

}
