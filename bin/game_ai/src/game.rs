//! # `game` module
//!
//! This module defines the fundamental grids of the game and their core behaviour.
//! It is further divided in the `moves` and `engine` submodules.

pub mod moves;
pub mod engine;

use std::{fmt, fmt::Display};
use std::ops::{Index, IndexMut};

pub use crate::core::*;
use crate::encoding;


//------------------------------------------------
// Core Types and Definitions
//------------------------------------------------

// DATA STRUCTURES

/// Generic grid type encapsulating it's state.
#[derive(Debug)]
pub struct Grid<T: GridState> {
  state: T,
}

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
  pub fn from_decoded(grid: &Array2D<EntryType>) -> Self {
    Self {
      state: encoding::encode_grid(grid),
    }
  }

  /// Gets the number of zeros.
  pub fn get_zeros(&self) -> usize {
    let mut count: usize = 0;
    let mut bit_mask: EncodedEntryType;

    for i in 0..GRID_SIDE {

      // initial bit mask for the first encoded tile starting from the least significant ENCODING_BITS number of bits
      bit_mask = (ENCODING_BITS as f64).exp2() as EncodedEntryType - 1;

      // for each encoded tile in a single EncodedEntryType (i.e. u32)
      for _ in 0..GRID_SIDE {

        // check if the bits for the encoded number are zero by masking all the other bits to 0
        if self.state[i] & bit_mask == 0 {
          count += 1;
        }

        // shift bit mask to the next tile
        bit_mask <<= ENCODING_BITS;
      }
    }

    count
  }

  /// adds a "new_tile" value to a certain "position" in the listed empty tiles in reading order within the grid starting from 0 as the first index
  pub fn add_tile_to_position(&mut self, new_tile: EntryType, mut position: isize) -> &mut Self {
  
    // TODO: OPTIMIZE ADDITION TROUGH DIRECT ENCODING
    let base_mask = (ENCODING_BITS as f64).exp2() as EncodedEntryType - 1;
    let mut mask_j: EncodedEntryType;
  
    // Loop through all the empty tiles 
    for i in 0..GRID_SIDE {
      for j in 0..GRID_SIDE {
  
        mask_j = base_mask << ENCODING_BITS * j;
  
        // Decrement the position counter only when an entry is zero
        if self[i] & mask_j == 0 {
          position -= 1;
  
          // When we exhaust the position counter we found the tile and break out of the loop
          if position < 0 {
            self[i] |= encoding::encode_tile(new_tile, j);
            break;
          }
  
        }
  
      }
  
      if position < 0 { break; }
  
    }
  
    self
  }

}

impl Grid<DestinationsGrid> {

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


// Decode

impl encoding::Decode for Grid<EncodedGrid> {
  type Output = Array2D<EntryType>;

  fn get_decoded(&self) -> Self::Output {
    encoding::decode_grid(&self.state)
  }

}


// Transpose

impl Transpose for Grid<EncodedGrid> {

  fn transpose(&mut self) -> &mut Self {

    let base_mask = (ENCODING_BITS as f64).exp2() as EncodedEntryType - 1;

    let mut mask_i: EncodedEntryType;
    let mut mask_j: EncodedEntryType;
    let mut delta_pos;
    let mut tmp: EncodedEntryType;

    for i in 0..GRID_SIDE {
      mask_i = base_mask << ENCODING_BITS * i;

      for j in (i + 1)..GRID_SIDE {
        mask_j = base_mask << ENCODING_BITS * j;
        delta_pos = ENCODING_BITS * (j - i);

        tmp = (self.state[i] & mask_j) >> delta_pos;
        self.state[i] = self.state[i] & !mask_j | (self.state[j] & mask_i) << delta_pos;
        self.state[j] = self.state[j] & !mask_i | tmp;
      }
    }

    self
  }

}

impl Transpose for Grid<DestinationsGrid> {

  fn transpose(&mut self) -> &mut Self {

    let mut tmp;
    for i in 0..GRID_SIDE {
      for j in (i + 1)..GRID_SIDE {
        tmp = self.state[i][j];
        self.state[i][j] = self.state[j][i];
        self.state[j][i] = tmp;
      }
    }

    self
  }
  
}


// Reverse

impl Reverse for Grid<EncodedGrid> {

