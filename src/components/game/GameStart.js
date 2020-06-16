import React from "react";
import {connect} from "react-redux";
import {Container, Button} from "react-bootstrap";

import * as actions from "../../actions";
import {addRandomTile} from "./lib/gameEngine";

const GameStart = props => {

  const handleClick = () => {
    props.startGame();
    const newGrid = addRandomTile(props.grid);
    props.updateGame(newGrid, 0);
  }

  const handleTouch = () => {
    props.setTouchStatus();
  }

  return (
    <Container fluid className="wrapper">
      <h1>2048</h1>
      <h3><pre><code>{"<Solver />"}</code></pre></h3>
      <Button 
        variant="danger"
        onTouchStart={handleTouch}
        onClick={handleClick}
        className="start rounded-circle"
      >
        START
      </Button>
    </Container>
  );
}

const mapStateToProps = state => {
  return {grid: state.game.grid};
};

export default connect(mapStateToProps, actions)(GameStart);