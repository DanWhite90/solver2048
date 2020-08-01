import {scoringFunctions, defaultScoringFunction, ALPHA, BETA, UP, LEFT} from "../../../../globalOptions";
import {monotonicityScore, emptinessScore, bayesBetaUpdate, genLeaves, genLeaf, optimMove} from "../AIEngine";

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

    expect(bayesBetaUpdate(inputGrid, moveCount)).toBeCloseTo((ALPHA + 1) / (ALPHA + BETA + 1), 4);
  });
  
  it("calculates the right probability deep within the game", () => {
    let inputGrid = [
      [128,4,2,4],
      [256,8,16,2],
      [64,2,0,0],
      [8,0,0,0]
    ];
    let moveCount = 220;
    let result = (ALPHA + 2 * (moveCount + 1) - 0.5 * (46 + 64 + 256 + 128)) / (ALPHA + BETA + moveCount + 1)

    expect(bayesBetaUpdate(inputGrid, moveCount)).toBeCloseTo(result, 2);
  });
});

describe("genLeaves()", () => {
  let grid, newNodes;

  beforeEach(() => {
    grid = [
      [0,8,4,2],
      [0,2,64,128],
      [8,64,4,2],
      [4,2,16,8]
    ];

    newNodes = [
      genLeaf([
        [8,8,4,2],
        [4,2,64,128],
        [2,64,4,2],
        [0,2,16,8]
      ], UP, 0.9, 1),
      genLeaf([
        [8,8,4,2],
        [4,2,64,128],
        [4,64,4,2],
        [0,2,16,8]
      ], UP, 0.1, 1),
      genLeaf([
        [8,8,4,2],
        [4,2,64,128],
        [0,64,4,2],
        [2,2,16,8]
      ], UP, 0.9, 1),
      genLeaf([
        [8,8,4,2],
        [4,2,64,128],
        [0,64,4,2],
        [4,2,16,8]
      ], UP, 0.1, 1),
      genLeaf([
        [8,4,2,2],
        [2,64,128,0],
        [8,64,4,2],
        [4,2,16,8]
      ], LEFT, 0.9, 1),
      genLeaf([
        [8,4,2,4],
        [2,64,128,0],
        [8,64,4,2],
        [4,2,16,8]
      ], LEFT, 0.1, 1),
      genLeaf([
        [8,4,2,0],
        [2,64,128,2],
        [8,64,4,2],
        [4,2,16,8]
      ], LEFT, 0.9, 1),
      genLeaf([
        [8,4,2,0],
        [2,64,128,4],
        [8,64,4,2],
        [4,2,16,8]
      ], LEFT, 0.1, 1),
    ];
  });

  afterEach(() => {
    grid = null;
    newNodes = null;
  });

  it("generates a 1-step ahead forecast correctly", () => {
    let result = genLeaves(genLeaf(grid), 143, 1);

    for (let k = 0; k < result.length; k++) {
      expect(JSON.stringify(result[k].grid)).toEqual(JSON.stringify(newNodes[k].grid));
      expect(result[k].originatingMove).toEqual(newNodes[k].originatingMove);
      expect(result[k].pathProb).toBeCloseTo(newNodes[k].pathProb);
      expect(result[k].depth).toEqual(newNodes[k].depth);
    }
  });

  it("generates only nodes at the same max depth", () => {
    let result = genLeaves(genLeaf(grid), 143);
    let depth = result[0].depth;

    for (let node of result) {
      expect(node.depth).toEqual(depth);
    }
  });

  it("reduces prediction horizon when all leaves are terminating states", () => {
    let grid = [
      [32,32,8,32],
      [8,16,4,16],
      [2,8,16,2],
      [8,4,8,4]
    ];
    
    let result = genLeaves(genLeaf(grid), 143);
    
    expect(JSON.stringify(result)).toEqual(JSON.stringify([genLeaf(grid)]));
  });

  it("returns empty array when the starting grid is a terminating state", () => {
    let grid = [
      [32,64,8,32],
      [8,16,4,16],
      [2,8,16,2],
      [8,4,8,4]
    ];
    
    let result = genLeaves(genLeaf(grid), 143);
    
    expect(result).toEqual([]);
  });
});

describe("optimMove()", () => {
  it("in returns only possible moves as optimal", () => {
    let grid = [
      [4,2,4,2],
      [8,512,64,4],
      [1024,265,32,16],
      [64,8,8,2]
    ];
    let moveCount = 909;

    expect(optimMove(grid, moveCount)).toEqual(LEFT);
  });

  it("wtf is this?", () => {
    let grid = [
      [128,512,8,2],
      [32,256,128,32],
      [16,64,1024,16],
      [0,2,4,8]
    ];
    let moveCount = 1016;

    expect(optimMove(grid, moveCount)).toEqual("wtf");
  });
});