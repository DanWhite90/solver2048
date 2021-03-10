//! # `engine` module
//! 
//! Contains the AI engine that exposes the API to the user.

use std::collections::{VecDeque, HashMap};
use std::thread;
use std::thread::JoinHandle;
use std::sync::mpsc;
use std::sync::mpsc::{Sender, Receiver};

use crate::ai::core::*;
use crate::game::core::*;
use crate::game::moves;
use crate::game::moves::{PlayerMove, LineStackingResult, MoveStackingResult};
use crate::game::engine;
use crate::game::engine::{Game, GameState, AnimationData, GameAPI};


//------------------------------------------------
// Types and Definitions
//------------------------------------------------

/// Describes the possible state of the AI.
#[derive(Copy, Clone)]
pub enum AIState {
  Active,
  Inactive,
}

/// Describes the possible states the worker thread can be in.
enum WorkerState {
  Working,
  Paused,
  Terminating,
}

/// Specifies the messages that can be sent to the worker thread.
#[derive(Copy, Clone)]
enum WorkerMessage {
  Work(Grid<EncodedGrid>),
  Pause,
  Shutdown,
  MoveReceived,
}

/// Specifies the responses that the worker thread can return.
#[derive(Copy, Clone)]
enum WorkerResponse {
  OptimalMove(PlayerMove),
  EmptyBuffer,
  Paused,
}

/// The basic structure of the AI.
/// The AI owns the game and exposes its public API to the user, so only an instance of `AIEngine` is needed to run the full application.
pub struct AIEngine {
  game: Game,
  state: AIState,
  moves_worker: JoinHandle<()>,
  worker_task_sender: Sender<WorkerMessage>,
  worker_response_receiver: Receiver<WorkerResponse>,
}


//------------------------------------------------
// Implementations
//------------------------------------------------

// Inherent

impl AIEngine {

  /// Constructor.
  /// Sets up the initial shared state and communication channels between main thread and moves worker thread.
  pub fn new() -> Self {

    // transmission channels endpoints for full duplex communication between main thread and worker thread
    let (worker_task_sender, worker_task_receiver): (Sender<WorkerMessage>, Receiver<WorkerMessage>) = mpsc::channel();
    let (worker_response_sender, worker_response_receiver): (Sender<WorkerResponse>, Receiver<WorkerResponse>) = mpsc::channel();

    // this worker thread precomputes and buffers a sequence of optimal moves to make the game flow smoother
    let moves_worker = thread::spawn(move || worker_job(worker_task_receiver, worker_response_sender) );

    AIEngine {
      game: Game::new(),
      state: AIState::Inactive,
      moves_worker,
      worker_task_sender,
      worker_response_receiver,
    }
    
  }

  /// Getters
  pub fn get_game(&self) -> &Game { &self.game }
  pub fn get_game_mut(&mut self) -> &mut Game {&mut self.game }
  pub fn get_state(&self) -> AIState { self.state }

  /// Gets the next optimal move enqueued based on the current state of the grid.
  pub fn get_optimal_move(&self) -> Option<PlayerMove> {

    unimplemented!("Need to implement optimal move getter from worker messages");

  }

  /// Toggle the AI and return the new state.
  pub fn toggle_ai(&mut self) -> AIState {

    use AIState::{Active, Inactive};

    match self.state {
      Active => {
        // should always be able to send
        self.worker_task_sender.send(WorkerMessage::Pause).unwrap();
        self.state = Inactive;
      },
      Inactive => {
        // should always be able to send
        self.worker_task_sender.send(WorkerMessage::Work(*self.game.get_grid())).unwrap();
        self.state = Inactive;
      },
    }

    self.state
  }

}


// GameAPI

impl GameAPI for AIEngine {

  fn get_grid(&self) -> &Grid<EncodedGrid> { &self.game.get_grid() }

  fn get_state(&self) -> &GameState { &self.game.get_state() }

  fn reset(&mut self) { 
    self.game.reset();
    
    // add stopping ai if reset

    unimplemented!()
  }

  fn process_move(&mut self, player_move: PlayerMove) -> Option<AnimationData> {

    // process move manually only if the AI is not active

    unimplemented!()
  }

  fn undo_last_move(&mut self) {

    // process undoing only if the AI is not active (or undo and stop the AI)

    unimplemented!()
  }

}


// Drop

impl Drop for AIEngine {

