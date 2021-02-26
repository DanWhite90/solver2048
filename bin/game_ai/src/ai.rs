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



//------------------------------------------------
// Module
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

}