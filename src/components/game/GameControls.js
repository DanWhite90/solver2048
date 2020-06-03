import React from "react";
import {Container, Row, Col, Button} from "react-bootstrap";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faArrowUp, faArrowLeft, faArrowRight, faArrowDown} from '@fortawesome/free-solid-svg-icons';

const GameControls = () => {
  return (
    <Container className="controls">
      <Row>
        <Col></Col>
        <Col as={Button} variant="primary" className="rounded-circle"><FontAwesomeIcon icon={faArrowUp} size="lg"/></Col>
        <Col></Col>
      </Row>
      <Row>
        <Col as={Button} variant="primary" className="rounded-circle"><FontAwesomeIcon icon={faArrowLeft} size="lg"/></Col>
        <Col></Col>
        <Col as={Button} variant="primary" className="rounded-circle"><FontAwesomeIcon icon={faArrowRight} size="lg"/></Col>
      </Row>
      <Row>
        <Col></Col>
        <Col as={Button} variant="primary" className="rounded-circle"><FontAwesomeIcon icon={faArrowDown} size="lg"/></Col>
        <Col></Col>
      </Row>
    </Container>
  );
}

export default GameControls;