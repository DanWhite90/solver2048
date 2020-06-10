import React, {useEffect} from "react";
import {Container} from "react-bootstrap";
import {connect} from "react-redux";

import GameHeader from "./GameHeader";
import GameGrid from "./GameGrid";
import GameControls from "./GameControls";
import * as actions from "../../actions";

const GameWrapper = props => {

  let {updateGame} = props;

  useEffect(() => {
    console.log("effect called");
    // make this handleKeyboard call the movement api through keyboard press
    const handleKeyboard = e => {
      console.log(e.key);

      // mock game update DELETE THIS
      updateGame([[2,4,8,16],[32,64,0,65536],[65536,65536,65536,65536],[0,0,0,2]], 16);
    };

    document.addEventListener("keydown", handleKeyboard);

    return () => document.removeEventListener("keydown", handleKeyboard);
  }, [updateGame]);

  return (
    <Container fluid className="wrapper">
      <GameHeader />
      <GameGrid />
      {props.isTouchDevice ? "" : <GameControls />}
    </Container>
  );
}

const mapStateToProps = state => {
  return {
    isTouchDevice: state.device.isTouchDevice
  }
}

export default connect(mapStateToProps, actions)(GameWrapper);