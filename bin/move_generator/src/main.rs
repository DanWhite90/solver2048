mod encoding;
mod game_engine;

use std::fs::File;
use std::io::prelude::*;
// use std::thread;
// use std::time::Duration;

const PATH: &str = "../../src/components/game/lib/precomputedMoves.js";
const LARGEST_TILE: u32 = 65536;

fn main() {
  println!("This is the moves generator!");

  let row = vec![8,4,2,0];
  println!("calling encode({:?}): {}", row, encoding::encode_row(&row));

  let num = 541200;
  println!("calling decode({}): {:?}", num, encoding::decode_row(541200));

  let res = game_engine::stack_left(&vec![8, 0, 2, 2]);
  println!("Result from stacking: \n{}", res.format_js());

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
      file.write(res.format_js().as_bytes()).expect("Error in writing record!");
    }
  }

  // Header 
  file.write("export const precomputedMoves = new Map([\n".as_bytes()).expect("Error in writing header!");

  //Generate moves
  let res = game_engine::stack_left(&vec![8, 0, 2, 2]);
  file.write(res.format_js().as_bytes()).expect("Error writing record!");
  
  traverse_row(&vec![0, 0, 0, 0], 0, &mut file);

  // Footer
  file.write("]);".as_bytes()).expect("Error in writing footer!");

  file.flush().unwrap();
}
