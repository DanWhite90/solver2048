//! # `ai` module
//! 
//! The ai module should contain all the functions and structures related to the ai engine.
//! Exposes functions to provide an input grid state and return an optimal estimated move.
//! Divided in submodules `core` and `engine`.

#![macro_use]


//------------------------------------------------
// Macros
//------------------------------------------------

macro_rules! TREE_SIZE {
  ( $m: expr, $d: expr ) => {
    (($m as u32).pow($d as u32 + 1) - 1) as usize
  };
}

macro_rules! MOVE_CHILDREN_ARR_LENGTH {
  ( $n: expr ) => {
    (($n as u32).pow(2) as usize) * 2
  };
}

macro_rules! TOT_MONOTONICITY_DIVISOR {
  ( $n: expr ) => {
    $n * ($n - 1) * 2
  };
}


//------------------------------------------------
// Modules
//------------------------------------------------

mod core;
pub mod engine;


//------------------------------------------------
// Unit tests
//------------------------------------------------

#[cfg(test)]
mod tests {

  #[test]
  pub fn test_tree_size_macro() {
    assert_eq!(TREE_SIZE!(4, 6), 16383);
  }

  #[test]
  pub fn test_move_children_arr_length_macro() {
    assert_eq!(MOVE_CHILDREN_ARR_LENGTH!(4), 32);
  }


  #[test]
  pub fn test_tot_monotonicity_divisor_macro() {
    assert_eq!(TOT_MONOTONICITY_DIVISOR!(4), 24);
  }

}