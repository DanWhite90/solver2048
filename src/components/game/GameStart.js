import React from "react";
import {connect} from "react-redux";
import {Container, Button} from "react-bootstrap";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faFrown} from '@fortawesome/free-regular-svg-icons/faFrown';

import * as actions from "../../actions";
import {GAME_STARTED} from "../../globalOptions";

const GameStart = props => {

  const handleClick = () => {
    props.setGameStatus(GAME_STARTED);
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
      <h5>An approximate fast AI for 2048</h5>
      <p>Spoiler alert: It doesn't always win <FontAwesomeIcon icon={faFrown} /></p>
    </Container>
  );
}

const mapStateToProps = state => {
  return {grid: state.game.grid};
};

export default connect(mapStateToProps, actions)(GameStart);