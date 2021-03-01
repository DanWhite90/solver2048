//! # `core` module
//! 
//! Contains the basic definitions and implementations for the objects used by the AI engine.

use std::rc::{Rc, Weak};
use std::collections::HashMap;
use std::cell::RefCell;
use std::cmp;

use crate::game::*;
use crate::game::moves::PlayerMove;
use crate::encoding;


//------------------------------------------------
// Types and Definitions
//------------------------------------------------

pub const AVAILABLE_MOVES_COUNT: usize = 4;
pub const TREE_DEPTH: usize = 6;
pub const TREE_SIZE: usize = TREE_SIZE!(AVAILABLE_MOVES_COUNT, TREE_DEPTH); // must satisfy: TREE_SIZE >= AVAILABLE_MOVES_COUNT ** (TREE_DEPTH + 1) - 1
pub const MOVE_CHILDREN_ARR_LENGTH: usize = MOVE_CHILDREN_ARR_LENGTH!(AVAILABLE_MOVES_COUNT);

const LOG2_VICTORY_THRESHOLD: usize = 11; // need macro to make it log of VICTORY_THRESHOLD in game core.
const TOT_MONOTONICITY_DIVISOR: usize = TOT_MONOTONICITY_DIVISOR!(GRID_SIDE);


// DATA STRUCTURES

/// Contains all the data required by the AI that needs to be stored in a node in the forecast tree.
#[derive(Copy, Clone)]
pub struct AINodeData {
  grid: Grid<EncodedGrid>,
  delta_score: u32,
}

/// Contains all the information needed in the AI forecast tree to compute the optimal move.
/// The next sibling weak reference is meant in BFS order.
#[derive(Clone)]
pub struct AINode {
  data: AINodeData,
  children: HashMap<usize, Rc<RefCell<AINode>>>,
  parent: Weak<AINode>,
  next_sibling: Weak<AINode>,
}

/// The forecast tree to be processed in order to compute the optimal move.
pub struct AITree {
  root: Rc<RefCell<AINode>>,
  first_leaf_per_move: HashMap<PlayerMove, Weak<AINode>>,
}


//------------------------------------------------
// Implementations
//------------------------------------------------

// Inherent

impl AINodeData {

  /// Constructor.
  pub fn new(grid: &Grid<EncodedGrid>, delta_score: u32) -> Self {
    AINodeData {
      grid: *grid,
      delta_score,
    }
  }

  // Getters
  pub fn get_grid(&self) -> &Grid<EncodedGrid> { &self.grid }
  pub fn get_delta_score(&self) -> u32 { self.delta_score }

}

impl AINode {

  /// Constructor.
  pub fn new(data: &AINodeData) -> Self {
    AINode {
      data: *data,
      children: HashMap::new(),
      parent: Weak::new(),
      next_sibling: Weak::new(),
    }
  }
  
  // Getters
  pub fn get_data(&self) -> &AINodeData { &self.data }

  pub fn get_child(&self, player_move: PlayerMove, tile: EntryType, row: usize, col: usize) -> Option<Weak<RefCell<AINode>>> {
    if let Some(child) = self.children.get(&encode_key(player_move, tile, row, col)) {
      Some(Rc::downgrade(&child))
    } else {
      None
    }
  }

  pub fn get_parent(&self) -> Weak<AINode> { Weak::clone(&self.parent) }
  pub fn get_next_sibling(&self) -> Weak<AINode> { Weak::clone(&self.next_sibling) }

  // Setters
  pub fn set_parent(&mut self, node: &Rc<AINode>) { self.parent = Rc::downgrade(node) }
  pub fn set_next_sibling(&mut self, node: &Rc<AINode>) { self.next_sibling = Rc::downgrade(node) }

  /// Adds a new child to the node, already existing nodes are overwritten.
  pub fn add_child(&mut self, player_move: PlayerMove, tile: EntryType, row: usize, col: usize, node: &Rc<RefCell<AINode>>) { 
    self.children.insert(encode_key(player_move, tile, row, col), Rc::clone(node));
  }

  /// Removes a child and returns its value if present, otherwise `None`.
  pub fn remove_child(&mut self, player_move: PlayerMove, tile: EntryType, row: usize, col: usize) -> Option<Rc<RefCell<AINode>>> {
    self.children.remove(&encode_key(player_move, tile, row, col))
  }

}

impl AITree {

  /// Initialize empty tree
  pub fn new(root_data: &AINodeData) -> Self {
    AITree {
      root: Rc::new(RefCell::new(AINode::new(root_data))),
      first_leaf_per_move: HashMap::with_capacity(AVAILABLE_MOVES_COUNT),
    }
  }

  /// This method sets the new root as one of it's children and discards all the other children. 
  /// Returns a `std::rc::Weak` pointer to the new root or `None` if there's no such child.
  fn make_child_root(&mut self, player_move: PlayerMove, tile: EntryType, row: usize, col: usize) {}

  /// This method expands the tree of moves from the leaves down to a required depth
  fn expand(&mut self, depth: usize) {}

}

// TODO: possibly add indexing for path


