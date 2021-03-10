//! # `engine` module
//! 
//! This module defines the game logic functionalities.
//! Exposes the Game API to the user.

use std::collections::{VecDeque, HashMap};

use crate::game::core::*;

use super::*;
use moves::*;


//------------------------------------------------
// Types and Definitions
//------------------------------------------------

/// `enum` encoding the status of the `Game`, values are: {`New`, `Playing`, `Over`}.
#[derive(Copy, Clone, PartialEq, Debug)]
pub enum GameStatus {
  New,
  Playing,
  Over,
}

/// The `Game` object that implements the public API.
/// The grid history is a double ended list where states are added to the front and popped from the back when the limit is reached. 
pub struct Game {
  grid: Grid<EncodedGrid>,
  state: GameState,
  history: VecDeque<HistoryItem>,
  precomputed_moves: HashMap<EncodedEntryType, LineStackingResult>,
}

/// The object containing the state of the game. Returned at each move processed.
#[derive(Copy, Clone, PartialEq, Debug)]
pub struct GameState {
  status: GameStatus,
  move_count: u32,
  score: u32,
  victory: bool,
}

/// A struct containing the information necessary to restore the game to a given state
#[derive(Copy, Clone, PartialEq, Debug)]
struct HistoryItem {
  grid: Grid<EncodedGrid>,
  state: GameState,
}

/// This struct contains the animation data returned by each process_move()
pub struct AnimationData {
  stacked_grid: Grid<EncodedGrid>,
  destinations_grid: Grid<DestinationsGrid>,
  tile: EntryType,
  tile_position: (usize, usize),
}


//------------------------------------------------
// Traits
//------------------------------------------------

/// This trait defines the public API available to the user to interact with the game.
pub trait GameAPI {

  // State interaction
  
  /// Get game grid.
  fn get_grid(&self) -> &Grid<EncodedGrid>;

  /// Get game state.
  fn get_state(&self) -> &GameState;


  // Behaviour

  /// Reset the game.
  fn reset(&mut self);

  /// Process the move and return animation data if valid move or valid state.
  fn process_move(&mut self, player_move: PlayerMove) -> Option<AnimationData>;

  /// Undo the last move if possible.
  fn undo_last_move(&mut self);

}


//------------------------------------------------
// Implementations
//------------------------------------------------

// Inherent

impl Game {

  /// Constructor.
  pub fn new() -> Self {

    let mut grid = Grid::new(&[0; GRID_SIDE]);
    add_random_tile(&mut grid);

    Game {
      grid,
      state: GameState::new(),
      history: VecDeque::with_capacity(HISTORY_LENGTH),
      precomputed_moves: moves::make_precomputed_hashmap(),
    }

  }

  // Getters
  pub fn get_precomputed_moves(&self) -> &HashMap<EncodedEntryType, LineStackingResult> { &self.precomputed_moves }
  
}

impl GameState {

  // Base constructor.
  pub fn new() -> Self {
    GameState {
      status: GameStatus::New,
      move_count: 0,
      score: 0,
      victory: false,
    }
  }

  // Getters.
  pub fn get_status(&self) -> GameStatus { self.status }
  pub fn get_move_count(&self) -> u32 { self.move_count }
  pub fn get_score(&self) -> u32 { self.score }
  pub fn get_victory(&self) -> bool { self.victory }

  // Setters.
  fn set_status(&mut self, value: GameStatus) { self.status = value; }
  fn set_victory(&mut self, value: bool) { self.victory = value; }

  // "Increasers"
  fn inc_move_count(&mut self) { self.move_count += 1; }
  fn inc_score(&mut self, delta: u32) { self.score += delta; }

}

impl AnimationData {

  /// Constructor.
  pub fn new(stacked_grid: &Grid<EncodedGrid>, destinations_grid: &Grid<DestinationsGrid>, tile: EntryType, tile_position: (usize, usize)) -> Self {
    AnimationData {
      stacked_grid: *stacked_grid,
      destinations_grid: *destinations_grid,
      tile,
      tile_position,
    }
  }

  // Getters
  pub fn get_stacked_grid(&self) -> &Grid<EncodedGrid> { &self.stacked_grid }
  pub fn get_destinations_grid(&self) -> &Grid<DestinationsGrid> {&self.destinations_grid }
  pub fn get_tile(&self) -> EntryType { self.tile }
  pub fn get_tile_position(&self) -> (usize, usize) { self.tile_position }

}


