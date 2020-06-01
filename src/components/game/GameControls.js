import React from "react";
import {Container, Row, Col} from "react-bootstrap";

const GameControls = () => {
  return (
    <Container>
      <Row>
        <Col></Col>
        <Col><button>Up</button></Col>
        <Col></Col>
      </Row>
      <Row>
        <Col><button>Left</button></Col>
        <Col></Col>
        <Col><button>Right</button></Col>
      </Row>
      <Row>
        <Col></Col>
        <Col><button>Down</button></Col>
        <Col></Col>
      </Row>
    </Container>
  );
}

export default GameControls;