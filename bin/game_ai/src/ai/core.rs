//! # `core` module
//! 
//! Contains the basic definitions and implementations for the objects used by the AI engine.


use crate::game::*;
use crate::game::moves::PlayerMove;

//------------------------------------------------
// Types and Definitions
//------------------------------------------------

pub const AVAILABLE_MOVES: usize = 4;
pub const TREE_DEPTH: usize = 6;
pub const TREE_SIZE: usize = TREE_SIZE!(AVAILABLE_MOVES, TREE_DEPTH); // must satisfy: TREE_SIZE >= AVAILABLE_MOVES ** (TREE_DEPTH + 1) - 1


// DATA STRUCTURES

#[derive(Copy, Clone)]
pub struct AINode {
  grid: Grid<EncodedGrid>,
}

pub struct AITree {
  data: [Option<AINode>; TREE_SIZE],
}


//------------------------------------------------
// Implementations
//------------------------------------------------

// Inherent

impl AITree {

  /// Initialize empty tree
  pub fn new() -> Self {
    AITree {
      data: [None; TREE_SIZE],
    }
  }

}

// Index and IndexMut




//------------------------------------------------
// Functions
//------------------------------------------------




//------------------------------------------------
// Unit tests
//------------------------------------------------

#[cfg(test)]
mod tests {

  use super::*;


}