mod encoding;
mod game;

use game::moves;

fn main() {
  println!("This is the move generator");

  moves::make_precomputed_js();

  println!("Moves generation complete");

}