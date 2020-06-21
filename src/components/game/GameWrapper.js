import React from "react";
import {Container} from "react-bootstrap";
import {connect} from "react-redux";
import {Transition} from "react-transition-group";

import GameHeader from "./GameHeader";
import GameGrid from "./GameGrid";
import GameControls from "./GameControls";

import * as actions from "../../actions";
import {processMove, isNonEmpty} from "./lib/gameEngine";
import {ANIM_SLIDE} from "../../globalOptions";

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
    if (!props.animPhase) {
      let {newGrid, deltaScore, destinations} = processMove(direction, grid);
  
      // check that a valid move has been made or that the game just started
      if (isNonEmpty(destinations) || !isNonEmpty(newGrid)) {
        props.storePartialMove(newGrid, deltaScore);
        props.storeDestinations(direction, destinations);
        props.setAnimationPhase(ANIM_SLIDE);
        // props.increaseMoveCount();
      }
    }
  };

  return (
    <Transition in={true} timeout={0} appear>
      {state => (
        <Container fluid className="wrapper" style={{...defaultStyle, ...transitionStyles[state]}}>
          <GameHeader />
          <GameGrid handleMove={handleMove} />
          {!props.isTouchDevice && <GameControls handleMove={handleMove} />}
        </Container>
      )}
    </Transition>
  );
}

const mapStateToProps = state => {
  return {
    isTouchDevice: state.device.isTouchDevice,
    grid: state.game.grid,
    animPhase: state.ui.animPhase
  }
}

export default connect(mapStateToProps, actions)(GameWrapper);