//! # `move_generator` (legacy)
//! 
//! This binary generates the precomputed JavaScript moves to store in a `Map()`

use std::io::prelude::*;
use std::fs::File;

extern crate game_ai;
use game_ai::game::moves;

const PATH: &str = "../../src/components/game/lib/precomputed.js";

fn main() {

  println!("This is the move generator");

  let mut file: File = File::create(PATH).expect("Error in creating file!");
  let moves_table = moves::make_precomputed_hashmap();

  // Header 
  file.write("
// contains only valid left stacking single row moves, all the others can be derived from these
// the key in Map is the current encoded row, the value is an array with [new_encoded_row, score, destination_array]
export const precomputed = new Map([\n".as_bytes()).expect("Error in writing header!");

  for (_, value) in moves_table.iter() {
    file.write(value.format_js_array().as_bytes()).expect("Error in writing record!");
  }

  // Footer
  file.write("]);".as_bytes()).expect("Error in writing footer!");

  file.flush().unwrap();

  println!("Moves generation complete");

}