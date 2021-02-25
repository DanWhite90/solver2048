//! # `encoding` module
//! 
//! This module allows for encoding and decoding a row state into and from a u32 number.
//! Given the code is internal to the library no validation of the inputs is executed for maximum performance.

use crate::core::*;


pub const ENCODING_BITS: usize = 5;


//------------------------------------------------
// Traits
//------------------------------------------------

/// A trait for an object that can return and encoded version if itself
pub trait Encode {
  type Output;

  fn get_encoded(&self) -> Self::Output;
}

/// A trait for an object that can return a decoded version of itself
pub trait Decode {
  type Output;

  fn get_decoded(&self) -> Self::Output;
}


//------------------------------------------------
// Functions
//------------------------------------------------

/// Encodes a single tile and shifts it to the right position
pub fn encode_tile(num: EntryType, position: usize) -> EncodedEntryType {
  ((num as f64).log2() as EncodedEntryType) << ENCODING_BITS * position
}

/// Encodes a single row of tiles to a number.
pub fn encode_line(row: &Array1D<EntryType>) -> EncodedEntryType {
  let mut num = 0;

  for (i, &tile) in row.iter().enumerate() {
    if tile != 0 {
      num |= encode_tile(tile, i);
    }
  }
  num
}

/// Decodes a number to a single row of tiles.
pub fn decode_line(mut num: EncodedEntryType) -> Array1D<EntryType> {
  let mut row = [0; GRID_SIDE];
  let mut tile;

  for i in 0..GRID_SIDE {
    tile = ((num % (ENCODING_BITS as f64).exp2() as EncodedEntryType) as f64).exp2() as EntryType;
    num >>= ENCODING_BITS;
    if tile > 1 {
      row[i] = tile;
    }
  }
  row
}

/// Encodes the entire grid
pub fn encode_grid(decoded_grid: &Array2D<EntryType>) -> EncodedGrid {
  let mut grid: EncodedGrid = [0; GRID_SIDE];

  for (i, decoded_line) in decoded_grid.iter().enumerate() {
    grid[i] = encode_line(decoded_line);
  }

  grid
}

/// Decodes the entire grid
pub fn decode_grid(encoded_grid: &EncodedGrid) -> Array2D<EntryType> {
  let mut decoded_grid: Array2D<EntryType> = [[0; GRID_SIDE]; GRID_SIDE];

  for (i, &encoded_line) in encoded_grid.iter().enumerate() {
    decoded_grid[i] = decode_line(encoded_line);
  }

  decoded_grid
}


//------------------------------------------------
// Unit tests
//------------------------------------------------

#[cfg(test)]
mod tests {

  use super::*;


  // testing for encode_line()

  #[test]
  fn correct_zero_encoding() {
    let row = [0, 0, 0, 0];
    assert_eq!(encode_line(&row), 0);
  }
  
  #[test]
  fn correct_random_encoding() {
    let row = [8, 4, 2, 0];
    assert_eq!(encode_line(&row), 1091);
  }
  
  #[test]
  fn correct_large_encoding() {
    let row = [65536, 65536, 65536, 65536];
    assert_eq!(encode_line(&row), 541200);
  }
  
  #[test]
  fn correct_critical_encoding() {
    let row = [0, 2, 4, 8];
    assert_eq!(encode_line(&row), 100384);
  }


  // testing for decode_line()

  #[test]
  fn correct_zero_decoding() {
    assert_eq!(decode_line(0), [0, 0, 0, 0]);
  }
  
  #[test]
  fn correct_random_decoding() {
    assert_eq!(decode_line(1091), [8, 4, 2, 0]);
  }
  
  #[test]
  fn correct_large_decoding() {
    assert_eq!(decode_line(541200), [65536, 65536, 65536, 65536]);
  }
  
  #[test]
  fn correct_critical_decoding() {
    assert_eq!(decode_line(100384), [0, 2, 4, 8]);
  }


  // testing for encode_grid()

  #[test]
  pub fn test_encode_grid() {
    let encoded_state: EncodedGrid = encode_grid(&[
      [0, 2, 4, 8],
      [4, 4, 4, 4],
      [8, 8, 4, 4],
      [8, 4, 2, 2],
    ]);

    assert_eq!(encoded_state, [100384, 67650, 67683, 33859]);
  }


  // testing for decode_grid()

  #[test]
  pub fn test_decode_grid() {
    let decoded_grid: Array2D<EntryType> = [
      [0, 2, 4, 8],
      [4, 4, 4, 4],
      [8, 8, 4, 4],
      [8, 4, 2, 2],
    ];

    let encoded_grid: EncodedGrid = [100384, 67650, 67683, 33859];

    assert_eq!(decode_grid(&encoded_grid), decoded_grid);
  }
}