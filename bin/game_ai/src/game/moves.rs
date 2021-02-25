//! # `moves` module
//! 
//! This module defines the core functioning of the game moves.
//! Primarily used to separate game engine logic from precomputation of moves.

use std::collections::HashMap;

use crate::core::*;
use crate::encoding;
use super::*;


//------------------------------------------------
// Types and Definitions
//------------------------------------------------

const LARGEST_TILE: EntryType = 65536;

/// Struct used as an iterable object to provide all the allowed values (powers of 2) for a tile from 0 to `LARGEST_TILE`.
struct AdmissibleTileValue {
  value: EntryType,
  prev: EntryType,
}

/// Contains the information regarding the encoded processing of the move for a single row in the grid.
/// All the values are encoded where possible.
pub struct LineStackingResult {
  prev_line: EncodedEntryType,
  new_line: EncodedEntryType,
  delta_score: u32,
  destinations: Array1D<DestEntryType>,
}

/// Contains the information regarding the encoded processing of the move for the entire grid.
/// All the values are encoded where possible.
pub struct MoveResult {
  prev_grid: Grid<EncodedGrid>,
  new_grid: Grid<EncodedGrid>,
  delta_score: u32,
  destination_grid: Grid<DestinationsGrid>,
}


//------------------------------------------------
// Implementations
//------------------------------------------------


// Inherent

impl AdmissibleTileValue {

  fn new(value: EntryType) -> AdmissibleTileValue {
    AdmissibleTileValue {
      value,
      prev: 0,
    }
  }

}

impl LineStackingResult {

  pub fn new(prev_line: &Array1D<EntryType>, new_line: &Array1D<EntryType>, delta_score: u32, destinations: &Array1D<DestEntryType>) -> Self {
    LineStackingResult {
      prev_line: encoding::encode_line(prev_line),
      new_line: encoding::encode_line(new_line),
      delta_score,
      destinations: *destinations,
    }
  }

  // Getters

  pub fn get_prev_line(&self) -> EncodedEntryType { self.prev_line }
  pub fn get_new_line(&self) -> EncodedEntryType { self.new_line }
  pub fn get_delta_score(&self) -> u32 { self.delta_score }
  pub fn get_destinations(& self) -> Array1D<DestEntryType> { self.destinations }

  #[allow(dead_code)]
  /// Formats stacking result into a valid JavaScript array declaration, to insert into `Map()` API.
  pub fn format_js_array(&self) -> String {
    format!("[{}, [{}, {}, {:?}]],\n", self.prev_line, self.new_line, self.delta_score, self.destinations)
  }
}

impl MoveResult {

  pub fn new(prev: &Grid<EncodedGrid>, new: &Grid<EncodedGrid>, delta: u32, dest: Grid<DestinationsGrid>) -> Self {
    MoveResult {
      prev_grid: *prev,
      new_grid: *new,
      delta_score: delta,
      destination_grid: dest,
    }
  }

  // Getters
  pub fn get_prev_grid(&self) -> Grid<EncodedGrid> { self.prev_grid }
  pub fn get_new_grid(&self) -> Grid<EncodedGrid> { self.new_grid }
  pub fn get_delta_score(&self) -> u32 { self.delta_score }
  pub fn get_destination_grid(&self) -> Grid<DestinationsGrid> { self.destination_grid }

}


// Iterator

impl Iterator for AdmissibleTileValue {
  type Item = EntryType;

  fn next(&mut self) -> Option<Self::Item> {

    if self.value <= LARGEST_TILE {
      self.prev = self.value;
      if self.value == 0 {
        self.value = 2;
      } else {
        self.value *= 2;
      }
      Some(self.prev)
    } else {
      None
    }
  }
}


//------------------------------------------------
// Functions
//------------------------------------------------

/// Stacks a single row to the left according to the 2048 game rules.
fn process_line(line: &Array1D<EntryType>) -> LineStackingResult {
  let mut new_line: Array1D<EntryType> = [0; GRID_SIDE];
  let mut destinations: Array1D<DestEntryType> = [0; GRID_SIDE];
  let mut delta_score = 0;
  let mut k = 0;

  for i in 0..4 {

    // move only non-zero tiles
    if line[i] != 0 {

      // if current tile in new line is equal to current tile in old line, merge and point to next current tile in new line
      if new_line[k] == line[i] {
        new_line[k] += line[i];
        delta_score += new_line[k];
        destinations[i] = k as i8 - i as i8;
        k += 1;

      } else {

        // assign old line's current tile to the first empty slot available in the new line from the left, and update movement displacement
        if new_line[k] != 0 {
          k += 1;
        }
        new_line[k] = line[i];

        destinations[i] = k as i8 - i as i8;
      }

    }

  }

  LineStackingResult::new(line, &new_line, delta_score, &destinations)
}

