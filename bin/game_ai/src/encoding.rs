/*
This module allows for encoding and decoding a row state into and from a u32 number
Given the code is internal to the library no validation of the inputs is executed for maximum performance
*/

const ENCODING_BITS: u32 = 5;

pub fn encode_line(row: &[u32]) -> u32 {
  let mut num = 0;
  let mut count = 0;

  for el in row {
    if *el != 0 {
      num += ((*el as f64).log2() * ((ENCODING_BITS * count) as f64).exp2()) as u32;
    }
    count += 1;
  }
  num
}

pub fn decode_line(mut num: u32) -> [u32; 4] {
  let mut row = [0, 0, 0, 0];
  let mut tile;

  for count in 0..row.len() {
    tile = ((num % (ENCODING_BITS as f64).exp2() as u32) as f64).exp2() as u32;
    num >>= ENCODING_BITS;
    if tile > 1 {
      row[count] = tile;
    }
  }
  row
}


// Unit Tests

#[cfg(test)]
mod tests {

  // testing for encode_line()
  #[test]
  fn correct_zero_encoding() {
    let row = [0, 0, 0, 0];
    assert_eq!(super::encode_line(&row), 0);
  }
  
  #[test]
  fn correct_random_encoding() {
    let row = [8, 4, 2, 0];
    assert_eq!(super::encode_line(&row), 1091);
  }
  
  #[test]
  fn correct_large_encoding() {
    let row = [65536, 65536, 65536, 65536];
    assert_eq!(super::encode_line(&row), 541200);
  }

  // testing for decode_line()
  #[test]
  fn correct_zero_decoding() {
    assert_eq!(super::decode_line(0), [0, 0, 0, 0]);
  }
  
  #[test]
  fn correct_random_decoding() {
    assert_eq!(super::decode_line(1091), [8, 4, 2, 0]);
  }
  
  #[test]
  fn correct_large_decoding() {
    assert_eq!(super::decode_line(541200), [65536, 65536, 65536, 65536]);
  }
}