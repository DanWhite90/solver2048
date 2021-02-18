/*
This module defines how moves are generated in a single row. 
All the other possibilities can be acheived through transposition and reversion of a single row or column.
Primarily used to separate game engine logic from precomputation of moves.
*/

use crate::encoding;

pub struct StackingResult {
  pub prev_line: u32,
  pub new_line: u32,
  pub delta_score: u32,
  pub destinations: Vec<i8>,
}

impl StackingResult {

  #[allow(dead_code)]
  pub fn new(prev_line: Vec<u32>, new_line: Vec<u32>, delta_score: u32, destinations: Vec<i8>) -> StackingResult {
    StackingResult {
      prev_line: encoding::encode_row(&prev_line),
      new_line: encoding::encode_row(&new_line),
      delta_score,
      destinations,
    }
  }

  #[allow(dead_code)]
  pub fn format_js(&self) -> String {
    format!("[{}, {{newRow: {}, ds: {}, destRow: {:?}}}],\n", self.prev_line, self.new_line, self.delta_score, self.destinations)
  }

  #[allow(dead_code)]
  pub fn format_js_array(&self) -> String {
    format!("[{}, [{}, {}, {:?}]],\n", self.prev_line, self.new_line, self.delta_score, self.destinations)
  }
}

#[allow(dead_code)]
pub fn process_line(line: &Vec<u32>) -> StackingResult {
  let mut new_line: Vec<u32> = vec![0; 4];
  let mut destinations: Vec<i8> = vec![0; 4];
  let mut delta_score = 0;
  let mut k = 0;

  for i in 0..4 {
    let j = i as i8;
    if line[i] != 0 {
      if new_line[k] == line[i] {
        new_line[k] += line[i];
        delta_score += new_line[k];
        destinations[i] = k as i8 - j;
        k += 1;
      } else {
        if new_line[k] == 0 {
          new_line[k] = line[i];
        } else {
          k += 1;
          new_line[k] = line[i];
        }
        destinations[i] = k as i8 - j;
      }
    }
  }

  StackingResult::new(line.clone(), new_line, delta_score, destinations)
}


// Unit Tests

#[cfg(test)]
mod tests {
  // Test stacking
  #[test]
  fn stacks_empty_correctly() {
    let res = super::process_line(&vec![0, 0, 0, 0]);

    assert_eq!(res.new_line, super::encoding::encode_row(&vec![0, 0, 0, 0]));
  }
  
  #[test]
  fn stacks_some_correctly() {
    let res = super::process_line(&vec![4, 4, 2, 2]);

    assert_eq!(res.new_line, super::encoding::encode_row(&vec![8, 4, 0, 0]));
  }
  
  #[test]
  fn stacks_corner_correctly() {
    let res = super::process_line(&vec![2, 2, 2, 2]);

    assert_eq!(res.new_line, super::encoding::encode_row(&vec![4, 4, 0, 0]));
  }

  // Test scoring
  #[test]
  fn computes_null_score_correctly() {
    let res = super::process_line(&vec![8, 4, 2, 0]);

    assert_eq!(res.delta_score, 0);
  }

  #[test]
  fn computes_corner_score_correctly() {
    let res = super::process_line(&vec![4, 4, 4, 4]);

    assert_eq!(res.delta_score, 16);
  }

  #[test]
  fn computes_large_score_correctly() {
    let res = super::process_line(&vec![32768, 32768, 2, 2]);

    assert_eq!(res.delta_score, 65540);
  }

  // Test moving
  #[test]
  fn computes_null_movement_correctly() {
    let res = super::process_line(&vec![8, 4, 2, 0]);

    assert_eq!(res.destinations, vec![0, 0, 0, 0]);
  }

  #[test]
  fn computes_corner_movement_correctly() {
    let res = super::process_line(&vec![4, 4, 4, 4]);

    assert_eq!(res.destinations, vec![0, -1, -1, -2]);
  }

  #[test]
  fn computes_sparse_movement_correctly() {
    let res = super::process_line(&vec![4, 0, 2, 2]);

    assert_eq!(res.destinations, vec![0, 0, -1, -2]);
  }
}