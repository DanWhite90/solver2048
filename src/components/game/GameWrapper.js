import React, { useState } from "react";
import {Container} from "react-bootstrap";

import {GRID_INITIAL_STATE} from "../../globalOptions";
import {encodeState, decodeState} from "./lib/encoding";

import GameHeader from "./GameHeader";
import GameGrid from "./GameGrid";
import GameControls from "./GameControls";

const GameWrapper = () => {

  return (
    <Container fluid className="wrapper">
      <GameHeader />
      <GameGrid />
      <GameControls />
    </Container>
  );
}

export default GameWrapper;