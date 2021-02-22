//! # `moves` module
//! 
//! This module defines the core functioning of the game moves.
//! Primarily used to separate game engine logic from precomputation of moves.

use std::collections::HashMap;

use super::*;


//------------------------------------------------
// Types and Definitions
//------------------------------------------------

const LARGEST_TILE: u32 = 65536;

/// Struct used as an iterable object to provide all the allowed values (powers of 2) for a tile from 0 to `LARGEST_TILE`.
struct AdmissibleTileValue {
  value: u32,
  prev: u32,
}


//------------------------------------------------
// Implementations
//------------------------------------------------

impl AdmissibleTileValue {

  fn new(value: u32) -> AdmissibleTileValue {
    AdmissibleTileValue {
      value,
      prev: 0,
    }
  }

}

impl Iterator for AdmissibleTileValue {
  type Item = u32;

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
fn process_line(line: &Row<GameGridPrimitive>) -> LineStackingResult {
  let mut new_line: Row<GameGridPrimitive> = [0; GRID_SIDE];
  let mut destinations: Row<DestGridPrimitive> = [0; GRID_SIDE];
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
fn traverse_row(row: &Row<GameGridPrimitive>, position: usize, moves_table: &mut HashMap<u32, LineStackingResult>) {

  if position < row.len() {

    // loop through all the admissible values for each tile position in the row
    for num in AdmissibleTileValue::new(0) {
      let mut new_row = *row;
      new_row[position] = num;
      traverse_row(&new_row, position + 1, moves_table);
    }

  // when all the tiles in a single row are defined (base case), process the row and store the result
  } else {
    let res = process_line(row);

    // Store only effectful moves, ineffectful moves always return the same state, 0 score, and no displacement
    if res.get_prev_line() != res.get_new_line() {  
      moves_table.insert(res.get_prev_line(), res);
    }

  }
}

/// Generates the `HashMap` of precomputed single-row moves required to speed up the processing of full-grid moves.
pub fn make_precomputed_hashmap() -> HashMap<u32, LineStackingResult> {
  let mut moves_table: HashMap<u32, LineStackingResult> = HashMap::new();

  //Generate moves
  traverse_row(&[0, 0, 0, 0], 0, &mut moves_table);

  moves_table
}

/// Process the entire `Grid` 
pub fn process_move(player_move: PlayerMove, mut grid: GameGrid, moves_table: &HashMap<u32, LineStackingResult>) -> MoveResult {
  let prev_grid = grid;
  let mut tot_delta_score: u32 = 0;
  let mut dest_grid: Grid<DestGridPrimitive> = [[0; GRID_SIDE]; GRID_SIDE];

  println!("\nInitial state:\n{:?}\n", grid.get_decoded_state());

  // normalize to only operate on left moves
  match player_move {
    PlayerMove::Up => { grid.transpose(); () },
    PlayerMove::Left => (),
    PlayerMove::Right => { grid.reverse(); () },
    PlayerMove::Down => { grid.transpose().reverse(); () },
  };

  println!("\nAfter normalization:\n{:?}\n", grid.get_decoded_state());

  // find new state from move_table
  for i in 0..GRID_SIDE {

    // process each row if in table, else it means that it had no effect so the old value is kept 
    if moves_table.contains_key(&prev_grid.encoded_state[i]) {
      let result = moves_table.get(&prev_grid.encoded_state[i]).unwrap();

      grid.encoded_state[i] = result.get_new_line();
      tot_delta_score += result.get_delta_score();
      dest_grid[i] = result.get_destinations();
    }

  }

  println!("\nAfter matching moves transition:\n{:?}\n", grid.get_decoded_state());

  // restore grid
  match player_move {
    PlayerMove::Up => grid.transpose(),
    PlayerMove::Left => &mut grid,
    PlayerMove::Right => grid.reverse(),
    PlayerMove::Down => grid.reverse().transpose(),
  };

  println!("\nFinal state:\n{:?}\n", grid.get_decoded_state());

  MoveResult::new(prev_grid.get_encoded_state(), grid.get_encoded_state(), tot_delta_score, dest_grid)
}















impl GridLike for GameGrid {}

impl LineStackingResult {

  fn new(prev_line: &Row<GameGridPrimitive>, new_line: &Row<GameGridPrimitive>, delta_score: u32, destinations: &Row<DestGridPrimitive>) -> LineStackingResult {
    LineStackingResult {
      prev_line: encoding::encode_line(prev_line),
      new_line: encoding::encode_line(new_line),
      delta_score,
      destinations: *destinations,
    }
  }

  // Getters
  pub fn get_prev_line(&self) -> u32 { self.prev_line }
  pub fn get_new_line(&self) -> u32 { self.new_line }
  pub fn get_delta_score(&self) -> u32 { self.delta_score }
  pub fn get_destinations<'a>(&'a self) -> Row<DestGridPrimitive> { self.destinations }

  #[allow(dead_code)]
  /// Formats stacking result into a valid JavaScript array declaration, to insert into `Map()` API.
  pub fn format_js_array(&self) -> String {
    format!("[{}, [{}, {}, {:?}]],\n", self.prev_line, self.new_line, self.delta_score, self.destinations)
  }
}

impl GameGrid {

