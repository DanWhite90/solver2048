import {encodeState, decodeState, encodeTile, decodeTile, encodeRow, decodeRow} from "../encoding";
import { ENCODING_BITS } from "../../../../globalOptions";

it("encodes the grid correctly", () => {
  
  let encoded;
  let expected = new Uint32Array(new ArrayBuffer(12));

  encoded = JSON.stringify(encodeState([[32,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]));
  expected[0] = 5;
  expect(encoded).toEqual(JSON.stringify(expected));

  encoded = JSON.stringify(encodeState([[32,0,0,0],[0,0,0,0],[0,0,1024,0],[0,0,0,0]]));
  expected[1] = 10485760;
  expect(encoded).toEqual(JSON.stringify(expected));

  encoded = JSON.stringify(encodeState([[32,0,0,0],[0,0,8,0],[0,0,1024,0],[0,0,0,0]]));
  expected[1] = 10485763;
  expect(encoded).toEqual(JSON.stringify(expected));

  encoded = JSON.stringify(encodeState([[32,16,0,0],[0,0,8,0],[0,0,1024,0],[0,0,0,0]]));
  expected[0] = 133;
  expect(encoded).toEqual(JSON.stringify(expected));
});

it("decodes the binary correctly", () => {
  
  let encoded = new Uint32Array(new ArrayBuffer(12));
  let expected;

  encoded[0] = 5;
  expected = JSON.stringify([[32,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);
  expect(JSON.stringify(decodeState(encoded))).toEqual(expected);

  encoded[1] = 10485760;
  expected = JSON.stringify([[32,0,0,0],[0,0,0,0],[0,0,1024,0],[0,0,0,0]]);
  expect(JSON.stringify(decodeState(encoded))).toEqual(expected);

  encoded[1] = 10485763;
  expected = JSON.stringify([[32,0,0,0],[0,0,8,0],[0,0,1024,0],[0,0,0,0]]);
  expect(JSON.stringify(decodeState(encoded))).toEqual(expected);

  encoded[0] = 133;
  expected = JSON.stringify([[32,16,0,0],[0,0,8,0],[0,0,1024,0],[0,0,0,0]]);
  expect(JSON.stringify(decodeState(encoded))).toEqual(expected);
});

it("makes encoding and decoding inverses of each other", () => {
  let grid = [[2,4,8,16],[32,64,0,65536],[65536,65536,65536,65536],[0,0,0,2]];
  let encoded = new Uint32Array(new ArrayBuffer(12));
  encoded[0]=5000;
  encoded[1]=1234;
  encoded[2]=19999;

  expect(JSON.stringify(decodeState(encodeState(grid)))).toEqual(JSON.stringify(grid));
  expect(JSON.stringify(encodeState(decodeState(encoded)))).toEqual(JSON.stringify(encoded));
});

describe("encodeTile()", () => {
  it("calculates the right hash for a 2-tile", () => {
    let tile = {i: 2, j: 3, value: 2};

    expect(encodeTile(tile)).toEqual(11);
  });
  
  it("calculates the right hash for a 4-tile", () => {
    let tile = {i: 2, j: 3, value: 4};

    expect(encodeTile(tile)).toEqual(27);
  });
});

describe("decodeTile()", () => {
  it("decodes the given number to the right tile", () => {
    expect(decodeTile(11)).toEqual({i: 2, j: 3, value: 2});
    expect(decodeTile(27)).toEqual({i: 2, j: 3, value: 4});
  });
});

describe("encodeRow()", () => {
  it("encodes an empty row properly", () => {
    let row = [0,0,0,0];
    let result = 0;

    expect(encodeRow(row)).toEqual(result);
  });

  it("encodes a random row properly", () => {
    let row = [2,8,2,16];
    let result = 1*2**(0*ENCODING_BITS) + 3*2**(1*ENCODING_BITS) + 1*2**(2*ENCODING_BITS) + 4*2**(3*ENCODING_BITS);

    expect(encodeRow(row)).toEqual(result);
  });

  it("encodes a big row properly", () => {
    let row = [65536,65536,65536,65536];
    let result = 16*2**(0*ENCODING_BITS) + 16*2**(1*ENCODING_BITS) + 16*2**(2*ENCODING_BITS) + 16*2**(3*ENCODING_BITS);

    expect(encodeRow(row)).toEqual(result);
  });
});

describe("decodeRow()", () => {
  it("decodes an empty row properly", () => {
    let num = 0;
    let result = [0,0,0,0];

    expect(decodeRow(num)).toEqual(result);
  });

  it("decodes a random row properly", () => {
    let num = 1*2**(0*ENCODING_BITS) + 3*2**(1*ENCODING_BITS) + 1*2**(2*ENCODING_BITS) + 4*2**(3*ENCODING_BITS);
    let result = [2,8,2,16];

    expect(decodeRow(num)).toEqual(result);
  });

  it("decodes a big row properly", () => {
    let num = 16*2**(0*ENCODING_BITS) + 16*2**(1*ENCODING_BITS) + 16*2**(2*ENCODING_BITS) + 16*2**(3*ENCODING_BITS);
    let result = [65536,65536,65536,65536];

    expect(decodeRow(num)).toEqual(result);
  });
});