  fn drop(&mut self) {

  }

}


//------------------------------------------------
// Functions
//------------------------------------------------

/// This function generates the leaves of the forecast tree.
fn generate_leaves(
  grid: &Grid<EncodedGrid>, 
  move_count: usize, 
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

  // generate nodes in a Breadth-First fashion to reach the sequence of leaves
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

                // make both 2 and 4 tile using the log2 versions [1, 2] to manipulate encoded grid directly
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
                  if current_depth != new_node.get_depth() && (queue.len() > TREE_SIZE_THRESHOLD || new_node.get_depth() > max_depth) {
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

/// this function calculates the optimal move given an initial state
fn calculate_optimal_move(
  grid: &Grid<EncodedGrid>, 
  move_count: usize, 
  max_depth: usize, 
  precomputed_moves: &HashMap<EncodedEntryType, LineStackingResult>
) -> Option<PlayerMove> {

  use PlayerMove::{Up, Left, Right, Down};
  
  let leaves = generate_leaves(grid, move_count, max_depth, precomputed_moves);

  // if empty tree or just root no move can be made so return None
  if leaves.len() == 0 || leaves[0].get_depth() == 0 {
    return None;
  }

  let mut optimal_move: Option<PlayerMove> = None;
  let mut moves_utilities = HashMap::<PlayerMove, AIMoveEvaluation>::with_capacity(AVAILABLE_MOVES_COUNT);

  // initialize evaluation data for each move
  moves_utilities.insert(Up, AIMoveEvaluation::new(0., 0));
  moves_utilities.insert(Left, AIMoveEvaluation::new(0., 0));
  moves_utilities.insert(Right, AIMoveEvaluation::new(0., 0));
  moves_utilities.insert(Down, AIMoveEvaluation::new(0., 0));

  let mut direction: PlayerMove;
  let mut utility_data_ref: &mut AIMoveEvaluation;

  // evaluate each leaf
  for node in leaves.iter() {
    direction = node.get_originating_move().unwrap();
    utility_data_ref = moves_utilities.get_mut(&direction).unwrap();

    utility_data_ref.inc_expected_utility(node.get_path_probability() * utility(node.get_grid()));
    utility_data_ref.inc_count();
  }

  let mut max_utility = -f64::INFINITY;
  let mut move_utility: f64;

  // normalize the evaluation and find best move
  for (direction, data) in moves_utilities {
    move_utility = data.get_expected_utility() / match data.get_count() {
      0 => 1.,
      count => (count as f64) / (count as f64 + 1.).ln(),
    };

    if data.get_count() > 0 && move_utility > max_utility {
      max_utility = move_utility;
      optimal_move = Some(direction);
    }
  }

  optimal_move
}

/// Defines the job of the moves worker.
fn worker_job(tasks: Receiver<WorkerMessage>, responses: Sender<WorkerResponse>) {

  use WorkerMessage::{Work, Pause, Shutdown, MoveReceived};
  use WorkerState::{Paused, Working, Terminating};

  let mut buffered_count = 0; // keeps track of how many moves have been sent to the main thread without an acknowledgement.
  let mut current_grid: Grid<EncodedGrid>;
  let mut worker_state = WorkerState::Paused;

  loop {

    // Check if there are messages from the main before working
    for message in tasks.try_iter() {
      match message {
        Work(grid) => current_grid = grid,
        Pause => {
          worker_state = Paused;
          buffered_count = 0;
        },
        MoveReceived => {
          if buffered_count > 0 { buffered_count -= 1; }
        },
        Shutdown => worker_state = Terminating,
      }
    }

    // Start executing tasks
    match worker_state {
      Paused => thread::yield_now(),
      Working => {
        // process move while buffer below threshold
        // increase buffer count
        // send response to main
      },
      Terminating => break,
    }

  }

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


  // Testing calculate_optimal_move()

  #[test]
  pub fn test_calculate_optimal_move() {

    let precomputed_moves = moves::make_precomputed_hashmap();

    let grid = Grid::from_decoded(&[
      [4, 2, 4, 2],
      [8, 512, 64, 4],
      [1024, 265, 32, 16],
      [64, 8, 8, 2],
    ]);

    let move_count = 909;

    assert_eq!(calculate_optimal_move(&grid, move_count, DEFAULT_TREE_DEPTH, &precomputed_moves), Some(PlayerMove::Left));
  }

}