import {scoringFunctions, defaultScoringFunction, ALPHA, BETA, UP, LEFT} from "../../../../globalOptions";
import {monotonicityScore, emptinessScore, bayesBetaUpdate, generateForecastNode, generateForecasts, pruneForecasts} from "../AIEngine";
import {encodeTile} from "../encoding";

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

describe("generateForecasts()", () => {
  let grid, newNodes;

  beforeEach(() => {
    grid = [
      [0,8,4,2],
      [0,2,64,128],
      [8,64,4,2],
      [4,2,16,8]
    ];

    newNodes = [
      generateForecastNode([
        [8,8,4,2],
        [4,2,64,128],
        [2,64,4,2],
        [0,2,16,8]
      ], [{direction: UP, tile: encodeTile({i: 2, j: 0, value: 2})}]),
      generateForecastNode([
        [8,8,4,2],
        [4,2,64,128],
        [4,64,4,2],
        [0,2,16,8]
      ], [{direction: UP, tile: encodeTile({i: 2, j: 0, value: 4})}]),
      generateForecastNode([
        [8,8,4,2],
        [4,2,64,128],
        [0,64,4,2],
        [2,2,16,8]
      ], [{direction: UP, tile: encodeTile({i: 3, j: 0, value: 2})}]),
      generateForecastNode([
        [8,8,4,2],
        [4,2,64,128],
        [0,64,4,2],
        [4,2,16,8]
      ], [{direction: UP, tile: encodeTile({i: 3, j: 0, value: 4})}]),
      generateForecastNode([
        [8,4,2,2],
        [2,64,128,0],
        [8,64,4,2],
        [4,2,16,8]
      ], [{direction: LEFT, tile: encodeTile({i: 0, j: 3, value: 2})}]),
      generateForecastNode([
        [8,4,2,4],
        [2,64,128,0],
        [8,64,4,2],
        [4,2,16,8]
      ], [{direction: LEFT, tile: encodeTile({i: 0, j: 3, value: 4})}]),
      generateForecastNode([
        [8,4,2,0],
        [2,64,128,2],
        [8,64,4,2],
        [4,2,16,8]
      ], [{direction: LEFT, tile: encodeTile({i: 1, j: 3, value: 2})}]),
      generateForecastNode([
        [8,4,2,0],
        [2,64,128,4],
        [8,64,4,2],
        [4,2,16,8]
      ], [{direction: LEFT, tile: encodeTile({i: 1, j: 3, value: 4})}]),
    ];
  });

  afterEach(() => {
    grid = null;
    newNodes = null;
  });

  it("generates a 1-step ahead forecast correctly", () => {
    let result = generateForecasts([generateForecastNode(grid)], 1);

    for (let k = 0; k < result.length; k++) {
      expect(JSON.stringify(result[k])).toEqual(JSON.stringify(newNodes[k]));
    }
  });

  it("generates only nodes at the same max depth", () => {
    let result = generateForecasts([generateForecastNode(grid)]);
    let depth = result[0].originatingPath.length;

    for (let node of result) {
      expect(node.originatingPath.length).toEqual(depth);
    }
  });

  it("reduces prediction horizon when all leaves are terminating states", () => {
    let grid = [
      [32,32,8,32],
      [8,16,4,16],
      [2,8,16,2],
      [8,4,8,4]
    ];
    
    let result = generateForecasts([generateForecastNode(grid)]);
    
    expect(JSON.stringify(result)).toEqual(JSON.stringify([generateForecastNode(grid)]));
  });

  it("returns empty array when the starting grid is a terminating state", () => {
    let grid = [
      [32,64,8,32],
      [8,16,4,16],
      [2,8,16,2],
      [8,4,8,4]
    ];
    
    let result = generateForecasts([generateForecastNode(grid)]);
    
    expect(result).toEqual([]);
  });
});

describe("pruneForecasts()", () => {
  let grid, nodes;

  beforeEach(() => {
    grid = [
      [0,8,4,2],
      [0,2,64,128],
      [8,64,4,2],
      [4,2,16,8]
    ];

    nodes = generateForecasts([generateForecastNode(grid)], 1);
  });

  afterEach(() => {
    grid = null;
    nodes = null;
  });

  it("prunes a 1-depth tree correctly", () => {
    let expected = [
      generateForecastNode([
        [8,4,2,2],
        [2,64,128,0],
        [8,64,4,2],
        [4,2,16,8]
      ], [])
    ];
    
    let result = pruneForecasts(nodes, LEFT, {i: 0, j: 3, value: 2});

    expect(JSON.stringify(result)).toEqual(JSON.stringify(expected));
  });

  it("returns an empty array when a the given node is a root", () => {
    let result = pruneForecasts([generateForecastNode(grid)], LEFT, {i: 0, j: 3, value: 2});

    expect(result).toEqual([]);
  });

  it("returns an empty array when given no node", () => {
    let result = pruneForecasts([], LEFT, {i: 0, j: 3, value: 2});

    expect(result).toEqual([]);
  });
});