//! # `game_ai` crate
//! 
//! This library containse the set of functionalities of the 2048 game and AI to compile to WebAssembly.

mod encoding;
pub mod game;
pub mod ai;

// re-exported 
pub use crate::game::core::EncodedEntryType;

/*
The public API should expose:
    - a method for passing a state of the grid and return an optimal move
*/
