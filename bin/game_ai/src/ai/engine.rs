//! # `engine` module
//! 
//! Contains the AI engine that exposes the API to the user.

use std::collections::{HashMap, VecDeque};
use std::rc::Rc;

use crate::ai::core::*;
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
  current_grid: Grid<EncodedGrid>,
  state: AIState,
  optimal_moves_stream: VecDeque<PlayerMove>,
  precomputed_moves: HashMap<EncodedEntryType, LineStackingResult>,
}


//------------------------------------------------
// Implementations
//------------------------------------------------

// Inherent

impl AIEngine {

  /// Constructor.
  pub fn new(grid: &Grid<EncodedGrid>) -> Self {

    let precomputed_moves = moves::make_precomputed_hashmap();

    AIEngine {
      current_grid: *grid,
      state: AIState::Inactive,
      optimal_moves_stream: VecDeque::with_capacity(MOVES_QUEUE_CAPACITY),
      precomputed_moves,
    }
    
  }

  /// Gets the next optimal move enqueued  based on the current state of the grid
  pub fn get_optimal_move(&self) -> Option<PlayerMove> {
    if self.optimal_moves_stream.len() > 0 {
      Some(*self.optimal_moves_stream.front().unwrap())
    } else {
      None
    }
  }


}


//------------------------------------------------
// Functions
//------------------------------------------------

fn alpha_beta(grid: &Grid<EncodedGrid>) {

}



//------------------------------------------------
// Unit tests
//------------------------------------------------

#[cfg(test)]
mod tests {



}