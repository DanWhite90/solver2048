import {scoringFunctions, defaultScoringFunction} from "../../../../globalOptions";
import {hashTile, monotonicityScore, emptinessScore, bayesBetaUpdate} from "../AIEngine";

describe("hashTile()", () => {
  it("calculates the right hash for a 2-tile", () => {
    let tile = {i: 2, j: 3, value: 2};

    expect(hashTile(tile)).toEqual(11);
  });
  
  it("calculates the right hash for a 4-tile", () => {
    let tile = {i: 2, j: 3, value: 4};

    expect(hashTile(tile)).toEqual(27);
  });
});

describe("monotonicityScore()", () => {

  it("computes the right score for an empty grid", () => {
    let inputGrid = [
      [0,0,0,0],
      [0,0,0,0],
      [0,0,0,0],
      [0,0,0,0]
    ];
    let result = scoringFunctions.get(defaultScoringFunction)(1);

    expect(monotonicityScore(inputGrid)).toBeCloseTo(result, 4);
  });

  it("computes the right score for a sparse grid", () => {
    let inputGrid = [
      [4,2,0,0],
      [16,4,0,0],
      [64,8,2,0],
      [4,16,8,2]
    ];
    let result = scoringFunctions.get(defaultScoringFunction)((22 - 12) / 12);

    expect(monotonicityScore(inputGrid)).toBeCloseTo(result, 4);
  });
  
  it("computes the right score for a monotonic grid", () => {
    let inputGrid = [
      [4,2,0,0],
      [16,4,0,0],
      [64,8,2,0],
      [64,16,8,2]
    ];
    let result = scoringFunctions.get(defaultScoringFunction)(1);

    expect(monotonicityScore(inputGrid)).toBeCloseTo(result, 4);
  });
  
  it("computes the right score for a maximally non-monotonic grid", () => {
    let inputGrid = [
      [4,2,4,2],
      [2,4,2,4],
      [4,2,4,2],
      [2,4,2,4]
    ];
    let result = scoringFunctions.get(defaultScoringFunction)(0);

    expect(monotonicityScore(inputGrid)).toBeCloseTo(result, 4);
  });
});

describe("emptinessScore()", () => {
  it("assigns score 1 (max) to the initial grid", () => {
    let inputGrid = [
      [0,0,0,0],
      [0,0,0,0],
      [0,0,0,0],
      [0,0,0,2]
    ];
    let result = scoringFunctions.get(defaultScoringFunction)(1);

    expect(emptinessScore(inputGrid)).toBeCloseTo(result, 4);
  });
  
  it("assigns score 0 (min) to a full grid", () => {
    let inputGrid = [
      [4,2,4,2],
      [2,4,2,4],
      [4,2,4,2],
      [2,4,2,4]
    ];
    let result = scoringFunctions.get(defaultScoringFunction)(0);

    expect(emptinessScore(inputGrid)).toBeCloseTo(result, 4);
  });
  
  it("assigns the right score to a normal grid", () => {
    let inputGrid = [
      [4,2,0,0],
      [16,4,0,0],
      [64,8,2,0],
      [4,16,8,2]
    ];
    let result = scoringFunctions.get(defaultScoringFunction)(1 / 3);

    expect(emptinessScore(inputGrid)).toBeCloseTo(result, 4);
  });
});

describe("bayesBetaUpdate()", () => {
  it("updates the probability correctly when the game starts", () => {
    let inputGrid = [
      [0,0,0,0],
      [0,0,0,0],
      [0,0,0,0],
      [0,0,0,2]
    ];
    let moveCount = 0;

    expect(bayesBetaUpdate(inputGrid, moveCount)).toBeCloseTo(2 / 3, 4);
  });
  
  it("calculates the right probability deep within the game", () => {
    let inputGrid = [
      [128,4,2,4],
      [256,8,16,2],
      [64,2,0,0],
      [8,0,0,0]
    ];
    let moveCount = 220;
    let result = (1 + 442 - 0.5 * (46 + 64 + 256 + 128)) / 223

    expect(bayesBetaUpdate(inputGrid, moveCount)).toBeCloseTo(result, 2);
  });
});