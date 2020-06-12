import React, {useEffect} from "react";
import {Container} from "react-bootstrap";
import {connect} from "react-redux";
import {Transition} from "react-transition-group";

import GameHeader from "./GameHeader";
import GameGrid from "./GameGrid";
import GameControls from "./GameControls";

import {directions} from "../../globalOptions";
import * as actions from "../../actions";
import {handleMove} from "./lib/gameEngine";

const GameWrapper = props => {
  let {grid} = props;
  
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

  useEffect(() => {
    const handleKeyboardMove = e => {
      if (directions.has(e.key)) {
        console.log(e.key);
        handleMove(directions.get(e.key), grid);
      }
    };

    document.addEventListener("keydown", handleKeyboardMove);

    return () => document.removeEventListener("keydown", handleKeyboardMove);
  }, [grid]);

  return (
    <Transition in={true} timeout={0} appear>
      {state => (
        <Container fluid className="wrapper" style={{...defaultStyle, ...transitionStyles[state]}}>
          <GameHeader />
          <GameGrid />
          {!props.isTouchDevice && <GameControls />}
        </Container>
      )}
    </Transition>
  );
}

const mapStateToProps = state => {
  return {
    isTouchDevice: state.device.isTouchDevice,
    grid: state.game.grid
  }
}

export default connect(mapStateToProps, actions)(GameWrapper);