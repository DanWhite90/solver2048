import React from "react";
import {connect} from "react-redux";
import {BrowserRouter as Router, Switch, Route, Link, Redirect} from "react-router-dom";
import {Container, Navbar, Nav} from "react-bootstrap";

import {GAME_INIT} from "../globalOptions"; 
import Game from "./Game";
import Home from "./Home";
import Scoreboard from "./Scoreboard";

const App = props => {

  return (
    <Container className="app-wrapper">
      <Router>
        <Container className="header">
          <Navbar id="navbar" bg="semi-transparent" expand="lg" fixed="top">
            <Navbar.Brand href="/">2048 AI</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="mr-auto">
                <Nav.Link href="/" as={Link} to="/">Home</Nav.Link>
                <Nav.Link href="/game" as={Link} to="/game">Game</Nav.Link>
                <Nav.Link href="/scoreboard" as={Link} to="/scoreboard">Scoreboard</Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Navbar>
        </Container>
        <Container className="main">
            <Switch>
              <Route path="/" exact>
                <Home />
              </Route>
              <Route path="/game" exact>
                <Game />
              </Route>
              <Route path="/scoreboard" exact>
                <Scoreboard />
              </Route>
            </Switch>
        </Container>
      </Router>
    </Container>
  );

}

const mapStateToProps = state => {
  return {
    status: state.game.status
  }
}

export default connect(mapStateToProps)(App);