/*
This module should define the function that generates the precomputed moves as well as the engine
*/

const GRID_SIDE: usize = 4;
const GRID_SIZE: usize = GRID_SIDE * GRID_SIDE;

type DestinationLine = [i8; GRID_SIDE];
type DestinationGrid = [DestinationLine; GRID_SIDE];
type GridLine = [u32; GRID_SIDE];
type EncodedGrid = [u32; GRID_SIDE];
type DecodedGrid = [GridLine; GRID_SIDE];
type VecGrid = [u32; GRID_SIZE];

pub mod moves;
pub mod engine;