  fn reverse(&mut self) -> &mut Self {

    let base_mask = (ENCODING_BITS as f64).exp2() as EncodedEntryType - 1;

    let mut mask_j: EncodedEntryType;
    let mut mask_n_j: EncodedEntryType;
    let mut delta_pos;
    let mut tmp: EncodedEntryType;

    for i in 0..GRID_SIDE {

      for j in 0..(GRID_SIDE / 2) {
        mask_j = base_mask << ENCODING_BITS * j;
        mask_n_j = base_mask << ENCODING_BITS * (GRID_SIDE - 1 - j);
        delta_pos = ENCODING_BITS * (GRID_SIDE - 1 - 2 * j);

        tmp = (self.state[i] & mask_j) << delta_pos;
        self.state[i] = self.state[i] & !mask_j | (self.state[i] & mask_n_j) >> delta_pos;
        self.state[i] = self.state[i] & !mask_n_j | tmp;
      }
    }

    self
  }

}

impl Reverse for Grid<DestinationsGrid> {

  fn reverse(&mut self) -> &mut Self {
    
    let mut tmp;
    for i in 0..GRID_SIDE {
      for j in 0..(GRID_SIDE / 2) {
        tmp = self.state[i][j];
        self.state[i][j] = self.state[i][GRID_SIDE - 1 - j];
        self.state[i][GRID_SIDE - 1 - j] = tmp;
      }
    }
    
    self
  }
  
}


// Display

impl Display for Grid<EncodedGrid> {

  fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {

    write!(f, "GameGrid::state = [\n")?;
    for i in 0..GRID_SIDE {
      write!(f, "  {:?},\n", encoding::decode_line(self.state[i]))?;
    }
    write!(f, "]\n")?;

    Ok(())
  }
}

impl Display for Grid<DestinationsGrid> {

  fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {

    write!(f, "GameGrid::state = [\n")?;
    for i in 0..GRID_SIDE {
      write!(f, "  {:?},\n", self.state[i])?;
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


// PartialEq and Eq

impl<T: GridState> PartialEq for Grid<T> {

  fn eq(&self, other: &Self) -> bool {
    self.state == other.state
  }

}

impl<T: GridState> Eq for Grid<T> {}


//------------------------------------------------
// Unit tests
//------------------------------------------------

#[cfg(test)]
mod tests {

  use super::*;


  // Grid<EncodedGrid>

  #[test]
  pub fn test_gamegrid_get_zeros() {
    let grid = Grid::from_decoded(&[
      [0, 0, 0, 2],
      [0, 0, 0, 0],
      [2, 2, 2, 2],
      [4, 4, 4, 4],
    ]);

    assert_eq!(grid.get_zeros(), 7);
  }

  #[test]
  pub fn test_gamegrid_get_zeros_full_grid() {
    let grid = Grid::from_decoded(&[
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 8],
      [4, 2, 2048, 2],
    ]);

    assert_eq!(grid.get_zeros(), 0);
  }

  #[test]
  pub fn test_gamegrid_transpose() {
    let mut grid = Grid::from_decoded(&[
      [0, 2, 4, 8],
      [4, 4, 4, 4],
      [8, 8, 4, 4],
      [8, 4, 2, 2],
    ]);

    let res = Grid::from_decoded(&[
      [0, 4, 8, 8],
      [2, 4, 8, 4],
      [4, 4, 4, 2],
      [8, 4, 4, 2],
    ]);

    assert_eq!(*grid.transpose().get_state(), *res.get_state());
  }

  #[test]
  pub fn test_gamegrid_reverse() {
    let mut grid = Grid::from_decoded(&[
      [0, 2, 4, 8],
      [4, 4, 4, 4],
      [8, 8, 4, 4],
      [8, 4, 2, 2],
    ]);

    let res = Grid::from_decoded(&[
      [8, 4, 2, 0],
      [4, 4, 4, 4],
      [4, 4, 8, 8],
      [2, 2, 4, 8],
    ]);

    assert_eq!(*grid.reverse().get_state(), *res.get_state());
  }
  
  #[test]
  pub fn test_gamegrid_add_tile_to_position() {
    let mut grid = Grid::from_decoded(&[
      [2, 4, 4, 0],
      [4, 2, 0, 0],
      [8, 8, 2, 2],
      [0, 0, 4, 2],
    ]);
    
    let res = Grid::from_decoded(&[
      [2, 4, 4, 0],
      [4, 2, 0, 2],
      [8, 8, 2, 2],
      [0, 0, 4, 2],
    ]);

    assert_eq!(*grid.add_tile_to_position(2, 2).get_state(), *res.get_state());
  }


  // Grid::<DestinationsGrid>

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
  pub fn test_destgrid_reverse() {
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
