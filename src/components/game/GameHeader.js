import React from "react";
import {Container, Row, Col, Button} from "react-bootstrap"; 
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faRedoAlt, faBackward, faBrain} from '@fortawesome/free-solid-svg-icons';
import {connect} from "react-redux";

import * as actions from "../../actions";

const GameHeader = props => {

  const handleAIToggle = () => {
    props.toggleAI();
    // implement AI toggle logic
  }

  const handleRollback = () => {
    if (!props.aiActive) {
      props.rollbackHistory();
    }
  }

  const handleRestart = () => {
    props.resetGame();
  }

  return (
    <Container className="header">
      <Row className="justify-content-center">
          <Button 
            disabled={(props.aiActive || props.emptyHistory) ? true : false}
            onClick={handleRollback}
            className="rounded-circle" 
            variant="info"
          >
            <FontAwesomeIcon icon={faBackward} size="lg" />
          </Button>
          <Button 
            onClick={handleAIToggle}
            className="rounded-circle" 
            variant={props.aiActive ? "success" : "danger"}
          >
            <FontAwesomeIcon icon={faBrain} size="2x" />
          </Button>
          <Button 
            onClick={handleRestart}
            className="rounded-circle" 
            variant="info"
          >
            <FontAwesomeIcon icon={faRedoAlt} size="lg" />
          </Button>
      </Row>
      <Row>
        <Col>Score: {props.score}</Col>
      </Row>
    </Container>
  );
}

const mapStateToProps = state => {
  return {
    aiActive: state.game.aiActive,
    emptyHistory: !state.game.gridHistory.length,
    score: state.game.score,
    grid: state.game.grid
  };
}

export default connect(mapStateToProps, actions)(GameHeader);