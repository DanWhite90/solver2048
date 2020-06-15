import React from "react";
import {Container, Row, Col, Button} from "react-bootstrap";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faArrowUp, faArrowLeft, faArrowRight, faArrowDown} from '@fortawesome/free-solid-svg-icons';
import {connect} from "react-redux";
import * as actions from "../../actions";

import {UP, LEFT, RIGHT, DOWN} from "../../globalOptions";

const GameControls = props => {

  const handleClick = direction => {
    // implement handle move
  }

  const renderButton = (direction, icon) => {
    return (
      <Col 
        disabled={props.aiActive ? true : false}
        onClick={() => handleClick(direction)}
        onTouchStart={() => console.log("touched")}
        xs={4} 
        as={Button} 
        variant="primary" 
        className="rounded-circle"
      >
        <FontAwesomeIcon icon={icon} size="lg"/>
      </Col>
    );
  }

  return (
    <Container className="controls">
      <Row className="justify-content-center">
        {renderButton(UP, faArrowUp)}
      </Row>
      <Row className="justify-content-between">
        {renderButton(LEFT, faArrowLeft)}
        {renderButton(RIGHT, faArrowRight)}
      </Row>
      <Row className="justify-content-center">
        {renderButton(DOWN, faArrowDown)}
      </Row>
    </Container>
  );
}

const mapStateToProps = state => {
  return {
    aiActive: state.game.aiActive
  };
}

export default connect(mapStateToProps, actions)(GameControls);