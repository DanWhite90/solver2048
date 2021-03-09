//! # `core` module
//! 
//! Contains the basic definitions and implementations for the objects used by the AI engine.

use std::cmp;

use crate::encoding;
use crate::game::core::*;
use crate::game::moves::PlayerMove;


//------------------------------------------------
// Types and Definitions
//------------------------------------------------

// AI struct and tree parameters
pub const AVAILABLE_MOVES_COUNT: usize = 4;
pub const DEFAULT_TREE_DEPTH: usize = 6;
pub const TREE_SIZE: usize = AVAILABLE_MOVES_COUNT.pow(DEFAULT_TREE_DEPTH as u32 + 1) - 1; // must satisfy: TREE_SIZE >= AVAILABLE_MOVES_COUNT ** (DEFAULT_TREE_DEPTH + 1) - 1
pub const TREE_SIZE_THRESHOLD: usize = 1200;
pub const MOVE_CHILDREN_ARR_LENGTH: usize = GRID_SIDE.pow(2) * 2;
pub const MOVES_QUEUE_CAPACITY: usize = 20;
pub const PATH_PROBABILITY_THRESHOLD: f64 = 0.25;

// Heuristics and utility parameters
const LOG2_VICTORY_THRESHOLD: usize = 11; // need macro to make it log of VICTORY_THRESHOLD in game core.
const TOT_MONOTONICITY_DIVISOR: usize = GRID_SIDE * (GRID_SIDE - 1) * 2;
const GRID_NUM_GAP_SENSITIVITY: f64 = 0.8;
const MONOTONICITY_WEIGHT: f64 = 0.4; // Monotonicity weight
const EMPTINESS_WEIGHT: f64 = 0.2; // Emptiness weight
const MERGEABILITY_WEIGHT: f64 = 0.15; // Mergeability weight
const HOMOGENEITY_DEGREE: f64 = 8.; // Regulates the growth and concavity/convexity of the utility function

// Bayesian inference parameters
const ALPHA: f64 = 9.;
const BETA: f64 = 1.;


// DATA STRUCTURES

/// Contains all the data required by the AI that needs to be stored in a node in the forecast tree.
#[derive(Copy, Clone, PartialEq, Debug)]
pub struct AINode {
  grid: Grid<EncodedGrid>,
  originating_move: Option<PlayerMove>,
  delta_score: u32,
  path_probability: f64,
  depth: usize,
}

/// Contains the evaluation data for each possible move based on `AINode`s.
pub struct AIMoveEvaluation {
  expected_utility: f64,
  count: usize,
}


//------------------------------------------------
// Implementations
//------------------------------------------------

// Inherent

impl AINode {

  /// Constructor.
  pub fn new(
    grid: &Grid<EncodedGrid>, 
    originating_move: Option<PlayerMove>,
    delta_score: u32,
    path_probability: f64,
    depth: usize
  ) -> Self {
    AINode {
      grid: *grid,
      originating_move,
      delta_score,
      path_probability,
      depth,
    }
  }
  
  // Getters
  pub fn get_grid(&self) -> &Grid<EncodedGrid> { &self.grid }
  pub fn get_originating_move(&self) -> Option<PlayerMove> { self.originating_move }
  pub fn get_delta_score(&self) -> u32 { self.delta_score }
  pub fn get_path_probability(&self) -> f64 { self.path_probability }
  pub fn get_depth(&self) -> usize { self.depth }

}

impl AIMoveEvaluation {

  /// Constructor.
  pub fn new(expected_utility: f64, count: usize) -> Self {
    AIMoveEvaluation {
      expected_utility,
      count,
    }
  }

  // Getters
  pub fn get_expected_utility(&self) -> f64 { self.expected_utility }
  pub fn get_count(&self) -> usize { self.count }

  pub fn inc_expected_utility(&mut self, delta: f64) { self.expected_utility += delta; }
  pub fn inc_count(&mut self) { self.count += 1; }

}

//------------------------------------------------
// Functions
//------------------------------------------------

/// generates a key for the children encoded as |row|col|tile|move| as with a number of bits of ...|11|11|1|11|.
/// No checks are made on the parameters as it's internal code.
#[allow(dead_code)]
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
#[allow(dead_code)]
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

