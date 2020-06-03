import React from "react";
import {Container} from "react-bootstrap";

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