//! # `engine` module
//! 
//! Contains the AI engine that exposes the API to the user.

use std::collections::{VecDeque, HashMap};

use crate::ai::core::*;
use crate::game::core::*;
use crate::game::moves;
use crate::game::moves::{PlayerMove, LineStackingResult, MoveStackingResult};
use crate::game::engine;
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

/// This function generates the leaves of the forecast tree.
fn generate_leaves(
  grid: &Grid<EncodedGrid>, 
  move_count: u32, 
  max_depth: usize, 
  precomputed_moves: &HashMap<EncodedEntryType, LineStackingResult>
) -> VecDeque<AINode> {

  let mut queue = VecDeque::with_capacity(100);
  let mut current_node: AINode;
  let mut new_node: AINode;
  let directions = [PlayerMove::Up, PlayerMove::Left, PlayerMove::Right, PlayerMove::Down]; // enums not iterable so order must be the same
  let mut move_result: MoveStackingResult;
  let base_mask = (ENCODING_BITS as f64).exp2() as EncodedEntryType - 1;
  let mut mask_j: EncodedEntryType;
  let mut temp_grid: Grid<EncodedGrid>;
  let estimated_probability = bayes_beta_update(grid, move_count as usize);

  let mut current_depth = 0;
  let root = AINode::new(
    grid,
    None,
    0,
    1.,
    0,
  );

  queue.push_back(root);

  // generate nodes in a Breadth-First fashion
  while queue.len() > 0 {
    current_node = queue.pop_front().unwrap();

    // stochastic pruning of very unlikely paths (paths where disproportionally too many 4s appear) - risky heuristic
    if current_node.get_depth() <= 2 || current_node.get_path_probability().powf(1. / current_node.get_depth() as f64) >= PATH_PROBABILITY_THRESHOLD {

      // process each move for the current grid
      for &direction in directions.iter() {
        move_result = moves::process_grid_stacking(direction, current_node.get_grid(), precomputed_moves);
        mask_j = base_mask;

        // generate all the possible tile allocations only if the move was not null
        if engine::is_effective_move(&move_result) {

          // run through each tile position
          for j in 0..GRID_SIDE {
            for i in 0..GRID_SIDE {

              // select only empty tiles
              if move_result.get_new_grid()[i] & mask_j == 0 {

                // make both 2 and 4 tile using the log2 versions [1, 2]
                for tile in 1..=2 {
                  temp_grid = *move_result.get_new_grid();
                  temp_grid[i] |= tile << ENCODING_BITS * j;

                  new_node = AINode::new(
                    &temp_grid,
                    match current_node.get_originating_move() {
                      Some(player_move) => Some(player_move),
                      _ => Some(direction),
                    },
                    move_result.get_delta_score(),
                    match tile {
                      1 => estimated_probability,
                      _ => 1. - estimated_probability,
                    },
                    current_node.get_depth() + 1,
                  );

                  // when a new node reaches a new depth, stop if the number of leaves has reached a certain threshold or depth reached a certain level
                  if current_depth != current_node.get_depth() && queue.len() > TREE_SIZE_THRESHOLD || new_node.get_depth() > max_depth {
                    queue.push_front(current_node);
                    return queue;
                  }

                  // otherwise update depth and append new node
                  current_depth = new_node.get_depth();
                  queue.push_back(new_node);

                }

              }

            }

            // shift to new column of the encoded grid
            mask_j <<= ENCODING_BITS;
          }

        }

      }

    }

  }

  // if we get here we emptied the queue meaning we are facing terminating states at a certain depth

  // if we can reduce the depth we try and reduce it
  if max_depth > 0 {
    return generate_leaves(grid, move_count, max_depth - 1, precomputed_moves);
  }

  // otherwise nothing can be done, meaning game over, return empty queue
  queue

}


//------------------------------------------------
// Unit tests
//------------------------------------------------

#[cfg(test)]
mod tests {

  use super::*;


  // testing generate_leaves()