// GameAPI

impl GameAPI for Game {
  
  fn get_grid(&self) -> &Grid<EncodedGrid> { &self.grid }

  fn get_state(&self) -> &GameState { &self.state }

  fn reset(&mut self) { *self = Game::new() }
  
  fn process_move(&mut self, player_move: PlayerMove) -> Option<AnimationData> {

    match self.state.get_status() {

      // Process move only if not in a terminating state of the game
      GameStatus::New | GameStatus::Playing => {

        let move_result = moves::process_grid_stacking(player_move, &self.grid, &self.precomputed_moves);

        // Process the move only if it produced effects, otherwise it's null and ignored
        if is_effective_move(&move_result) {

          // Append old grid to history 
          if self.history.len() >= HISTORY_LENGTH {
            self.history.pop_back();
          }

          self.history.push_front(HistoryItem {
            grid: self.grid,
            state: self.state,
          });

          // Update grid
          self.grid = *move_result.get_new_grid();

          // Update score
          self.state.inc_score(move_result.get_delta_score());

          // Update move count
          self.state.inc_move_count();

          // Add new random tile. There's always an empty tile after a valid move so no check needed
          let (tile, tile_position) = add_random_tile(&mut self.grid);

          // Update victory. Executed only the first time victory is achieved
          if !self.state.get_victory() && is_victory(&self.grid) {
            self.state.set_victory(true);
          }

          // After adding a tile check if game over
          if is_game_over(&self.grid , &self.precomputed_moves) {
            self.state.set_status(GameStatus::Over);
          
          // otherwise if it's the first valid move of the game set state to playing
          } else if let GameStatus::New = self.state.get_status() {
            self.state.set_status(GameStatus::Playing);
          }
          
          return Some(AnimationData::new(
            move_result.get_new_grid(),
            move_result.get_destination_grid(),
            tile,
            tile_position,
          ));

        }

        // If the move is not effective return None
        None

      },

      // Otherwise do nothing
      _ => None,
    }

  }
  
  fn undo_last_move(&mut self) {

    if self.history.len() > 0 {

      let restored = self.history.pop_front().unwrap();

      self.grid = restored.grid;
      self.state = restored.state;

    }

  }

}


//------------------------------------------------
// Functions
//------------------------------------------------

/// Adds a random tile to the grid (as an out parameter) and returns the tile and position coordinates.
fn add_random_tile(grid: &mut Grid<EncodedGrid>) -> (EntryType, (usize, usize)) {

  // Generate random tile according to the probability of spawning a 2 or a 4
  let mut new_tile: EntryType = 2;
  if rand::random::<f64>() >= PROB_TILE2 {
    new_tile = 4;
  }

  // Get a position among the empty tiles in the grid in "reading order" where we place the new tile
  let position: isize = (rand::random::<f64>() * grid.get_zeros() as f64) as isize;

  grid.add_tile_to_position(new_tile, position);

  (new_tile, (position as usize / GRID_SIDE, position as usize % GRID_SIDE))

}

/// Checks if a game grid is in a victory state 
pub fn is_victory(grid: &Grid<EncodedGrid>) -> bool {

  let mut bit_mask = (ENCODING_BITS as f64).exp2() as EncodedEntryType - 1;

  // Run through each column first to change the bit_mask in O(n) time rather than O(n^2)
  for j in 0..GRID_SIDE {

    for i in 0..GRID_SIDE {

      // check if the masked number shifted back to the least significant bit is greater than or equal to the log2 of the victory threshold
      if (grid.get_state()[i] & bit_mask) >> ENCODING_BITS * j >= (VICTORY_THRESHOLD as f64).log2() as EncodedEntryType {
        return true;
      }
    }
    
    // shift to new column
    bit_mask <<= ENCODING_BITS;
  }

  false
}

