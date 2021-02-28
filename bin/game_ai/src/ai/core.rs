//! # `core` module
//! 
//! Contains the basic definitions and implementations for the objects used by the AI engine.

use std::ops::{Index, IndexMut};
use std::collections::HashMap;
use std::rc::{Rc, Weak};

use crate::game::*;
use crate::game::moves::PlayerMove;


//------------------------------------------------
// Types and Definitions
//------------------------------------------------

pub const AVAILABLE_MOVES_COUNT: usize = 4;
pub const TREE_DEPTH: usize = 6;
pub const TREE_SIZE: usize = TREE_SIZE!(AVAILABLE_MOVES_COUNT, TREE_DEPTH); // must satisfy: TREE_SIZE >= AVAILABLE_MOVES_COUNT ** (TREE_DEPTH + 1) - 1

// TYPES

type ChildrenMap<T> = HashMap<PlayerMove, Rc<T>>;
type WeakChildrenMap<T> = HashMap<PlayerMove, Weak<T>>;


// DATA STRUCTURES

/// Contains all the data required by the AI that needs to be stored in a node in the forecast tree.
#[derive(Copy, Clone)]
pub struct AINodeData {
  grid: Grid<EncodedGrid>,
}

/// Contains all the information needed in the AI forecast tree to compute the optimal move.
/// The next sibling weak reference is meant in BFS order.
#[derive(Clone)]
pub struct AINode {
  data: AINodeData,
  children: ChildrenMap<AINode>,
  parent: Weak<AINode>,
  next_sibling: Weak<AINode>,
}

/// The forecast tree to be processed in order to compute the optimal move.
pub struct AITree {
  root: Rc<AINode>,
  first_leaf_per_move: WeakChildrenMap<AINode>,
}


//------------------------------------------------
// Implementations
//------------------------------------------------

// Inherent

impl AINodeData {

  /// Constructor
  pub fn new(grid: &Grid<EncodedGrid>) -> Self {
    AINodeData {
      grid: *grid,
    }
  }

  // Getters
  pub fn get_grid(&self) -> &Grid<EncodedGrid> { &self.grid }

}

impl AINode {

  /// Constructor.
  pub fn new(data: &AINodeData) -> Self {
    AINode {
      data: *data,
      children: ChildrenMap::<AINode>::with_capacity(AVAILABLE_MOVES_COUNT),
      parent: Weak::new(),
      next_sibling: Weak::new(),
    }
  }
  
  // Getters
  pub fn get_data(&self) -> &AINodeData { &self.data }
  pub fn get_child(&self, player_move: PlayerMove) -> Option<&Rc<AINode>> { self.children.get(&player_move) }
  pub fn get_parent(&self) -> Weak<AINode> { self.parent.clone() }
  pub fn get_next_sibling(&self) -> Weak<AINode> { self.next_sibling.clone() }

  // Setters
  pub fn set_child(&mut self, player_move: PlayerMove, node: &Rc<AINode>) -> Option<Rc<AINode>> { self.children.insert(player_move, Rc::clone(node)) }
  pub fn set_parent(&mut self, node: &Rc<AINode>) { self.parent = Rc::downgrade(node) }
  pub fn set_next_sibling(&mut self, node: &Rc<AINode>) { self.next_sibling = Rc::downgrade(node) }

}

impl AITree {

  /// Initialize empty tree
  pub fn new(root_data: &AINodeData) -> Self {
    AITree {
      root: Rc::new(AINode::new(root_data)),
      first_leaf_per_move: WeakChildrenMap::<AINode>::with_capacity(AVAILABLE_MOVES_COUNT),
    }
  }

  /// This method sets the new root as one of it's children and discards all the other children
  fn make_child_root(&mut self, player_move: PlayerMove) {}

  /// This method expands the tree of moves from the leaves down to a required depth
  fn expand(&mut self, depth: usize) {}

}

// TODO: possibly add indexing for path


//------------------------------------------------
// Functions
//------------------------------------------------

/// Gets the child index in the tree data array
fn get_child_index(parent: usize, branch: PlayerMove) -> usize {
  parent * AVAILABLE_MOVES_COUNT + branch as usize + 1
}

/// Gets the parent index of a given node
fn get_parent_index(child: usize) -> usize {
  (child - 1) / AVAILABLE_MOVES_COUNT
}


//------------------------------------------------
// Unit tests
//------------------------------------------------

#[cfg(test)]
mod tests {

  use super::*;


}