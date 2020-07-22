import {transpose, reverse, processMove, changeSign, zeroCount, copyGrid, isGameOver, addRandomTile, isNonEmpty, getArray, setArray} from "../gameEngine";
import {UP, LEFT, RIGHT, DOWN, ROW, COLUMN, GRID_INITIAL_STATE} from "../../../../globalOptions";

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

describe("changeSign()", () => {
  it("changes the sign correctly", () => {
    const inputArray = [[0,1,-2],[1,0,-1]];
    const expected = [[0,-1,2],[-1,0,1]]; 

    expect(JSON.stringify(changeSign(inputArray))).toEqual(JSON.stringify(expected));
  });
});

describe("zeroCount()", () => {
  it("counts zeros correctly", () => {
    const inputArray = [[0,1,-2],[1,0,-1]];
    const expected = 2; 

    expect(zeroCount(inputArray)).toEqual(expected);
  });
});

describe("copyGrid()", () => {
  it("generates deep copy of grid", () => {
    const original = [[0,1,-2],[1,0,-1]];
    const inputArray = copyGrid(original);
    original[0][0] = 100;
    const expected = [[0,1,-2],[1,0,-1]]; 

    expect(JSON.stringify(inputArray)).toEqual(JSON.stringify(expected));
  });
});

describe("getArray()", () => {
  const inputGrid = [
    [1,2,3,4],
    [5,6,7,8],
    [9,10,11,12],
    [13,14,15,16]
  ];

  it("gets a row correctly", () => {
    expect(getArray(inputGrid, 2, ROW, false)).toEqual([9,10,11,12]);
  });

  it("gets a reverse row correctly", () => {
    expect(getArray(inputGrid, 1, ROW, true)).toEqual([8,7,6,5]);
  });

  it("gets a column correctly", () => {
    expect(getArray(inputGrid, 2, COLUMN, false)).toEqual([3,7,11,15]);
  });

  it("gets a reverse column correctly", () => {
    expect(getArray(inputGrid, 0, COLUMN, true)).toEqual([13,9,5,1]);
  });
});

describe("setArray()", () => {
  let inputGrid;
  const inputArray = [1,2,3,4];

  beforeEach(() => {
    inputGrid = GRID_INITIAL_STATE();
  });

  it("sets a row correctly", () => {
    let result = setArray(inputArray, inputGrid, 1, ROW, false);
    let expected = [
      [0,0,0,0],
      [1,2,3,4],
      [0,0,0,0],
      [0,0,0,0]
    ];

    expect(JSON.stringify(result)).toEqual(JSON.stringify(expected));
  });

  it("sets a reverse row correctly", () => {
    let result = setArray(inputArray, inputGrid, 2, ROW, true);
    let expected = [
      [0,0,0,0],
      [0,0,0,0],
      [4,3,2,1],
      [0,0,0,0]
    ];

    expect(JSON.stringify(result)).toEqual(JSON.stringify(expected));
  });

  it("sets a column correctly", () => {
    let result = setArray(inputArray, inputGrid, 3, COLUMN, false);
    let expected = [
      [0,0,0,1],
      [0,0,0,2],
      [0,0,0,3],
      [0,0,0,4]
    ];

    expect(JSON.stringify(result)).toEqual(JSON.stringify(expected));
  });

  it("sets a reverse column correctly", () => {
    let result = setArray(inputArray, inputGrid, 0, COLUMN, true);
    let expected = [
      [4,0,0,0],
      [3,0,0,0],
      [2,0,0,0],
      [1,0,0,0]
    ];

    expect(JSON.stringify(result)).toEqual(JSON.stringify(expected));
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
      destinations: [
        [0,0,0,0],
        [0,-1,-1,0],
        [-2,-1,-2,-1],
        [-2,0,-2,-1]
      ]
    }],
    [LEFT, {
      newGrid: [
        [4,4,0,0],
        [2,8,0,0],
        [8,16,0,0],
        [16,2,0,0]
      ],
      deltaScore: 4 + 24 + 16,
      destinations: [
        [0,0,0,-2],
        [0,-1,-1,0],
        [0,-1,-1,-2],
        [0,0,-2,-2]
      ]
    }],
    [RIGHT, {
      newGrid: [
        [0,0,4,4],
        [0,0,2,8],
        [0,0,8,16],
        [0,0,16,2]
      ],
      deltaScore: 4 + 24 + 16,
      destinations: [
        [2,2,0,0],
        [0,1,1,0],
        [2,1,1,0],
        [2,0,0,0]
      ]
    }],
    [DOWN, {
      newGrid: [
        [0,0,0,0],
        [0,0,0,2],
        [8,4,8,8],
        [8,4,16,2]
      ],
      deltaScore: 8 + 4 + 16,
      destinations: [
        [2,2,0,1],
        [0,1,1,0],
        [0,1,1,0],
        [0,0,0,0]
      ]
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
  [UP, LEFT, RIGHT, DOWN].forEach(direction => {
    it(`slides the tiles ${direction} correctly`, () => {
      expect(JSON.stringify(result.get(direction).destinations)).toEqual(JSON.stringify(expected.get(direction).destinations));
    });
  });

});

describe("addRandomTile()", () => {
  it("generates the tile in the right place", () => {
    const grid = [
      [2,4,4,8],
      [4,0,0,2],
      [4,0,2,8],
      [4,8,8,2]
    ];
    const expected = {
      newGrid: [
        [2,4,4,8],
        [4,2,0,2],
        [4,0,2,8],
        [4,8,8,2]
      ],
      newTile: {i: 1, j: 1, value: 2}
    };

    expect(JSON.stringify(addRandomTile(grid, true))).toEqual(JSON.stringify(expected));
  });

  it("returns the input grid when there are no empty slots", () => {
    const grid = [
      [2,4,8,16],
      [4,2,16,8],
      [8,16,64,4],
      [2,2,16,8]
    ];
    const expected = {
      newGrid: [
        [2,4,8,16],
        [4,2,16,8],
        [8,16,64,4],
        [2,2,16,8]
      ],
      newTile: null
    };

    expect(JSON.stringify(addRandomTile(grid, true))).toEqual(JSON.stringify(expected));
  });
});

describe("isNonEmpty()", () => {
  it("corretly validates a valid move", () => {
    const grid = [
      [1,0,0,0],
      [0,0,0,0],
      [0,0,0,0],
      [0,0,0,0]
    ];

    expect(isNonEmpty(grid)).toEqual(true);
  });
  
  it("corretly rejects an invalid move", () => {
    const grid = [
      [0,0,0,0],
      [0,0,0,0],
      [0,0,0,0],
      [0,0,0,0]
    ];

    expect(isNonEmpty(grid)).toEqual(false);
  });
});

describe("isGameOver()", () => {
  it("allows the game to continue when there are empty tiles", () => {
    const grid = [
      [2,4,8,16],
      [0,2,16,8],
      [8,16,64,128],
      [2,4,16,8]
    ];

    expect(isGameOver(grid)).toEqual(false);
  });

  it("allows the game to continue when the grid is full but a move is possible", () => {
    const grid = [
      [2,4,8,16],
      [4,2,16,8],
      [8,16,64,4],
      [2,2,16,8]
    ];

    expect(isGameOver(grid)).toEqual(false);
  });

  it("allows stops the game when the grid is full and no move is possible", () => {
    const grid = [
      [2,4,8,16],
      [4,2,16,8],
      [8,16,64,4],
      [2,4,16,8]
    ];

    expect(isGameOver(grid)).toEqual(true);
  });
});