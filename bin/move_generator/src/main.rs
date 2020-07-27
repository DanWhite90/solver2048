mod encoding;
mod game_engine;

use std::fs::File;
use std::io::prelude::*;
// use std::thread;
// use std::time::Duration;

const PATH: &str = "../../src/components/game/lib/precomputed.js";
const LARGEST_TILE: u32 = 65536;

fn main() {
  println!("This is the moves generator!");

  generate_moves();
}

struct AdmissibleValues {
  value: u32,
  prev: u32,
}

impl AdmissibleValues {
  fn new(value: &u32) -> AdmissibleValues {
    AdmissibleValues {
      value: *value,
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

fn generate_moves(){
  let mut file = File::create(PATH).expect("Error in creating file!");

  fn traverse_row<'a>(row: &'a Vec<u32>, position: usize, file: &mut File) {
    if position < row.len() {
      for num in AdmissibleValues::new(&0) {
        let mut new_row = Vec::clone(&row);
        new_row[position] = num;
        traverse_row(& new_row, position + 1, file);
      }
    } else {
      // println!("{:?} - {}", row, position);
      let res = game_engine::stack_left(row);
      if res.encoded_row != res.encoded_new_row {
        file.write(res.format_js_array().as_bytes()).expect("Error in writing record!");
      }
    }
  }

  // Header 
  file.write("
// contains only valid left stacking single row moves, all the others can be derived from these
// the key in Map is the current encoded row, the value is an array with [new_encoded_row, score, destination_array]
export const precomputed = new Map([\n".as_bytes()).expect("Error in writing header!");

  //Generate moves
  traverse_row(&vec![0, 0, 0, 0], 0, &mut file);

  // Footer
  file.write("]);".as_bytes()).expect("Error in writing footer!");

  file.flush().unwrap();
}
