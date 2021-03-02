//! # `engine` module
//! 
//! Contains the AI engine that exposes the API to the user.

use std::collections::{HashMap, VecDeque};
use std::rc::Rc;

use super::core::*;
use crate::game::*;
use moves::{PlayerMove, LineStackingResult};


//------------------------------------------------
// Types and Definitions
//------------------------------------------------

const MOVES_QUEUE_CAPACITY: usize = 20;

pub enum AIState {
  Active,
  Inactive,
}

pub struct AIEngine {
  moves_tree_root: Rc<AINode>,
  state: AIState,
  optimal_moves_stream: VecDeque<PlayerMove>,
  precomputed_moves: HashMap<EncodedEntryType, LineStackingResult>,
}


//------------------------------------------------
// Implementations
//------------------------------------------------

// Inherent

impl AIEngine{

  pub fn new(grid: &Grid<EncodedGrid>) -> Self {

    let precomputed_moves = moves::make_precomputed_hashmap();

    AIEngine {
      moves_tree_root: Rc::new(AINode::new(&AINodeData::new(utility(grid, &precomputed_moves), None))),
      state: AIState::Inactive,
      optimal_moves_stream: VecDeque::with_capacity(MOVES_QUEUE_CAPACITY),
      precomputed_moves,
    }
    
  }

}


//------------------------------------------------
// Functions
//------------------------------------------------


//------------------------------------------------
// Unit tests
//------------------------------------------------

#[cfg(test)]
mod tests {



}