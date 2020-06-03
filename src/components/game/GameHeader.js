import React from "react";
import {Container, Row, Col, Button} from "react-bootstrap"; 
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faRedoAlt, faBackward, faBrain} from '@fortawesome/free-solid-svg-icons';

const GameHeader = () => {
  return (
    <Container className="header">
      <Row className="justify-content-end">
          <Button className="rounded-circle" variant="danger">
            <FontAwesomeIcon icon={faBrain} size="lg" />
          </Button>
          <Button className="rounded-circle" variant="info">
            <FontAwesomeIcon icon={faBackward} size="lg" />
          </Button>
          <Button className="rounded-circle" variant="info">
            <FontAwesomeIcon icon={faRedoAlt} size="lg" />
          </Button>
      </Row>
      <Row>
        <Col>Score: 0</Col>
      </Row>
    </Container>
  );
}

export default GameHeader;