/// Function that recursively generates only and all the admissible row states to be encoded and saved in a `HashMap`.
/// The definition allows to avoid nesting n loops for n the length of a row, and is applicable to any row length.
fn traverse_row(row: &Array1D<EntryType>, position: usize, moves_table: &mut HashMap<EncodedEntryType, LineStackingResult>) {

  if position < row.len() {

    // loop through all the admissible values for each tile position in the row
    for num in AdmissibleTileValue::new(0) {
      let mut new_row = *row;
      new_row[position] = num;
      traverse_row(&new_row, position + 1, moves_table);
    }

  // when all the tiles in a single row are chosen (base case), process the row and store the result
  } else {
    let res = process_line(row);

    // Store only effectful moves, ineffectful moves always return the same state, 0 score, and no displacement
    if res.get_prev_line() != res.get_new_line() {  
      moves_table.insert(res.get_prev_line(), res);
    }

  }
}

/// Generates the `HashMap` of precomputed single-row moves required to speed up the processing of full-grid moves.
pub fn make_precomputed_hashmap() -> HashMap<EncodedEntryType, LineStackingResult> {
  let mut moves_table: HashMap<EncodedEntryType, LineStackingResult> = HashMap::new();

  //Generate moves
  traverse_row(&[0, 0, 0, 0], 0, &mut moves_table);

  moves_table
}

/// Process the entire `GameGrid` stacking after a move is made 
pub fn process_move(player_move: PlayerMove, grid: Grid<EncodedGrid>, moves_table: &HashMap<EncodedEntryType, LineStackingResult>) -> MoveResult {
  let mut new_grid = grid;
  let mut tot_delta_score: u32 = 0;
  let mut dest_grid = Grid::<DestinationsGrid>::new(&[[0; GRID_SIDE]; GRID_SIDE]);

  // TODO: IMPLEMENT EFFICIENT TRANSPOSITION AND REVERSION IN GAME GRID FROM ENCODED TO ENCODED DIRECTLY





  // The search key in the HashMap has to encode also possible transpositions and reversions so it must constructed first 
  let mut key: EncodedEntryType = 0;

  // find new state from move_table
  for i in 0..GRID_SIDE {

    // key construction

    // process each row if in table, else it means that it had no effect so the old value is kept 
    if moves_table.contains_key(&grid[i]) {
      let result = moves_table.get(&grid[i]).unwrap();

      new_grid[i] = result.get_new_line();
      tot_delta_score += result.get_delta_score();
      dest_grid[i] = result.get_destinations();
    }

  }

  // process also destinations grid
  match player_move {
    PlayerMove::Up => {
      dest_grid.transpose();
    },
    PlayerMove::Left => (),
    PlayerMove::Right => {
      dest_grid.reverse().change_sign();
    },
    PlayerMove::Down => {
      dest_grid.reverse().transpose().change_sign();
    },
  };

  MoveResult::new(&grid, &new_grid, tot_delta_score, dest_grid)
}


//------------------------------------------------
// Unit tests
//------------------------------------------------

#[cfg(test)]
mod tests {

  use super::*;


  // Test single row stacking

  #[test]
  fn stacks_empty_correctly() {
    let res = process_line(&[0, 0, 0, 0]);

    assert_eq!(res.new_line, encoding::encode_line(&[0, 0, 0, 0]));
  }
  
  #[test]
  fn stacks_some_correctly() {
    let res = process_line(&[4, 4, 2, 2]);

    assert_eq!(res.new_line, encoding::encode_line(&[8, 4, 0, 0]));
  }
  
  #[test]
  fn stacks_corner_correctly() {
    let res = process_line(&[2, 2, 2, 2]);

    assert_eq!(res.new_line, encoding::encode_line(&[4, 4, 0, 0]));
  }
  
  #[test]
  fn stacks_gap_correctly() {
    let res = process_line(&[2, 0, 2, 0]);

    assert_eq!(res.new_line, encoding::encode_line(&[4, 0, 0, 0]));
  }
  
  #[test]
  fn stacks_big_gap_correctly() {
    let res = process_line(&[2, 0, 0, 2]);

    assert_eq!(res.new_line, encoding::encode_line(&[4, 0, 0, 0]));
  }
  
  #[test]
  fn stacks_gap_and_equal_correctly() {
    let res = process_line(&[2, 0, 2, 2]);

    assert_eq!(res.new_line, encoding::encode_line(&[4, 2, 0, 0]));
  }


  // Test single row scoring

  #[test]
  fn computes_null_score_correctly() {
    let res = process_line(&[8, 4, 2, 0]);

    assert_eq!(res.delta_score, 0);
  }

  #[test]
  fn computes_corner_score_correctly() {
    let res = process_line(&[4, 4, 4, 4]);

    assert_eq!(res.delta_score, 16);
  }

  #[test]
  fn computes_large_score_correctly() {
    let res = process_line(&[32768, 32768, 2, 2]);

    assert_eq!(res.delta_score, 65540);
  }


