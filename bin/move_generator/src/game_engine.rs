use crate::encoding;

pub struct StackResult {
  pub encoded_row: u32,
  pub encoded_new_row: u32,
  pub delta_score: u32,
  pub dest_row: Vec<i8>,
}

impl StackResult {
  fn new(row: Vec<u32>, new_row: Vec<u32>, delta_score: u32, dest_row: Vec<i8>) -> StackResult {
    StackResult {
      encoded_row: encoding::encode_row(&row),
      encoded_new_row: encoding::encode_row(&new_row),
      delta_score,
      dest_row,
    }
  }

  #[allow(dead_code)]
  pub fn format_js(&self) -> String {
    format!("[{}, {{newRow: {}, ds: {}, destRow: {:?}}}],\n", self.encoded_row, self.encoded_new_row, self.delta_score, self.dest_row)
  }

  #[allow(dead_code)]
  pub fn format_js_array(&self) -> String {
    format!("[{}, [{}, {}, {:?}]],\n", self.encoded_row, self.encoded_new_row, self.delta_score, self.dest_row)
  }
}

pub fn stack_left(row: &Vec<u32>) -> StackResult {
  let mut new_row: Vec<u32> = vec![0; 4];
  let mut dest_row: Vec<i8> = vec![0; 4];
  let mut delta_score = 0;
  let mut k = 0;

  for i in 0..4 {
    let j = i as i8;
    if row[i] != 0 {
      if new_row[k] == row[i] {
        new_row[k] += row[i];
        delta_score += new_row[k];
        dest_row[i] = k as i8 - j;
        k += 1;
      } else {
        if new_row[k] == 0 {
          new_row[k] = row[i];
        } else {
          k += 1;
          new_row[k] = row[i];
        }
        dest_row[i] = k as i8 - j;
      }
    }
  }

  StackResult::new(row.clone(), new_row, delta_score, dest_row)
}

#[cfg(test)]
mod tests {
  // Test stacking
  #[test]
  fn stacks_empty_correctly() {
    let res = super::stack_left(&vec![0, 0, 0, 0]);

    assert_eq!(res.encoded_new_row, super::encoding::encode_row(&vec![0, 0, 0, 0]));
  }
  
  #[test]
  fn stacks_some_correctly() {
    let res = super::stack_left(&vec![4, 4, 2, 2]);

    assert_eq!(res.encoded_new_row, super::encoding::encode_row(&vec![8, 4, 0, 0]));
  }
  
  #[test]
  fn stacks_corner_correctly() {
    let res = super::stack_left(&vec![2, 2, 2, 2]);

    assert_eq!(res.encoded_new_row, super::encoding::encode_row(&vec![4, 4, 0, 0]));
  }

  // Test scoring
  #[test]
  fn computes_null_score_correctly() {
    let res = super::stack_left(&vec![8, 4, 2, 0]);

    assert_eq!(res.delta_score, 0);
  }

  #[test]
  fn computes_corner_score_correctly() {
    let res = super::stack_left(&vec![4, 4, 4, 4]);

    assert_eq!(res.delta_score, 16);
  }

  #[test]
  fn computes_large_score_correctly() {
    let res = super::stack_left(&vec![32768, 32768, 2, 2]);

    assert_eq!(res.delta_score, 65540);
  }

  // Test moving
  #[test]
  fn computes_null_movement_correctly() {
    let res = super::stack_left(&vec![8, 4, 2, 0]);

    assert_eq!(res.dest_row, vec![0, 0, 0, 0]);
  }

  #[test]
  fn computes_corner_movement_correctly() {
    let res = super::stack_left(&vec![4, 4, 4, 4]);

    assert_eq!(res.dest_row, vec![0, -1, -1, -2]);
  }

  #[test]
  fn computes_sparse_movement_correctly() {
    let res = super::stack_left(&vec![4, 0, 2, 2]);

    assert_eq!(res.dest_row, vec![0, 0, -1, -2]);
  }
}