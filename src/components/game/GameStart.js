import React from "react";
import {connect} from "react-redux";
import {Container, Button} from "react-bootstrap";

import * as actions from "../../actions";

const GameStart = props => {

  const handleClick = () => {
    props.startGame();

    // TEMPORARY STARTING STATE - DELET DIS!!!
    props.updateGame([
      [4,2,0,2],
      [0,2,8,0],
      [4,4,8,8],
      [8,0,8,2]
    ],0);
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

export default connect(null, actions)(GameStart);