  // Test single row moving destinations

  #[test]
  fn computes_null_movement_correctly() {
    let res = super::process_line(&[8, 4, 2, 0]);

    assert_eq!(res.destinations, [0, 0, 0, 0]);
  }

  #[test]
  fn computes_corner_movement_correctly() {
    let res = super::process_line(&[4, 4, 4, 4]);

    assert_eq!(res.destinations, [0, -1, -1, -2]);
  }

  #[test]
  fn computes_sparse_movement_correctly() {
    let res = super::process_line(&[4, 0, 2, 2]);

    assert_eq!(res.destinations, [0, 0, -1, -2]);
  }


  // Test full move results

  #[test]
  pub fn test_up_move() {
    let moves_table = make_precomputed_hashmap();

    let grid = Grid::new_from_decoded(&[
      [0, 2, 2, 0],
      [2, 2, 2, 2],
      [0, 0, 4, 0],
      [8, 0, 4, 2],
    ]);

    let new_grid = Grid::new_from_decoded(&[
      [2, 4, 4, 4],
      [8, 0, 8, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);

    let dest_grid = Grid::<DestinationsGrid>::new(&[
      [0, 0, 0, 0],
      [-1, -1, -1, -1],
      [0, 0, -1, 0],
      [-2, 0, -2, -3],
    ]);

    let result = process_move(PlayerMove::Up, grid, &moves_table);

    assert_eq!(*result.get_new_grid().get_state(), *new_grid.get_state(), "\n{}{}\n", result.get_new_grid(), new_grid);
    assert_eq!(result.get_delta_score(), 20);
    assert_eq!(result.get_destination_grid(), dest_grid);
  }

  #[test]
  pub fn test_left_move() {
    let moves_table = make_precomputed_hashmap();

    let grid = Grid::new_from_decoded(&[
      [0, 2, 2, 0],
      [2, 2, 2, 2],
      [0, 0, 4, 0],
      [8, 0, 4, 2],
    ]);

    let new_grid = Grid::new_from_decoded(&[
      [4, 0, 0, 0],
      [4, 4, 0, 0],
      [4, 0, 0, 0],
      [8, 4, 2, 0],
    ]);

    let dest_grid = Grid::<DestinationsGrid>::new(&[
      [0, -1, -2, 0],
      [0, -1, -1, -2],
      [0, 0, -2, 0],
      [0, 0, -1, -1],
    ]);

    let result: MoveResult = process_move(PlayerMove::Left, grid, &moves_table);

    assert_eq!(*result.get_new_grid().get_state(), *new_grid.get_state(), "\n{}{}\n", result.get_new_grid(), new_grid);
    assert_eq!(result.get_delta_score(), 12);
    assert_eq!(result.get_destination_grid(), dest_grid);
  }

  #[test]
  pub fn test_right_move() {
    let moves_table = make_precomputed_hashmap();

    let grid = Grid::new_from_decoded(&[
      [0, 2, 2, 0],
      [2, 2, 2, 2],
      [0, 0, 4, 0],
      [8, 0, 4, 2],
    ]);

    let new_grid = Grid::new_from_decoded(&[
      [0, 0, 0, 4],
      [0, 0, 4, 4],
      [0, 0, 0, 4],
      [0, 8, 4, 2],
    ]);

    let dest_grid = Grid::<DestinationsGrid>::new(&[
      [0, 2, 1, 0],
      [2, 1, 1, 0],
      [0, 0, 1, 0],
      [1, 0, 0, 0],
    ]);

    let result: MoveResult = process_move(PlayerMove::Right, grid, &moves_table);

    assert_eq!(*result.get_new_grid().get_state(), *new_grid.get_state(), "\n{}{}\n", result.get_new_grid(), new_grid);
    assert_eq!(result.get_delta_score(), 12);
    assert_eq!(result.get_destination_grid(), dest_grid);
  }

  #[test]
  pub fn test_down_move() {
    let moves_table = make_precomputed_hashmap();

    let grid = Grid::new_from_decoded(&[
      [0, 2, 2, 0],
      [2, 2, 2, 2],
      [0, 0, 4, 0],
      [8, 0, 4, 2],
    ]);

    let new_grid = Grid::new_from_decoded(&[
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [2, 0, 4, 0],
      [8, 4, 8, 4],
    ]);

    let dest_grid = Grid::<DestinationsGrid>::new(&[
      [0, 3, 2, 0],
      [1, 2, 1, 2],
      [0, 0, 1, 0],
      [0, 0, 0, 0],
    ]);

    let result: MoveResult = process_move(PlayerMove::Down, grid, &moves_table);

    assert_eq!(*result.get_new_grid().get_state(), *new_grid.get_state(), "\n{}{}\n", result.get_new_grid(), new_grid);
    assert_eq!(result.get_delta_score(), 20);
    assert_eq!(result.get_destination_grid(), dest_grid);
  }
}