  #[test]
  pub fn test_generate_leaves_first_level() {

    use PlayerMove::{Up, Left};
    let precomputed_moves = moves::make_precomputed_hashmap();

    let grid = Grid::from_decoded(&[
      [0, 8, 4, 2],
      [0, 2, 64, 128],
      [8, 64, 4, 2],
      [4, 2, 16, 8],
    ]);

    // order matters
    let expected = VecDeque::from(vec![
      AINode::new(&Grid::from_decoded(&[
        [8, 8, 4, 2],
        [4, 2, 64, 128],
        [2, 64, 4, 2],
        [0, 2, 16, 8],
      ]), Some(Up), 0, 0.9, 1),
      AINode::new(&Grid::from_decoded(&[
        [8, 8, 4, 2],
        [4, 2, 64, 128],
        [4, 64, 4, 2],
        [0, 2, 16, 8],
      ]), Some(Up), 0, 0.1, 1),
      AINode::new(&Grid::from_decoded(&[
        [8, 8, 4, 2],
        [4, 2, 64, 128],
        [0, 64, 4, 2],
        [2, 2, 16, 8],
      ]), Some(Up), 0, 0.9, 1),
      AINode::new(&Grid::from_decoded(&[
        [8, 8, 4, 2],
        [4, 2, 64, 128],
        [0, 64, 4, 2],
        [4, 2, 16, 8],
      ]), Some(Up), 0, 0.1, 1),
      AINode::new(&Grid::from_decoded(&[
        [8, 4, 2, 2],
        [2, 64, 128, 0],
        [8, 64, 4, 2],
        [4, 2, 16, 8],
      ]), Some(Left), 0, 0.9, 1),
      AINode::new(&Grid::from_decoded(&[
        [8, 4, 2, 4],
        [2, 64, 128, 0],
        [8, 64, 4, 2],
        [4, 2, 16, 8],
      ]), Some(Left), 0, 0.1, 1),
      AINode::new(&Grid::from_decoded(&[
        [8, 4, 2, 0],
        [2, 64, 128, 2],
        [8, 64, 4, 2],
        [4, 2, 16, 8],
      ]), Some(Left), 0, 0.9, 1),
      AINode::new(&Grid::from_decoded(&[
        [8, 4, 2, 0],
        [2, 64, 128, 4],
        [8, 64, 4, 2],
        [4, 2, 16, 8],
      ]), Some(Left), 0, 0.1, 1),
    ]);

    let result = generate_leaves(&grid, 143, 1, &precomputed_moves);

    // compare all the actual results with all the expected results
    for k in 0..result.len() {
      // grid
      assert_eq!(*result[k].get_grid(), *expected[k].get_grid());
      // originating_move
      assert_eq!(result[k].get_originating_move().unwrap(), expected[k].get_originating_move().unwrap());
      // delta_score
      assert_eq!(result[k].get_delta_score(), expected[k].get_delta_score());
      // path_probability
      assert!((result[k].get_path_probability() - expected[k].get_path_probability()).abs() < 0.05);
      // depth
      assert_eq!(result[k].get_depth(), expected[k].get_depth());
    }

  }

  #[test]
  pub fn test_generate_leaves_same_level_only() {

    let precomputed_moves = moves::make_precomputed_hashmap();

    let grid = Grid::from_decoded(&[
      [0, 8, 4, 2],
      [0, 2, 64, 128],
      [8, 64, 4, 2],
      [4, 2, 16, 8],
    ]);

    let result = generate_leaves(&grid, 143, DEFAULT_TREE_DEPTH, &precomputed_moves);

    let depth = result[result.len() - 1].get_depth();
    for (k, node) in result.iter().rev().enumerate() {
      assert_eq!(node.get_depth(), depth, "Element {}/{}", k, result.len());
    }

  }

  #[test]
  pub fn test_generate_leaves_terminating_leaves() {

    let precomputed_moves = moves::make_precomputed_hashmap();

    let grid = Grid::from_decoded(&[
      [32, 32, 8, 32],
      [8, 16, 4, 16],
      [2, 8, 16, 2],
      [8, 4, 8, 4],
    ]);

    let result = generate_leaves(&grid, 143, DEFAULT_TREE_DEPTH, &precomputed_moves);

    assert_eq!(result.len(), 1);
    assert_eq!(*result[0].get_grid(), grid);
  }

  #[test]
  pub fn test_generate_leaves_terminating_root() {

    let precomputed_moves = moves::make_precomputed_hashmap();

    let grid = Grid::from_decoded(&[
      [32, 64, 8, 32],
      [8, 16, 4, 16],
      [2, 8, 16, 2],
      [8, 4, 8, 4],
    ]);

    let result = generate_leaves(&grid, 143, DEFAULT_TREE_DEPTH, &precomputed_moves);

    assert_eq!(result.len(), 0);
  }

}