  pub fn new(tiles: &Grid<GameGridPrimitive>) -> GameGrid {
    // validation ignored for performance

    let state: EncodedGrid = encoding::encode_grid(tiles);

    GameGrid {encoded_state: state}
  }

  // Getters
  pub fn get_encoded_state(&self) -> EncodedGrid {
    self.encoded_state
  }

  pub fn get_decoded_state(&self) -> Grid<GameGridPrimitive> {
    let mut decoded_grid: Grid<GameGridPrimitive> = [[0; GRID_SIDE]; GRID_SIDE];

    for (i, &encoded_line) in self.encoded_state.iter().enumerate() {
      decoded_grid[i] = encoding::decode_line(encoded_line);
    }

    decoded_grid
  }

  // Other features

  pub fn transpose(&mut self) -> &mut Self {

    let mut decoded_grid: Grid<GameGridPrimitive> = self.get_decoded_state();

    let mut tmp: u32;
    for i in 0..GRID_SIDE {
      for j in (i + 1)..GRID_SIDE {
        tmp = decoded_grid[i][j];
        decoded_grid[i][j] = decoded_grid[j][i];
        decoded_grid[j][i] = tmp;
      }
    }
    
    self.encoded_state = encoding::encode_grid(&decoded_grid);

    self
  }

  pub fn reverse(&mut self) -> &mut Self {

    let mut decoded_grid: Grid<GameGridPrimitive> = self.get_decoded_state();

    let mut tmp: u32;
    for i in 0..GRID_SIDE {
      for j in 0..(GRID_SIDE / 2) {
        tmp = decoded_grid[i][j];
        decoded_grid[i][j] = decoded_grid[i][GRID_SIDE - 1 - j];
        decoded_grid[i][GRID_SIDE - 1 - j] = tmp;
      }
    }
    
    self.encoded_state = encoding::encode_grid(&decoded_grid);

    self
  }

}


impl MoveResult {

  pub fn new(prev: EncodedGrid, new: EncodedGrid, delta: u32, dest: Grid<DestGridPrimitive>) -> Self {
    MoveResult {
      prev_grid: prev,
      new_grid: new,
      delta_score: delta,
      destination_grid: dest,
    }
  }

  // Getters
  pub fn get_prev_grid(&self) -> EncodedGrid { self.prev_grid }
  pub fn get_new_grid(&self) -> EncodedGrid { self.new_grid }
  pub fn get_delta_score(&self) -> u32 { self.delta_score }
  pub fn get_destination_grid(&self) -> Grid<DestGridPrimitive> { self.destination_grid }

}













//------------------------------------------------
// Unit tests
//------------------------------------------------

#[cfg(test)]
mod tests {

  use super::*;


  // Test stacking
  #[test]
  fn stacks_empty_correctly() {
    let res = super::process_line(&[0, 0, 0, 0]);

    assert_eq!(res.new_line, encoding::encode_line(&[0, 0, 0, 0]));
  }
  
  #[test]
  fn stacks_some_correctly() {
    let res = super::process_line(&[4, 4, 2, 2]);

    assert_eq!(res.new_line, encoding::encode_line(&[8, 4, 0, 0]));
  }
  
  #[test]
  fn stacks_corner_correctly() {
    let res = super::process_line(&[2, 2, 2, 2]);

    assert_eq!(res.new_line, encoding::encode_line(&[4, 4, 0, 0]));
  }
  