/// Checks if the given grid is a terminating state
pub fn is_game_over(grid: &Grid<EncodedGrid>, moves_table: &HashMap<EncodedEntryType, LineStackingResult>) -> bool {

  // Progressive optimization, if at least one entry is zero you can always make a move
  if grid.get_zeros() > 0 { return false; }

  // When the grid is full, if at least one move is possible then it's not game over
  if is_effective_move(&moves::process_grid_stacking(PlayerMove::Up, grid, moves_table)) { return false; }
  if is_effective_move(&moves::process_grid_stacking(PlayerMove::Left, grid, moves_table)) { return false; }
  if is_effective_move(&moves::process_grid_stacking(PlayerMove::Right, grid, moves_table)) { return false; }
  if is_effective_move(&moves::process_grid_stacking(PlayerMove::Down, grid, moves_table)) { return false; }

  // No move is possible, game over
  true
}

/// Checks if the result of a move (not the possible effect of a `PlayerMove`) describes a change in the state of the grid
pub fn is_effective_move(move_result: &MoveStackingResult) -> bool {

  let dest_grid = move_result.get_destination_grid();

  for i in 0..GRID_SIDE {
    for j in 0..GRID_SIDE {
      if dest_grid[i][j] != 0 {
        return true;
      }
    }
  }

  false
}


//------------------------------------------------
// Unit tests
//------------------------------------------------

#[cfg(test)]
mod tests {

  use super::*;


  // Test is_victory()

  #[test]
  pub fn test_is_victory_false() {
    let grid = Grid::from_decoded(&[
      [0, 0, 0, 2],
      [0, 0, 2, 8],
      [0, 0, 4, 8],
      [0, 1024, 4, 4],
    ]);

    assert_eq!(is_victory(&grid), false);
  }

  #[test]
  pub fn test_is_victory_true() {
    let grid = Grid::from_decoded(&[
      [0, 0, 0, 2],
      [0, 0, 2, 8],
      [0, 0, 4, 8],
      [0, 4, 4, 2048],
    ]);

    assert_eq!(is_victory(&grid), true);
  }

  #[test]
  pub fn test_is_victory_on_full_true() {
    let grid = Grid::from_decoded(&[
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 8],
      [4, 2, 2048, 2],
    ]);

