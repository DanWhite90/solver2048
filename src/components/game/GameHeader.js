import React from "react";
import {Container, Row, Col, Button} from "react-bootstrap"; 
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faRedoAlt} from '@fortawesome/free-solid-svg-icons/faRedoAlt';
import {faBackward} from '@fortawesome/free-solid-svg-icons/faBackward';
import {faBrain} from '@fortawesome/free-solid-svg-icons/faBrain';
import {connect} from "react-redux";

import * as actions from "../../actions";
import { GAME_OVER } from "../../globalOptions";

const GameHeader = props => {

  const handleAIToggle = () => {
    props.toggleAI();
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
            disabled={(props.aiActive || props.emptyHistory || props.status === GAME_OVER) ? true : false}
            onClick={handleRollback}
            className="rounded-circle" 
            variant="info"
          >
            <FontAwesomeIcon icon={faBackward} size="lg" />
          </Button>
          <Button 
            disabled={props.status === GAME_OVER ? true : false}
            onClick={handleAIToggle}
            className="rounded-circle" 
            variant={props.aiActive ? "success" : "danger"}
          >
            <FontAwesomeIcon icon={faBrain} size="2x" />
          </Button>
          <Button 
            disabled={props.aiActive ? true : false}
            onClick={handleRestart}
            className="rounded-circle" 
            variant="info"
          >
            <FontAwesomeIcon icon={faRedoAlt} size="lg" />
          </Button>
      </Row>
      <Row className="justify-content-between">
        <Col xs="auto">Score: {props.score}</Col>
        <Col xs="auto">Moves: {props.moveCount}</Col>
      </Row>
    </Container>
  );
}

const mapStateToProps = state => {
  return {
    // game
    emptyHistory: !state.game.gridHistory.length,
    score: state.game.score,
    status: state.game.status,
    moveCount: state.game.moveCount,
    // ai
    aiActive: state.ai.aiActive,
  };
}

export default connect(mapStateToProps, actions)(GameHeader);