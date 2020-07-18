const ENCODING_BITS: u32 = 5;

pub fn encode_row(row: &[u32]) -> u32 {
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

#[cfg(test)]
mod tests {
  #[test]
  fn correct_zero_encoding() {
    let row = [0, 0, 0, 0];
    assert_eq!(super::encode_row(&row), 0);
  }
  
  #[test]
  fn correct_random_encoding() {
    let row = [8, 4, 2, 0];
    assert_eq!(super::encode_row(&row), 1091);
  }
  
  #[test]
  fn correct_large_encoding() {
    let row = [65536, 65536, 65536, 65536];
    assert_eq!(super::encode_row(&row), 541200);
  }
}