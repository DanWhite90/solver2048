//! # `game` module
//!
//! This module should define the function that generates the precomputed moves as well as the engine.
//! Contains all the base definitions and implementations for the game.

pub mod moves;
mod engine;

//------------------------------------------------
// Core Types and Definitions
//------------------------------------------------

/// Player move `enum`.
pub enum PlayerMove {
  Up,
  Left,
  Right,
  Down,
}


//------------------------------------------------
// Implementations
//------------------------------------------------