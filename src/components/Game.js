import React from "react";
import {Container} from "react-bootstrap";
import {connect} from "react-redux";

import * as actions from "../actions";
import { GAME_INIT } from "../globalOptions";
import GameStart from "./game/GameStart";
import GameWrapper from "./game/GameWrapper";

const Game = props => {

  return (
    <Container className="game-page">
      {props.status === GAME_INIT ? <GameStart /> : <GameWrapper />}
    </Container>
  );

};

const mapStateToProps = state => {
  return {
    status: state.game.status
  }
}

export default connect(mapStateToProps, actions)(Game);