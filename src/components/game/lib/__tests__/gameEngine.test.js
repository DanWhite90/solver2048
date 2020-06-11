import {transpose, reverse, processMove} from "../gameEngine";
import {UP, LEFT, RIGHT, DOWN} from "../../../../globalOptions";

describe("transpose()", () => {
  it("transposes an nxm array correctly and return a copy", () => {
    const inputArray = [[2,4,6],[3,7,8]];
    const expected = [[2,3],[4,7],[6,8]]; 

    expect(JSON.stringify(transpose(inputArray))).toEqual(JSON.stringify(expected));
  });
});

describe("reverse()", () => {
  it("reverses the rows of an nxm array and return a copy", () => {
    const inputArray = [[2,4,6],[3,7,8]];
    const expected = [[6,4,2],[8,7,3]]; 

    expect(JSON.stringify(reverse(inputArray))).toEqual(JSON.stringify(expected));
  });
});

describe("processMove()", () => {
  const inputGrid = [
    [4,2,0,2],
    [0,2,8,0],
    [4,4,8,8],
    [8,0,8,2]
  ];
  const result = new Map([UP, LEFT, RIGHT, DOWN].map(direction => [direction, processMove(direction, inputGrid)]));
  const expected = new Map([
    [UP, {
      newGrid: [
        [8,4,16,2],
        [8,4,8,8],
        [0,0,0,2],
        [0,0,0,0]
      ],
      deltaScore: 8 + 4 + 16,
      destinations: []
    }],
    [LEFT, {
      newGrid: [
        [4,4,0,0],
        [2,8,0,0],
        [8,16,0,0],
        [16,2,0,0]
      ],
      deltaScore: 4 + 24 + 16,
      destinations: []
    }],
    [RIGHT, {
      newGrid: [
        [0,0,4,4],
        [0,0,2,8],
        [0,0,8,16],
        [0,0,16,2]
      ],
      deltaScore: 4 + 24 + 16,
      destinations: []
    }],
    [DOWN, {
      newGrid: [
        [0,0,0,0],
        [0,0,0,2],
        [8,4,8,8],
        [8,4,16,2]
      ],
      deltaScore: 8 + 4 + 16,
      destinations: []
    }]
  ]);

  // test grid stacking
  [UP, LEFT, RIGHT, DOWN].forEach(direction => {
    it(`stacks the grid ${direction} correctly`, () => {
      expect(JSON.stringify(result.get(direction).newGrid)).toEqual(JSON.stringify(expected.get(direction).newGrid));
    });
  });

  // test score variation
  [UP, LEFT, RIGHT, DOWN].forEach(direction => {
    it(`calculates the deltaScore ${direction} correctly`, () => {
      expect(result.get(direction).deltaScore).toEqual(expected.get(direction).deltaScore);
    });
  });

  // test correctness of destination tile for animations

});