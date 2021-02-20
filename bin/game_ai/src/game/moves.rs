/*
This module defines how the stacking of a single row/column is processed. 
All the other possibilities can be acheived through transposition and reversion of a single row or column.
Primarily used to separate game engine logic from precomputation of moves.
*/

use std::io::prelude::*;

use crate::encoding;
use std::collections::HashMap;

use std::fs::File;

const PATH: &str = "../../src/components/game/lib/precomputed.js";
const LARGEST_TILE: u32 = 65536;

use super::{GRID_SIDE, DestinationLine, GridLine};

//////////////////////////////////////////////////
// Single row move processing result
//////////////////////////////////////////////////

pub struct StackingResult {
  prev_line: u32,
  new_line: u32,
  delta_score: u32,
  destinations: DestinationLine,
}

impl StackingResult {

  fn new(prev_line: &GridLine, new_line: &GridLine, delta_score: u32, destinations: &DestinationLine) -> StackingResult {
    StackingResult {
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
  pub fn get_destinations<'a>(&'a self) -> DestinationLine { self.destinations }

  // #[allow(dead_code)]
  // pub fn format_js(&self) -> String {
  //   format!("[{}, {{newRow: {}, ds: {}, destRow: {:?}}}],\n", self.prev_line, self.new_line, self.delta_score, self.destinations)
  // }

  #[allow(dead_code)]
  pub fn format_js_array(&self) -> String {
    format!("[{}, [{}, {}, {:?}]],\n", self.prev_line, self.new_line, self.delta_score, self.destinations)
  }
}

impl Copy for StackingResult {}

impl Clone for StackingResult {
  fn clone(&self) -> Self {
    *self
  }
}

fn process_line(line: &GridLine) -> StackingResult {
  let mut new_line: GridLine = [0; GRID_SIDE];
  let mut destinations: DestinationLine = [0; GRID_SIDE];
  let mut delta_score = 0;
  let mut k = 0;

  for i in 0..4 {

    // move only non-zero tiles
    if line[i] != 0 {

      // if new line current tile equal to old line current tile, merge and point to next current tile in new line
      if new_line[k] == line[i] {
        new_line[k] += line[i];
        delta_score += new_line[k];
        destinations[i] = k as i8 - i as i8;
        k += 1;

      // if not equal
      } else {

        // assign old line's current tile to the first empty slot available in the new line, 
        if new_line[k] != 0 {
          k += 1;
        }
        new_line[k] = line[i];

        destinations[i] = k as i8 - i as i8;
      }

    }

  }

  StackingResult::new(line, &new_line, delta_score, &destinations)
}

//////////////////////////////////////////////////
// Move Precomputation
//////////////////////////////////////////////////

struct AdmissibleValues {
  value: u32,
  prev: u32,
}

impl AdmissibleValues {

  fn new(value: u32) -> AdmissibleValues {
    AdmissibleValues {
      value,
      prev: 0,
    }
  }

}

impl Iterator for AdmissibleValues {
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

enum Store<'a> {
  File(&'a mut File),
  HashMap(&'a mut HashMap<u32, StackingResult>),
}

fn traverse_row<'a>(row: &GridLine, position: usize, store: &mut Store) {
  if position < row.len() {
    for num in AdmissibleValues::new(0) {
      let mut new_row = *row;
      new_row[position] = num;
      traverse_row(&new_row, position + 1, store);
    }
  } else {
    let res = process_line(row);
    if res.get_prev_line() != res.get_new_line() {  
      match store {
        Store::File(f) => {f.write(res.format_js_array().as_bytes()).expect("Error in writing record!"); ()},
        Store::HashMap(hm) => {hm.insert(res.get_prev_line(), res); ()},
      }
    }
  }
}

pub fn make_precomputed_hashmap() -> HashMap<u32, StackingResult> {
  let mut moves_table: HashMap<u32, StackingResult> = HashMap::new();

  //Generate moves
  traverse_row(&[0, 0, 0, 0], 0, &mut Store::HashMap(&mut moves_table));

  moves_table
}


//////////////////////////////////////////////////
// Unit tests
//////////////////////////////////////////////////

#[cfg(test)]
mod tests {
  // Test stacking
  #[test]
  fn stacks_empty_correctly() {
    let res = super::process_line(&[0, 0, 0, 0]);

    assert_eq!(res.new_line, super::encoding::encode_line(&[0, 0, 0, 0]));
  }
  
  #[test]
  fn stacks_some_correctly() {
    let res = super::process_line(&[4, 4, 2, 2]);

    assert_eq!(res.new_line, super::encoding::encode_line(&[8, 4, 0, 0]));
  }
  
  #[test]
  fn stacks_corner_correctly() {
    let res = super::process_line(&[2, 2, 2, 2]);

    assert_eq!(res.new_line, super::encoding::encode_line(&[4, 4, 0, 0]));
  }
  
  #[test]
  fn stacks_gap_correctly() {
    let res = super::process_line(&[2, 0, 2, 0]);

    assert_eq!(res.new_line, super::encoding::encode_line(&[4, 0, 0, 0]));
  }
  
  #[test]
  fn stacks_big_gap_correctly() {
    let res = super::process_line(&[2, 0, 0, 2]);

    assert_eq!(res.new_line, super::encoding::encode_line(&[4, 0, 0, 0]));
  }
  
  #[test]
  fn stacks_gap_and_equal_correctly() {
    let res = super::process_line(&[2, 0, 2, 2]);

    assert_eq!(res.new_line, super::encoding::encode_line(&[4, 2, 0, 0]));
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
}