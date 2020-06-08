import React from "react";
import {connect} from "react-redux";

import GameWrapper from "./game/GameWrapper";
import GameStart from "./game/GameStart";

const App = props => {

  if (props.gameStarted) {
    return <GameWrapper />;
  } else {
    return <GameStart />;
  }
}

const mapStateToProps = state => {
  return {
    gameStarted: state.game.gameStarted
  }
}

export default connect(mapStateToProps)(App);