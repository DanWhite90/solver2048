import React from "react";
import {connect} from "react-redux";

import GameWrapper from "./game/GameWrapper";
import GameStart from "./game/GameStart";
import {GAME_INIT} from "../globalOptions"; 

const App = props => {

  if (props.status === GAME_INIT) {
    return <GameStart />;
  } else {
    return <GameWrapper />;
  }
}

const mapStateToProps = state => {
  return {
    status: state.game.status
  }
}

export default connect(mapStateToProps)(App);