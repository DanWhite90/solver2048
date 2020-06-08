import React from "react";
import {Container} from "react-bootstrap";
import {connect} from "react-redux";

import GameHeader from "./GameHeader";
import GameGrid from "./GameGrid";
import GameControls from "./GameControls";

const GameWrapper = props => {

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

export default connect(mapStateToProps)(GameWrapper);