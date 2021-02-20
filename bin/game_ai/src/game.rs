/*
This module should define the function that generates the precomputed moves as well as the engine
*/

#![allow(dead_code)]

const GRID_SIDE: usize = 4;
const GRID_SIZE: usize = GRID_SIDE * GRID_SIDE;

type DestinationLine = [i8; GRID_SIDE];
type DestinationGrid = [DestinationLine; GRID_SIDE];
type GridLine = [u32; GRID_SIDE];
type EncodedGrid = [u32; GRID_SIDE];
type DecodedGrid = [GridLine; GRID_SIDE];
type VecGrid = [u32; GRID_SIZE];

pub enum Move {
  Up = 0,
  Left = 1,
  Right = 2,
  Down = 3,
}

pub trait GridLike {}

impl GridLike for DestinationGrid {}
impl GridLike for DecodedGrid {}

pub mod core;
pub mod moves;
pub mod engine;