/// Computes the scores for each heurisitc used to evaluate the utility function.
/// Returns: (monotonicity, emptiness, mergeability, maximum_tile).
fn heuristics_scores(grid: &Grid<EncodedGrid>) -> (f64, f64, f64, f64) {
  let (mut inc_h, mut inc_v, mut dec_h, mut dec_v) = (0, 0, 0, 0);
  let mut sequence_completeness = [0; LOG2_VICTORY_THRESHOLD];
  let mut log_entry;
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
    sequence_completeness.iter().fold(0., |acc, value| acc + *value as f64) / (log_max * (log_max + 1) / 2) as f64
  } else {
    0.
  };

  (
    (cmp::max(inc_h, dec_h) + cmp::max(inc_v, dec_v) - TOT_MONOTONICITY_DIVISOR / 2) as f64 / TOT_MONOTONICITY_DIVISOR as f64 * 2., 
    empty_tiles as f64 / (GRID_SIDE * GRID_SIDE) as f64, 
    1. - clutter_penalty * GRID_NUM_GAP_SENSITIVITY, 
    log_max as f64 / LOG2_VICTORY_THRESHOLD as f64,
  )
}

/// Computes the utility of a grid from the set of heuristics scores.
pub fn utility(grid: &Grid<EncodedGrid>) -> f64 {
  let scores = heuristics_scores(grid);

  // If we are not in a winning state
  if scores.3 < 1. {

    // If it's game over value as -Inf
    // if scores.1 == 0. && engine::is_game_over(grid, moves_table) {
    //   return -f64::INFINITY;
    // }

    // Otherwise compute Cobb-Douglas utility
    scores.0.powf(HOMOGENEITY_DEGREE * MONOTONICITY_WEIGHT)
    * scores.1.powf(HOMOGENEITY_DEGREE * EMPTINESS_WEIGHT)
    * scores.2.powf(HOMOGENEITY_DEGREE * MERGEABILITY_WEIGHT)
    * scores.3.powf(HOMOGENEITY_DEGREE * (1. - MONOTONICITY_WEIGHT - EMPTINESS_WEIGHT - MERGEABILITY_WEIGHT))

  // Otherwise we won value Inf
  } else {
    f64::INFINITY
  }

}

/// This function calculates the posterior probability of a 2-tile assuming a Beta likelihood.
pub fn bayes_beta_update(grid: &Grid<EncodedGrid>, moves_count: usize) -> f64 {
  (ALPHA + (2 * (moves_count + 1)) as f64 - 0.5 * grid.get_sum() as f64) / (ALPHA + BETA + moves_count as f64 + 1.)
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


  // Testing heuristics_scores()

  #[test]
  pub fn test_heuristics_scores_low() {
    let grid = Grid::from_decoded(&[
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ]);

    let result = heuristics_scores(&grid);

    assert_eq!(result.0, 0., "Monotonicity");
    assert_eq!(result.1, 0., "Emptiness");
    assert_eq!(result.2, 1. - 1. * GRID_NUM_GAP_SENSITIVITY, "Mergeability");
    assert_eq!(result.3, 2. / LOG2_VICTORY_THRESHOLD as f64, "Maximum tile");
  }

  #[test]
  pub fn test_heuristics_scores_empty() {
    let grid = Grid::from_decoded(&[
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);

    let result = heuristics_scores(&grid);

    assert_eq!(result.0, 1., "Monotonicity");
    assert_eq!(result.1, 1., "Emptiness");
    assert_eq!(result.2, 1., "Mergeability");
    assert_eq!(result.3, 0., "Maximum tile");
  }

  #[test]
  pub fn test_heuristics_scores_high() {
    let grid = Grid::from_decoded(&[
      [8, 4, 2, 0],
      [4, 2, 0, 0],
      [2, 0, 0, 0],
      [0, 0, 0, 0],
    ]);

    let result = heuristics_scores(&grid);

    assert_eq!(result.0, 1., "Monotonicity");
    assert_eq!(result.1, 10. / (GRID_SIDE * GRID_SIDE) as f64, "Emptiness");
    assert_eq!(result.2, 1. - 1. * GRID_NUM_GAP_SENSITIVITY , "Mergeability");
    assert_eq!(result.3, 3. / LOG2_VICTORY_THRESHOLD as f64, "Maximum tile");
  }


  // Testing bayes_beta_update()

  #[test]
  pub fn test_bayes_beta_update_empty() {
    let grid = Grid::from_decoded(&[
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 2],
    ]);

    assert_eq!(bayes_beta_update(&grid, 0), (ALPHA + 1.) / (ALPHA + BETA + 1.));
  }

  #[test]
  pub fn test_bayes_beta_update_late() {
    let grid = Grid::from_decoded(&[
      [128, 4, 2, 4],
      [256, 8, 16, 2],
      [64, 2, 0, 0],
      [8, 0, 0, 0],
    ]);

    let move_count = 220;
    let result = (ALPHA + 2. * (move_count + 1) as f64 - 0.5 * (46. + 64. + 256. + 128.)) / (ALPHA + BETA + move_count as f64 + 1.);

    assert_eq!(bayes_beta_update(&grid, move_count), result);
  }

}