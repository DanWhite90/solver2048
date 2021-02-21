//! # `game` module
//! 
//! This module should define the function that generates the precomputed moves as well as the engine.
//! Contains all the base definitions and implementations for the game.

#![allow(dead_code)]

mod encoding;
pub mod moves;
mod engine;


//------------------------------------------------
// Core Types and Definitions
//------------------------------------------------

const GRID_SIDE: usize = 4;
const GRID_SIZE: usize = GRID_SIDE * GRID_SIDE;

type DecodedLine = [u32; GRID_SIDE];
type DecodedGrid = [DecodedLine; GRID_SIDE];
type EncodedGrid = [u32; GRID_SIDE];
type DestinationLine = [i8; GRID_SIDE];
type DestinationGrid = [DestinationLine; GRID_SIDE];
type VecGrid = [u32; GRID_SIZE];

/// Player move `enum`.
pub enum PlayerMove {
  Up = 0,
  Left = 1,
  Right = 2,
  Down = 3,
}

/// Contains the information regarding the processing of the move for a single row in the grid.
pub struct LineStackingResult {
  prev_line: u32,
  new_line: u32,
  delta_score: u32,
  destinations: DestinationLine,
}

/// `GameGrid` type containing the encoded grid state, defining the grid behavior.
pub struct GameGrid {
  encoded_state: EncodedGrid,
}

/// Contains the information regarding the processing of the move for the entire grid.
pub struct MoveResult {
  prev_grid: EncodedGrid,
  new_grid: EncodedGrid,
  delta_score: u32,
  destination_grid: DestinationGrid,
}

/// Label trait for grid-like structs.
trait GridLike {}

/// 
trait Transpose: GridLike {}
trait Reverse {}


//------------------------------------------------
// Implementations
//------------------------------------------------

impl GridLike for DestinationGrid {}
impl GridLike for DecodedGrid {}

impl LineStackingResult {

  fn new(prev_line: &DecodedLine, new_line: &DecodedLine, delta_score: u32, destinations: &DestinationLine) -> LineStackingResult {
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
  pub fn get_destinations<'a>(&'a self) -> DestinationLine { self.destinations }

  #[allow(dead_code)]
  /// Formats stacking result into a valid JavaScript array declaration, to insert into `Map()` API.
  pub fn format_js_array(&self) -> String {
    format!("[{}, [{}, {}, {:?}]],\n", self.prev_line, self.new_line, self.delta_score, self.destinations)
  }
}

impl Copy for LineStackingResult {}

impl Clone for LineStackingResult {
  fn clone(&self) -> Self {
    *self
  }
}

impl GameGrid {

  pub fn new(tiles: &DecodedGrid) -> GameGrid {
    // validation ignored for performance

    let state: EncodedGrid = encoding::encode_grid(tiles);

    GameGrid {encoded_state: state}
  }

  // Getters
  pub fn get_encoded_state(&self) -> EncodedGrid {
    self.encoded_state
  }

  pub fn get_decoded_state(&self) -> DecodedGrid {
    let mut decoded_grid: DecodedGrid = [[0; GRID_SIDE]; GRID_SIDE];

    for (i, &encoded_line) in self.encoded_state.iter().enumerate() {
      decoded_grid[i] = encoding::decode_line(encoded_line);
    }

    decoded_grid
  }

  // Other features

  pub fn transpose(&mut self) -> &mut Self {

    let mut decoded_grid: DecodedGrid = self.get_decoded_state();

    let mut tmp: u32;
    for i in 0..GRID_SIDE {
      for j in (i + 1)..GRID_SIDE {
        tmp = decoded_grid[i][j];
        decoded_grid[i][j] = decoded_grid[j][i];
        decoded_grid[j][i] = tmp;
      }
    }
    
    self.encoded_state = encoding::encode_grid(&decoded_grid);

    self
  }

  pub fn reverse(&mut self) -> &mut Self {

    let mut decoded_grid: DecodedGrid = self.get_decoded_state();

    let mut tmp: u32;
    for i in 0..GRID_SIDE {
      for j in 0..(GRID_SIDE / 2) {
        tmp = decoded_grid[i][j];
        decoded_grid[i][j] = decoded_grid[i][GRID_SIDE - 1 - j];
        decoded_grid[i][GRID_SIDE - 1 - j] = tmp;
      }
    }
    
    self.encoded_state = encoding::encode_grid(&decoded_grid);

    self
  }

}

impl Copy for GameGrid {}

impl Clone for GameGrid {
  fn clone(&self) -> Self {
    *self
  }
}

impl GridLike for GameGrid {}

impl MoveResult {

  pub fn new(prev: EncodedGrid, new: EncodedGrid, delta: u32, dest: DestinationGrid) -> Self {
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
  pub fn get_destination_grid(&self) -> DestinationGrid { self.destination_grid }

}

impl Copy for MoveResult {}

impl Clone for MoveResult {
  fn clone(&self) -> Self {
    *self
  }
}
