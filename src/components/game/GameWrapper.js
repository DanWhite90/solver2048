import React from "react";
import {Container, Modal, Button} from "react-bootstrap";
import {connect} from "react-redux";
import {Transition} from "react-transition-group";

import GameHeader from "./GameHeader";
import GameGrid from "./GameGrid";
import GameControls from "./GameControls";

import * as actions from "../../actions";
import {processMove} from "./lib/gameEngine";
import {ANIM_NONE, ANIM_SLIDE, GAME_OVER} from "../../globalOptions";

const duration = 1000;
const defaultStyle = {
  opacity: 0,
  transition: `opacity ${duration}ms`
};
const transitionStyles = {
  entering: { opacity: 0 },
  entered:  { opacity: 1 },
  exiting:  { opacity: 1 },
  exited:  { opacity: 0 }
};

const GameWrapper = props => {
  
  // generic move handler to be passed for touch/keyboard/mouse handlers
  const handleMove = (direction, grid) => {
    // can make a move only if there's no active animation
    if (props.animPhase === ANIM_NONE) {
      let {newGrid, deltaScore, destinations, validMove} = processMove(direction, grid);
      
      // move is valid only if it moves at least 1 tile
      if (validMove) {
        props.storePartialMove(newGrid, deltaScore);
        props.storeDestinations(direction, destinations);
        props.increaseMoveCount();
        props.setAnimationPhase(ANIM_SLIDE);
      }
    }
  };

  const handleModalClose = () => props.resetGame();

  return (
    <Transition in={true} timeout={0} appear>
      {state => (
        <Container fluid className="wrapper" style={{...defaultStyle, ...transitionStyles[state]}}>
          <GameHeader />
          <GameGrid handleMove={handleMove} />
          {!props.isTouchDevice && <GameControls handleMove={handleMove} />}
          <Modal 
            show={props.status === GAME_OVER} 
            onHide={handleModalClose}
            size="sm"
            centered
          >
            <Modal.Header>
              <Modal.Title>Game Over</Modal.Title>
            </Modal.Header>
            <Modal.Footer>
              <Button onClick={handleModalClose}>Restart</Button>
            </Modal.Footer>
          </Modal>
        </Container>
      )}
    </Transition>
  );
}

const mapStateToProps = state => {
  return {
    isTouchDevice: state.device.isTouchDevice,
    grid: state.game.grid,
    status: state.game.status,
    animPhase: state.ui.animPhase
  }
}

export default connect(mapStateToProps, actions)(GameWrapper);