    assert_eq!(is_victory(&grid), true);
  }


  // Test is_effective_move()

  #[test]
  pub fn test_is_effective_move_false() {
    let move_result = MoveStackingResult::new(
      &Grid::new(&[0; GRID_SIDE]),
      &Grid::new(&[0; GRID_SIDE]),
      0,
      &Grid::new(&[[0; GRID_SIDE]; GRID_SIDE]),
    );

    assert_eq!(is_effective_move(&move_result), false);
  }

  #[test]
  pub fn test_is_effective_move_true() {
    let move_result = MoveStackingResult::new(
      &Grid::new(&[0; GRID_SIDE]),
      &Grid::new(&[0; GRID_SIDE]),
      0,
      &Grid::new(&[
        [0, -1, 0, 0],
        [0; GRID_SIDE],
        [0; GRID_SIDE],
        [0; GRID_SIDE],
      ]),
    );

    assert_eq!(is_effective_move(&move_result), true);
  }


  // Test is_game_over()

  #[test]
  pub fn test_is_game_over_on_sparse_grid() {
    let grid = Grid::from_decoded(&[
      [0, 4, 4, 8],
      [2, 4, 8, 8],
      [2, 0, 0, 8],
      [2, 2, 8, 8],
    ]);

    assert_eq!(is_game_over(&grid, &moves::make_precomputed_hashmap()), false);
  }

  #[test]
  pub fn test_is_game_over_on_full_non_game_over() {
    let grid = Grid::from_decoded(&[
      [2, 4, 2, 2],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ]);

    assert_eq!(is_game_over(&grid, &moves::make_precomputed_hashmap()), false);
  }

  #[test]
  pub fn test_is_game_over_on_full_game_over() {
    let grid = Grid::from_decoded(&[
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ]);

    assert_eq!(is_game_over(&grid, &moves::make_precomputed_hashmap()), true);
  }

  #[test]
  pub fn test_is_game_over_on_full_game_over2() {
    let grid = Grid::from_decoded(&[
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 8],
      [4, 2, 2048, 2],
    ]);

    assert_eq!(is_game_over(&grid, &make_precomputed_hashmap()), true);
  }


  // Test Game::reset()
  
  #[test]
  pub fn test_game_reset() {
    let mut game = Game {
      grid: Grid::from_decoded(&[
        [2, 4, 2, 2],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [4, 2, 0, 0],
      ]),
      state: GameState {
        status: GameStatus::Playing,
        move_count: 5,
        score: 5000,
        victory: true,
      },
      history: VecDeque::with_capacity(HISTORY_LENGTH),
      precomputed_moves: make_precomputed_hashmap(),
    };

    game.reset();

    assert_eq!(game.get_state().get_status(), GameStatus::New);
    assert_eq!(game.get_state().get_move_count(), 0);
    assert_eq!(game.get_state().get_score(), 0);
    assert_eq!(game.get_state().get_victory(), false);
    assert_eq!(game.history.len(), 0);

  }


  // Test Game::process_move()

  #[test]
  pub fn test_game_process_move_ordinary_state() {
    let mut game = Game {
      grid: Grid::from_decoded(&[
        [2, 4, 2, 2],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [4, 2, 4, 2],
      ]),
      state: GameState {
        status: GameStatus::New,
        move_count: 5,
        score: 5000,
        victory: false,
      },
      history: VecDeque::with_capacity(HISTORY_LENGTH),
      precomputed_moves: make_precomputed_hashmap(),
    };

    game.process_move(PlayerMove::Left);

    assert_eq!(game.get_state().get_status(), GameStatus::Playing);
    assert_eq!(game.get_state().get_move_count(), 6);
    assert_eq!(game.get_state().get_score(), 5004);
    assert_eq!(game.get_state().get_victory(), false);
    assert_eq!(game.history.len(), 1);

  }

  #[test]
  pub fn test_game_process_move_terminating_victory() {
    let mut game = Game {
      grid: Grid::from_decoded(&[
        [2, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 2, 8],
        [4, 2, 1024, 1024],
      ]),
      state: GameState {
        status: GameStatus::Playing,
        move_count: 5,
        score: 10000,
        victory: false,
      },
      history: VecDeque::with_capacity(HISTORY_LENGTH),
      precomputed_moves: make_precomputed_hashmap(),
    };

    game.process_move(PlayerMove::Left);

    assert_eq!(game.get_state().get_status(), GameStatus::Over);
    assert_eq!(game.get_state().get_move_count(), 6);
    assert_eq!(game.get_state().get_score(), 12048);
    assert_eq!(game.get_state().get_victory(), true);
    assert_eq!(game.history.len(), 1);

  }

  #[test]
  pub fn test_game_process_move_history_overflow() {
    let mut game = Game::new();

    use PlayerMove::{Up, Left, Right, Down};
    let player_move = [Up, Left, Right, Down];
    let mut count = 0;

    // Fill history
    while game.history.len() < HISTORY_LENGTH {
      game.process_move(player_move[count % 4]);
      count += 1;
    }

    assert_eq!(game.history.len(), HISTORY_LENGTH);

    // Add some extra moves
    for _ in 0..10 {
      game.process_move(player_move[count % 4]);
      count += 1;
    }

    assert_eq!(game.history.len(), HISTORY_LENGTH);

  }


  // Test Game::undo_last_move()

  #[test]
  pub fn test_undo_last_move_empty() {
    let mut game = Game::new();

    let game_state = HistoryItem {
      grid: game.grid,
      state: game.state,
    };
    
    assert_eq!(game.history.len(), 0);

    game.undo_last_move();

    assert_eq!(game_state, HistoryItem {
      grid: game.grid,
      state: game.state,
    });
    assert_eq!(game.history.len(), 0);

  }

  #[test]
  pub fn test_undo_last_move_full() {
    let mut game = Game::new();

    use PlayerMove::{Up, Left, Right, Down};
    let player_move = [Up, Left, Right, Down];
    let mut count = 0;

    // Fill history
    while game.history.len() < HISTORY_LENGTH {
      game.process_move(player_move[count % 4]);
      count += 1;
    }

    let game_state = HistoryItem {
      grid: game.grid,
      state: game.state,
    };
    let move_count = game.state.get_move_count();

    // Add one extra move, whichever is feasible
    for i in 0..4 {
      game.process_move(player_move[i]);
      if game.state.get_move_count() > move_count { break; }
    }

    game.undo_last_move();

    assert_eq!(game_state, HistoryItem {
      grid: game.grid,
      state: game.state,
    });
    assert_eq!(game.history.len(), HISTORY_LENGTH - 1);

  }

}