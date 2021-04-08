import React from "react";
import {connect} from "react-redux";
import {Container, Button} from "react-bootstrap";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faFrown} from '@fortawesome/free-regular-svg-icons/faFrown';
import {faGithub} from '@fortawesome/free-brands-svg-icons/faGithub';
import {Link} from "react-router-dom";

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
      <Link
        to="/game"
        onTouchStart={handleTouch}
        onClick={handleClick}
        id="start"
      >
        START
      </Link>
      <h5>An approximate fast AI for 2048</h5>
      <p><em>Disclaimer: You can't guarantee victory in a stochastic game <FontAwesomeIcon icon={faFrown} /></em></p>
      <p>For more information visit my <a href="https://github.com/DanWhite90/solver2048"><FontAwesomeIcon icon={faGithub} /> GitHub</a></p>
    </Container>
  );
}

const mapStateToProps = state => {
  return {grid: state.game.grid};
};

export default connect(mapStateToProps, actions)(GameStart);