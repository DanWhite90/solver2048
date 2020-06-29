import {scoringFunctions, defaultScoringFunction, ALPHA, BETA, UP, LEFT, RIGHT, DOWN, GAME_GRID_SIZE_N, GAME_GRID_SIZE_M} from "../../../../globalOptions";
import {monotonicityScore, emptinessScore, bayesBetaUpdate, createTree, generateNode, growTree} from "../AIEngine";
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

describe("growTree()", () => {
  let grid, tree;

  beforeEach(() => {
    grid = [
      [0,0,0,0],
      [0,0,0,0],
      [0,0,0,2],
      [0,0,0,0]
    ];
    tree = createTree(generateNode(grid, {i: 2, j: 3, value: 2}));
  });

  afterEach(() => {
    grid = null;
    tree = null;
  });

  it("grows an empty tree 1 step ahead correctly", () => {
    let computedGrid, tempGrid;

    growTree(tree, 1);

    for (let direction of [UP, LEFT, RIGHT, DOWN]) {
      computedGrid = processMove(direction, grid).newGrid;

      for (let i = 0; i < GAME_GRID_SIZE_N; i++) {
        for (let j = 0; j < GAME_GRID_SIZE_M; j++) {
          if (computedGrid[i][j] === 0) {
            for (let value of [2, 4]) {
              tempGrid = copyGrid(computedGrid);
              tempGrid[i][j] = value;

              expect(tree.root.nextMoveState.get(direction).get(encodeTile({i, j, value})).grid).toEqual(encodeState(tempGrid));
            }
          }
        }
      }
    }
  });
  
  // it("grows any valid single path from root to leaf correctly", () => {
  //   let maxDepth = 2;
  //   let depth = 0;
  //   let moveSequence = [
  //     {direction: LEFT, newTile: {i: 0, j: 0, value: 2}},
  //     {direction: DOWN, newTile: {i: 2, j: 1, value: 2}},
  //     {direction: LEFT, newTile: {i: 1, j: 3, value: 2}},
  //     {direction: LEFT, newTile: {i: 0, j: 1, value: 2}},
  //     {direction: DOWN, newTile: {i: 3, j: 2, value: 4}},
  //     {direction: DOWN, newTile: {i: 2, j: 3, value: 2}},
  //     // {direction: LEFT, newTile: {i: 2, j: 1, value: 2}}
  //   ];
  //   let tempGrid;

  //   growTree(tree, maxDepth);

  //   let node = tree.root.nextMoveState.get(moveSequence[depth].direction).get(encodeTile(moveSequence[depth].newTile));
  //   while (node) {
  //     console.log(depth);
  //     tempGrid = processMove(moveSequence[depth].direction, grid).newGrid;
  //     let {i, j , value} = moveSequence[depth].newTile;
  //     tempGrid[i][j] = value;

  //     expect(node.grid).toEqual(encodeState(tempGrid));

  //     depth++;
  //     node = node.nextMoveState.get(moveSequence[depth].direction).get(encodeTile(moveSequence[depth].newTile));
  //   }

  //   expect(depth).toBeCloseTo(maxDepth - 1);
  // });
});