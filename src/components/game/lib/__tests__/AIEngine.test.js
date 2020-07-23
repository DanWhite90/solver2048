import {scoringFunctions, defaultScoringFunction, ALPHA, BETA, UP, LEFT, RIGHT, DOWN, GAME_GRID_SIZE_N, GAME_GRID_SIZE_M} from "../../../../globalOptions";
import {monotonicityScore, emptinessScore, bayesBetaUpdate, generateForecastNode, generateForecasts} from "../AIEngine";
import {copyGrid, processMove} from "../gameEngine";
import {encodeTile, encodeState} from "../encoding";

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
  let grid;

  beforeEach(() => {
    grid = [
      [0,8,4,2],
      [0,2,64,128],
      [8,64,4,2],
      [4,2,16,8]
    ];
  });

  afterEach(() => {
    grid = null;
  });

  it("generates a 1-step ahead forecast correctly", () => {
    let node = generateForecastNode(grid);
    let newNodes = [
      generateForecastNode([
        [8,8,4,2],
        [4,2,64,128],
        [2,64,4,2],
        [0,2,16,8]
      ], [UP]),
      generateForecastNode([
        [8,8,4,2],
        [4,2,64,128],
        [4,64,4,2],
        [0,2,16,8]
      ], [UP]),
      generateForecastNode([
        [8,8,4,2],
        [4,2,64,128],
        [0,64,4,2],
        [2,2,16,8]
      ], [UP]),
      generateForecastNode([
        [8,8,4,2],
        [4,2,64,128],
        [0,64,4,2],
        [4,2,16,8]
      ], [UP]),
      generateForecastNode([
        [8,4,2,2],
        [2,64,128,0],
        [8,64,4,2],
        [4,2,16,8]
      ], [LEFT]),
      generateForecastNode([
        [8,4,2,4],
        [2,64,128,0],
        [8,64,4,2],
        [4,2,16,8]
      ], [LEFT]),
      generateForecastNode([
        [8,4,2,0],
        [2,64,128,2],
        [8,64,4,2],
        [4,2,16,8]
      ], [LEFT]),
      generateForecastNode([
        [8,4,2,0],
        [2,64,128,4],
        [8,64,4,2],
        [4,2,16,8]
      ], [LEFT]),
    ];

    let result = generateForecasts([node], 1);

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
});