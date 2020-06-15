import React, {useEffect, useRef} from "react";
import {Container} from "react-bootstrap";
import {connect} from "react-redux";
import {Transition} from "react-transition-group";

import GameHeader from "./GameHeader";
import GameGrid from "./GameGrid";
import GameControls from "./GameControls";

import {directions} from "../../globalOptions";
import * as actions from "../../actions";
import {processMove} from "./lib/gameEngine";

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
  let {grid} = props;

  const gridRef = useRef(null);
  
  const handleMove = (direction, grid) => {
    let {newGrid, deltaScore, destinations} = processMove(direction, grid);
    props.storeDestinations(direction, destinations);
  };

  useEffect(() => {
    const handleKeyboardMove = e => {
      if (directions.has(e.key)) {
        handleMove(directions.get(e.key), grid);
      }
    };
    document.addEventListener("keydown", handleKeyboardMove);

    return () => document.removeEventListener("keydown", handleKeyboardMove);
  });

  return (
    <Transition in={true} timeout={0} appear>
      {state => (
        <Container fluid className="wrapper" style={{...defaultStyle, ...transitionStyles[state]}}>
          <GameHeader />
          <GameGrid gridRef={gridRef} />
          {!props.isTouchDevice && <GameControls handleMove gridRef={gridRef} />}
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