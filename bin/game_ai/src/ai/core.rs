//! # `core` module
//! 
//! Contains the basic definitions and implementations for the objects used by the AI engine.

use std::ops::{Index, IndexMut};

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

impl Index<usize> for AITree {
  type Output = Option<AINode>;
  
  fn index(&self, index: usize) -> &Self::Output {
    &self.data[index]
  }

}

impl IndexMut<usize> for AITree {
  
  fn index_mut(&mut self, index: usize) -> &mut Self::Output {
    &mut self.data[index]
  }

}

// TODO: possibly add indexing for path


//------------------------------------------------
// Functions
//------------------------------------------------

pub fn get_child_index() {}
pub fn get_parent_index() {}



//------------------------------------------------
// Unit tests
//------------------------------------------------

#[cfg(test)]
mod tests {

  use super::*;


}