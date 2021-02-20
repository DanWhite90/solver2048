//! # `game` module
//! 
//! This module should define the function that generates the precomputed moves as well as the engine.
//! Contains all the base types and traits for the game.

#![allow(dead_code)]

pub mod moves;
mod engine;

use super::encoding;

//------------------------------------------------
// Core Types and Definitions
//------------------------------------------------

const GRID_SIDE: usize = 4;
const GRID_SIZE: usize = GRID_SIDE * GRID_SIDE;

type DestinationLine = [i8; GRID_SIDE];
type DestinationGrid = [DestinationLine; GRID_SIDE];
type GridLine = [u32; GRID_SIDE];
type EncodedGrid = [u32; GRID_SIDE];
type DecodedGrid = [GridLine; GRID_SIDE];
type VecGrid = [u32; GRID_SIZE];

/// Player moves
pub enum Move {
  Up = 0,
  Left = 1,
  Right = 2,
  Down = 3,
}

/// Marker trait for grid-like structs
pub trait GridLike {}

/// Contains the information regarding the processing of a single row in the grid
pub struct LineStackingResult {
  prev_line: u32,
  new_line: u32,
  delta_score: u32,
  destinations: DestinationLine,
}


//------------------------------------------------
// Implementations
//------------------------------------------------

impl GridLike for DestinationGrid {}
impl GridLike for DecodedGrid {}

impl LineStackingResult {

  fn new(prev_line: &GridLine, new_line: &GridLine, delta_score: u32, destinations: &DestinationLine) -> LineStackingResult {
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

  /// Formats stacking result into a valid javascript array declaration, to insert into Map() API
  #[allow(dead_code)]
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