import React, { useState } from "react";
import {Container} from "react-bootstrap";

import {INITIAL_GRID_STATE} from "../../globalOptions";
import {encodeState, decodeState} from "./lib/encoding";

import GameHeader from "./GameHeader";
import GameGrid from "./GameGrid";
import GameControls from "./GameControls";

const GameWrapper = () => {

  const [gridState, setGridState] = useState(INITIAL_GRID_STATE());
  // const [gridState, setGridState] = useState([[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16]]);

  return (
    <Container fluid className="wrapper">
      <GameHeader />
      <GameGrid grid={gridState} handleChange={(newState) => setGridState(newState)} />
      <GameControls />
    </Container>
  );
}

export default GameWrapper;