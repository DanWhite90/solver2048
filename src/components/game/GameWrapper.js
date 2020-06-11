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
  let {updateGame, grid} = props;

  useEffect(() => {
    // this is the keybord event handler
    const handleKeyboard = e => {
      console.log(e.key);

      // process raw input to feed into handleMove()

      // call handleMove()

      // DELETE THIS SHOULD BE IN handleMove
      updateGame([[2,4,8,16],[32,64,0,65536],[65536,65536,65536,65536],[0,0,0,2]], 16);
    };

    document.addEventListener("keydown", handleKeyboard);

    return () => document.removeEventListener("keydown", handleKeyboard);
  }, [updateGame]);

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