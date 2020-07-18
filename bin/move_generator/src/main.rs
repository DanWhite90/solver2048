mod encoding;

fn main() {
  println!("This is the moves generator!");

  let row = [8,4,2,0];
  println!("calling encode(): {}", encoding::encode_row(&row));
}
