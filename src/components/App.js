import React from "react";
import {connect} from "react-redux";
import {BrowserRouter as Router, Switch, Route, Link, Redirect} from "react-router-dom";

import GameWrapper from "./game/GameWrapper";
import GameStart from "./game/GameStart";
import {GAME_INIT} from "../globalOptions"; 

const App = props => {

  // if (props.status === GAME_INIT) {
  //   return <GameStart />;
  // } else {
  //   return <GameWrapper />;
  // }

  return (
    <Router>
      <Switch>
        <Route path="/" exact>
          <GameStart />
        </Route>
        <Route path="/game" exact>
          {props.status === GAME_INIT ? <Redirect to="/" /> : <GameWrapper />}
        </Route>
        <Route path="/scoreboard" exact>
          {props.status === GAME_INIT ? <Redirect to="/" /> : null}
        </Route>
      </Switch>
    </Router>
  );

}

const mapStateToProps = state => {
  return {
    status: state.game.status
  }
}

export default connect(mapStateToProps)(App);