  #[test]
  fn stacks_gap_correctly() {
    let res = super::process_line(&[2, 0, 2, 0]);

    assert_eq!(res.new_line, encoding::encode_line(&[4, 0, 0, 0]));
  }
  
  #[test]
  fn stacks_big_gap_correctly() {
    let res = super::process_line(&[2, 0, 0, 2]);

    assert_eq!(res.new_line, encoding::encode_line(&[4, 0, 0, 0]));
  }
  
  #[test]
  fn stacks_gap_and_equal_correctly() {
    let res = super::process_line(&[2, 0, 2, 2]);

    assert_eq!(res.new_line, encoding::encode_line(&[4, 2, 0, 0]));
  }

  // Test scoring
  #[test]
  fn computes_null_score_correctly() {
    let res = super::process_line(&[8, 4, 2, 0]);

    assert_eq!(res.delta_score, 0);
  }

  #[test]
  fn computes_corner_score_correctly() {
    let res = super::process_line(&[4, 4, 4, 4]);

    assert_eq!(res.delta_score, 16);
  }

  #[test]
  fn computes_large_score_correctly() {
    let res = super::process_line(&[32768, 32768, 2, 2]);

    assert_eq!(res.delta_score, 65540);
  }

  // Test moving
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


  // Test full grid

  #[test]
  pub fn test_grid_transpose() {
    let mut grid: GameGrid = GameGrid::new(&[
      [0, 2, 4, 8],
      [4, 4, 4, 4],
      [8, 8, 4, 4],
      [8, 4, 2, 2],
    ]);

    let res: GameGrid = GameGrid::new(&[
      [0, 4, 8, 8],
      [2, 4, 8, 4],
      [4, 4, 4, 2],
      [8, 4, 4, 2],
    ]);

    assert_eq!(grid.transpose().encoded_state, res.encoded_state);
  }

  #[test]
  pub fn test_grid_reverse() {
    let mut grid: GameGrid = GameGrid::new(&[
      [0, 2, 4, 8],
      [4, 4, 4, 4],
      [8, 8, 4, 4],
      [8, 4, 2, 2],
    ]);

    let res: GameGrid = GameGrid::new(&[
      [8, 4, 2, 0],
      [4, 4, 4, 4],
      [4, 4, 8, 8],
      [2, 2, 4, 8],
    ]);

    assert_eq!(grid.reverse().encoded_state, res.encoded_state);
  }


  // process_move()

  #[test]
  pub fn test_up_move() {
    let moves_table: HashMap<u32, LineStackingResult> = crate::game::moves::make_precomputed_hashmap();

    let grid: GameGrid = GameGrid::new(&[
      [0, 2, 2, 0],
      [2, 2, 2, 2],
      [0, 0, 4, 0],
      [8, 0, 4, 2],
    ]);

    let new_grid: GameGrid = GameGrid::new(&[
      [2, 4, 4, 4],
      [8, 0, 8, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);

    let dest_grid: Grid<DestGridPrimitive> = [
      [0, 0, 0, 0],
      [-1, -1, -1, -1],
      [0, 0, -1, 0],
      [-2, 0, -2, -1],
    ];

    let result: MoveResult = process_move(PlayerMove::Up, grid, &moves_table);

    assert_eq!(result.get_new_grid(), new_grid.get_encoded_state());
    assert_eq!(result.get_delta_score(), 20);
    assert_eq!(result.get_destination_grid(), dest_grid);
  }

  #[test]
  #[ignore]
  pub fn test_down_move() {
    let moves_table: HashMap<u32, LineStackingResult> = crate::game::moves::make_precomputed_hashmap();

    let grid: GameGrid = GameGrid::new(&[
      [0, 2, 2, 0],
      [2, 2, 2, 2],
      [0, 0, 4, 0],
      [8, 0, 4, 2],
    ]);

    let new_grid: GameGrid = GameGrid::new(&[
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [2, 0, 4, 0],
      [8, 4, 8, 4],
    ]);

    let dest_grid: Grid<DestGridPrimitive> = [
      [0, 3, 2, 0],
      [1, 2, 1, 2],
      [0, 0, 1, 0],
      [0, 0, 0, 0],
    ];

    let result: MoveResult = process_move(PlayerMove::Down, grid, &moves_table);

    assert_eq!(result.get_new_grid(), new_grid.get_encoded_state());
    assert_eq!(result.get_delta_score(), 20);
    assert_eq!(result.get_destination_grid(), dest_grid);
  }
}