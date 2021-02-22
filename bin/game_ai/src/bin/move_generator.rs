/*
This binary generates the javascript map of precomputed
*/

use std::io::prelude::*;
use std::fs::File;
use std::collections::HashMap;

extern crate game_ai;
use game_ai::game;

const PATH: &str = "../../src/components/game/lib/precomputed.js";

fn main() {

//   println!("This is the move generator");

//   let mut file: File = File::create(PATH).expect("Error in creating file!");
//   let moves_table: HashMap<u32, game::LineStackingResult> = game::moves::make_precomputed_hashmap();

//   // Header 
//   file.write("
// // contains only valid left stacking single row moves, all the others can be derived from these
// // the key in Map is the current encoded row, the value is an array with [new_encoded_row, score, destination_array]
// export const precomputed = new Map([\n".as_bytes()).expect("Error in writing header!");

//   for (_, value) in moves_table.iter() {
//     file.write(value.format_js_array().as_bytes()).expect("Error in writing record!");
//   }

//   // Footer
//   file.write("]);".as_bytes()).expect("Error in writing footer!");

//   file.flush().unwrap();

//   println!("Moves generation complete");

}