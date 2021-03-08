//! # `engine` module
//! 
//! Contains the AI engine that exposes the API to the user.

use std::collections::VecDeque;

use crate::ai::core::*;
use crate::game::moves::PlayerMove;
use crate::game::engine::Game;


//------------------------------------------------
// Types and Definitions
//------------------------------------------------

pub enum AIState {
  Active,
  Inactive,
}

pub struct AIEngine {
  game: Game,
  state: AIState,
  optimal_moves_stream: VecDeque<PlayerMove>,
}


//------------------------------------------------
// Implementations
//------------------------------------------------

// Inherent

impl AIEngine {

  /// Constructor.
  pub fn new() -> Self {

    AIEngine {
      game: Game::new(),
      state: AIState::Inactive,
      optimal_moves_stream: VecDeque::with_capacity(MOVES_QUEUE_CAPACITY),
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


//------------------------------------------------
// Unit tests
//------------------------------------------------

#[cfg(test)]
mod tests {



}