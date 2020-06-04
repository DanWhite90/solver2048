import {encodeState, decodeState} from "../lib/encoding";

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