//------------------------------------------------
// Functions
//------------------------------------------------

/// generates a key for the children encoded as |row|col|tile|move| as with a number of bits of ...|11|11|1|11|.
/// No checks are made on the parameters as it's internal code.
fn encode_key(player_move: PlayerMove, tile: EntryType, row: usize, col: usize) -> usize {

  // encode tile as 2 -> 0, 4 -> 1, this encodes the tile and puts it in the third bit
  let mut key: usize = tile as usize & 4;
  key |= match player_move {
    PlayerMove::Up => 0,
    PlayerMove::Left => 1,
    PlayerMove::Right => 2,
    PlayerMove::Down => 3,
  };
  key |= row << 5;
  key |= col << 3;

  key

}

/// Decodes the children key into (move, tile, row, col).
/// No checks are made on the parameters as it's internal code.
fn decode_key(key: usize) -> (PlayerMove, EntryType, usize, usize) {

  let mut tile: EntryType = 2;
  if key & 4 == 4 { tile = 4; }
  let player_move = match key & 3 {
    0 => PlayerMove::Up,
    2 => PlayerMove::Right,
    3 => PlayerMove::Down,
    _ => PlayerMove::Left,
  };
  let row = (key & 96) >> 5;
  let col = (key & 24) >> 3;

  (player_move, tile, row, col)

}

/// Computes the scores for each heurisitc used to evaluate the utility function
/// Returns: (monotonicity, emptiness, mergeability, maximum_tile)
fn heuristics_scores(grid: &Grid<EncodedGrid>) -> (f64, f64, f64, f64) {
  let (mut inc_h, mut inc_v, mut dec_h, mut dec_v) = (0, 0, 0, 0);
  let mut sequence_completeness = [0; LOG2_VICTORY_THRESHOLD];
  let mut log_entry = 0;
  let mut empty_tiles = 0;
  let mut max_tile = 0;

  let dec_grid = encoding::decode_grid(grid.get_state());

  for j in 0..GRID_SIDE {
    for i in 0..GRID_SIDE {

      // monotonicity
      if j > 0 {
        if dec_grid[i][j] >= dec_grid[i][j - 1] { inc_h += 1; }
        if dec_grid[i][j] <= dec_grid[i][j - 1] { dec_h += 1; }
        if dec_grid[j][i] >= dec_grid[j - 1][i] { inc_v += 1; }
        if dec_grid[j][i] <= dec_grid[j - 1][i] { dec_v += 1; }
      }

      // mergeability
      if dec_grid[i][j] > 0 {
        log_entry = (dec_grid[i][j] as f64).log2() as usize;
        sequence_completeness[log_entry - 1] = log_entry;
      }

      // emptiness
      if dec_grid[i][j] == 0 { empty_tiles += 1; }

      // max tile
      if dec_grid[i][j] > max_tile { max_tile = dec_grid[i][j]; }

    }
  }

  let log_max = (max_tile as f64).log2() as usize;
  let clutter_penalty: f64 = if log_max > 1 {
    sequence_completeness.iter().fold(0., |acc, value| acc + *value as f64)
  } else {
    0.
  };

  ((cmp::max(inc_h, dec_h) + cmp::max(inc_v, dec_v) - TOT_MONOTONICITY_DIVISOR / 2) as f64 / TOT_MONOTONICITY_DIVISOR as f64 * 2., 
    empty_tiles as f64 / (GRID_SIDE * GRID_SIDE - 1) as f64, 
    1. - clutter_penalty * 0.8, 
    log_max as f64 / LOG2_VICTORY_THRESHOLD as f64,
  )
}

/// Computes the utility of a set of heuristics scores
pub fn utility(grid: &Grid<EncodedGrid>) -> f64 {

  0.
}

//------------------------------------------------
// Unit tests
//------------------------------------------------

#[cfg(test)]
mod tests {

  use super::*;


  // Testing encode_key()

  #[test]
  pub fn test_encode_key() {

    // |00|00|0|00| = 0
    assert_eq!(encode_key(PlayerMove::Up, 2, 0, 0), 0);

    // |10|11|1|01| = 93
    assert_eq!(encode_key(PlayerMove::Left, 4, 2, 3), 93);

    // |11|11|0|10| = 122
    assert_eq!(encode_key(PlayerMove::Right, 2, 3, 3), 122);

    // |01|10|1|11| = 55
    assert_eq!(encode_key(PlayerMove::Down, 4, 1, 2), 55);

  }


  // Testing decode_key()

  #[test]
  pub fn test_decode_key() {

    // |00|00|0|00| = 0
    assert_eq!(decode_key(0), (PlayerMove::Up, 2, 0, 0));

    // |10|11|1|01| = 93
    assert_eq!(decode_key(93), (PlayerMove::Left, 4, 2, 3));

    // |11|11|0|10| = 122
    assert_eq!(decode_key(122), (PlayerMove::Right, 2, 3, 3));

    // |01|10|1|11| = 55
    assert_eq!(decode_key(55), (PlayerMove::Down, 4, 1, 2));

  }

}