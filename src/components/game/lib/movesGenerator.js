// This is not part of the react bundle it's meant to be run in node to precompute
// all the possible mappings for the left move in a single row
// all the other moves can be computed by bit transformations

const fs = require("fs");

let num = new Uint32Array(new ArrayBuffer(12));
let a = new Map([[234, 5434], [345, 2345]]);

console.log(JSON.stringify([[234, 5434], [345, 2345]]));