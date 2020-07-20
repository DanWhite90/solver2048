mod encoding;
mod game_engine;

fn main() {
  println!("This is the moves generator!");

  let row = vec![8,4,2,0];
  println!("calling encode({:?}): {}", row, encoding::encode_row(&row));

  let num = 541200;
  println!("calling decode({}): {:?}", num, encoding::decode_row(541200));
}
