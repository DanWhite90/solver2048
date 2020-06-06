import React from "react";
import {Container, Row, Col, Button} from "react-bootstrap";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faArrowUp, faArrowLeft, faArrowRight, faArrowDown} from '@fortawesome/free-solid-svg-icons';
import {connect} from "react-redux";
import * as actions from "../../actions";

import {UP, LEFT, RIGHT, DOWN} from "../../globalOptions";

const GameControls = props => {

  const handleClick = direction => {
    // mock game update DELETE THIS
    console.log("ontouchstart" in document.documentElement);
    props.updateGame([[2,4,8,16],[32,64,0,65536],[65536,65536,65536,65536],[0,0,0,2]], 16);
  }

  return (
    <Container className="controls">
      <Row className="justify-content-center">
        <Col 
          onClick={() => handleClick(UP)}
          xs={4} 
          as={Button} 
          variant="primary" 
          className="rounded-circle"
        >
          <FontAwesomeIcon icon={faArrowUp} size="lg"/>
        </Col>
      </Row>
      <Row className="justify-content-between">
        <Col 
          onClick={() => handleClick(LEFT)}
          xs={4} 
          as={Button} 
          variant="primary" 
          className="rounded-circle"
        >
          <FontAwesomeIcon icon={faArrowLeft} size="lg"/>
        </Col>
        <Col 
          onClick={() => handleClick(RIGHT)}
          xs={4} 
          as={Button} 
          variant="primary" 
          className="rounded-circle"
        >
          <FontAwesomeIcon icon={faArrowRight} size="lg"/>
        </Col>
      </Row>
      <Row className="justify-content-center">
        <Col 
          onClick={() => handleClick(DOWN)}
          xs={4} 
          as={Button} 
          variant="primary" 
          className="rounded-circle"
        >
          <FontAwesomeIcon icon={faArrowDown} size="lg"/>
        </Col>
      </Row>
    </Container>
  );
}

export default connect(null, actions)(GameControls);