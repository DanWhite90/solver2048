## 2048 Game & AI

### Description

This is a replica of the popular 2048 mobile game, with the addition of a simple AI for solving it. Read below for more technical details.

See it in action [here](http://DanWhite90.github.io/solver2048).

### Usage

Due to the efficiency concerns I precomputed partial row moves in Rust and stored them into a hashtable callable from JavaScript so `rustc` and `cargo` are required.

From `./bin/move_generator/` run:

`cargo run --release`

to calculate the partial precomputed moves and then:

`npm run build`

to build the React application.

### Project details

This is a modern React application with Redux state management and pure CSS animations.

The game engine:
- Each and only allowed move is precomputed for a single row as a left move and stored in a hastable to avoind real-time calculation, every other move is obtained by transposition and inversion.
- Moves effects are compued with a Rust code by an algorithm of O(n) time and space complexity in the length of the array, each move is computed recursively for each disposition with repetition and saved only if it causes a state change.
- Each move and effect is encoded in one 32 bit integer, 5 bits per possible value encodind the log2 of the value of the tile to compress the data (zero is saved as zero since 1 is not a possible value for a tile), up to 17 (10001) the maximum theoretical tile achievable (131072).
- Each grid is also encoded in 3 unsigned 32 bit integers, with 5 bits per tile, for compressing the history and the game tree in the AI part even further.

### AI details

The AI engine is designed to work very fast and often provide a winning path, even with a shallow search tree and neglecting the full forecast path, specifically:
- a game tree is generated, branching for each possible move and each possible tile in each possible empty spot after a move calculation, iteratibely in a Breadth-First manner using a queue to generate only the leaves of typically 3-4 steps ahead.
- The leaves are then used to compute the expected utility (static evaluation) of each possible first move's impact on the leaves, weighted by the log of the number of leaves under one move to favor moves that lead to more possibilities to continue the game.
- The utility function is a Cobb-Douglas function (from economics) of the heuristics that is especially useful by acting as a "soft-min" in that it doesn't allow any heuristic score to be too low or zero bacause it would lead to a loss so utility is also zero or close to it, while "normal" values are properly weighted.
- Each heuristic is a function of the grid state taking values in [0, 1], nonlinear adjustments are considered. In order of importance the heuristics are:
  - Monotonicity: the grid as sample from a 3d surface should have no local optima to make tiles properly ordered for merging.
  - Emptiness: more free slots increase the probability of continuing the game and favors merging.
  - Mergeability: this is a bit tricky. Given the highest tile, the existence of smaller tiles (taken as unique, repetition is irrelevant) is penalized as the log2 of the value of the tile below the maximum. This pushes merging towards a state where a high caliber merge is favored to avoid cluttering the grid with tiles that wouldn't merge soon, supporting a "healthy" emptiness score.
  - Maximum tile: Provides higher score to grids with higher maximum value of a tile (meaning approaching victory).
- The probability of a 2-tile appearing is learned with a Bayesian estimator taking each tile as a linearly transformed Bernoulli random variable and assuming a Beta prior distribution to exploit the Beta-Bernoulli conjugate family for a closed-form estimator of the posterior mean.

I also made a stochastic dynamic programming version that generates the full expectation tree from the Breadth-First traversal of the game tree, the resulting quadtree is stored in an array with indices satisfying the classical `childIndex(i, parentIndex) = branchingFactor * parentIndex + 1 + i` indexing rule, where each child accumulates the utility along the path so you can find the max utility among the leaves in linear time and then use the index structure to find the first move that generated it.<br />
This resulted in being a bit slower and required different non path-agnostic heuristics to work fine so I momentarily put it aside.

### Future plans

There is still a lot of potential on both the software part as well as the AI part, as soon as I have time I'd:
- Add some backend API serving features like user score saving etc...
- Rewrite the AI engine using a full stochastic dynamic programming approach in Rust and compile it to WebAssembly to make it more efficient.

