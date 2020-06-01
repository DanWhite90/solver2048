import React from "react";

import GameHeader from "./GameHeader";
import GameGrid from "./GameGrid";
import GameControls from "./GameControls";

const GameWrapper = () => {
  return (
    <>
      <GameHeader />
      <GameGrid />
      <GameControls />
    </>
  );
}

export default GameWrapper;