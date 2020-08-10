import React from "react";
import {Container, Row, Col, Button, Tooltip, OverlayTrigger} from "react-bootstrap";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faArrowUp} from '@fortawesome/free-solid-svg-icons/faArrowUp';
import {faArrowLeft} from '@fortawesome/free-solid-svg-icons/faArrowLeft';
import {faArrowRight} from '@fortawesome/free-solid-svg-icons/faArrowRight';
import {faArrowDown} from '@fortawesome/free-solid-svg-icons/faArrowDown';
import {connect} from "react-redux";
import * as actions from "../../actions";

import {UP, LEFT, RIGHT, DOWN, GAME_OVER} from "../../globalOptions";

const GameControls = props => {

  const handleClick = direction => {
    props.handleMove(direction, props.grid);
  }

  const renderTooltip = props => (
    <Tooltip id="button-tooltip" {...props}>
      Arrows and WASD also work
    </Tooltip>
  );

  const renderButton = (direction, icon) => {
    return (
      <OverlayTrigger
        placement="right"
        delay={{show: 0, hide: 250}}
        overlay={renderTooltip}
      >
        <Col 
          disabled={(props.aiActive || props.status === GAME_OVER) ? true : false}
          onClick={() => handleClick(direction)}
          onTouchStart={() => console.log("touched")}
          xs={4} 
          as={Button} 
          variant="primary" 
          className="rounded-circle"
        >
          <FontAwesomeIcon icon={icon} size="lg"/>
        </Col>
      </OverlayTrigger>
    );
  }

  return (
    <Container className="controls">
      <Row className="justify-content-center">
        {renderButton(UP, faArrowUp)}
      </Row>
      <Row className="justify-content-between">
        {renderButton(LEFT, faArrowLeft)}
        {renderButton(RIGHT, faArrowRight)}
      </Row>
      <Row className="justify-content-center">
        {renderButton(DOWN, faArrowDown)}
      </Row>
    </Container>
  );
}

const mapStateToProps = state => {
  return {
    grid: state.game.grid,
    status: state.game.status,
    aiActive: state.ai.aiActive,
  };
}

export default connect(mapStateToProps, actions)(GameControls);