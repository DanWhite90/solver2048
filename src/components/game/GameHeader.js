import React from "react";
import {Container, Row} from "react-bootstrap"; 

const GameHeader = () => {
  return (
    <Container>
      <Row>
        <div>Score: 0</div>
        <button>Undo</button>
        <button>Restart</button>
      </Row>
    </Container>
  );
}

export default GameHeader;