import React from "react";
import {Container, Row, Col, Button} from "react-bootstrap";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faArrowUp, faArrowLeft, faArrowRight, faArrowDown} from '@fortawesome/free-solid-svg-icons';

const GameControls = () => {
  return (
    <Container className="controls">
      <Row className="justify-content-center">
        <Col xs={4} as={Button} variant="primary" className="rounded-circle"><FontAwesomeIcon icon={faArrowUp} size="lg"/></Col>
      </Row>
      <Row className="justify-content-between">
        <Col xs={4} as={Button} variant="primary" className="rounded-circle"><FontAwesomeIcon icon={faArrowLeft} size="lg"/></Col>
        <Col xs={4} as={Button} variant="primary" className="rounded-circle"><FontAwesomeIcon icon={faArrowRight} size="lg"/></Col>
      </Row>
      <Row className="justify-content-center">
        <Col xs={4} as={Button} variant="primary" className="rounded-circle"><FontAwesomeIcon icon={faArrowDown} size="lg"/></Col>
      </Row>
    </Container>
  );
}

export default GameControls;