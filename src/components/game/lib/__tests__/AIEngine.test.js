import {monotonicityScore, emptinessScore} from "../AIEngine";

describe("monotonicityScore()", () => {

  it("computes the right score for an empty grid", () => {
    let inputGrid = [
      [0,0,0,0],
      [0,0,0,0],
      [0,0,0,0],
      [0,0,0,0]
    ];

    expect(monotonicityScore(inputGrid)).toBeCloseTo(1, 4);
  });

  it("computes the right score for a sparse grid", () => {
    let inputGrid = [
      [4,2,0,0],
      [16,4,0,0],
      [64,8,2,0],
      [4,16,8,2]
    ];

    expect(monotonicityScore(inputGrid)).toBeCloseTo((22 - 12)/12, 4);
  });
  
  it("computes the right score for a monotonic grid", () => {
    let inputGrid = [
      [4,2,0,0],
      [16,4,0,0],
      [64,8,2,0],
      [64,16,8,2]
    ];

    expect(monotonicityScore(inputGrid)).toBeCloseTo(1, 4);
  });
  
  it("computes the right score for a maximally non-monotonic grid", () => {
    let inputGrid = [
      [4,2,4,2],
      [2,4,2,4],
      [4,2,4,2],
      [2,4,2,4]
    ];

    expect(monotonicityScore(inputGrid)).toBeCloseTo(0, 4);
  });
});

describe("emptinessScore()", () => {
  
});