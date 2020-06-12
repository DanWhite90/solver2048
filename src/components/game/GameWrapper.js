import React, {useEffect} from "react";
import {Container} from "react-bootstrap";
import {connect} from "react-redux";

import GameHeader from "./GameHeader";
import GameGrid from "./GameGrid";
import GameControls from "./GameControls";

import {directions} from "../../globalOptions";
import * as actions from "../../actions";
import {handleMove} from "./lib/gameEngine";

const GameWrapper = props => {
  let {grid} = props;

  useEffect(() => {
    console.log("effect called");
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
    <Container fluid className="wrapper">
      <GameHeader />
      <GameGrid />
      {!props.isTouchDevice && <GameControls />}
    </Container>
  );
}

const mapStateToProps = state => {
  return {
    isTouchDevice: state.device.isTouchDevice,
    grid: state.game.grid
  }
}

export default connect(mapStateToProps, actions)(GameWrapper);