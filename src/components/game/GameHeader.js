import React from "react";
import {Container, Row, Col, Button} from "react-bootstrap"; 
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faRedoAlt, faBackward, faBrain} from '@fortawesome/free-solid-svg-icons';
import {connect} from "react-redux";

import {toggleAI} from "../../actions";

const GameHeader = props => {
  return (
    <Container className="header">
      <Row className="justify-content-end">
          <Button 
            onClick={() => props.toggleAI()}
            className="rounded-circle" 
            variant={props.aiActive ? "success" : "danger"}
          >
            <FontAwesomeIcon icon={faBrain} size="lg" />
          </Button>
          <Button className="rounded-circle" variant="info">
            <FontAwesomeIcon icon={faBackward} size="lg" />
          </Button>
          <Button className="rounded-circle" variant="info">
            <FontAwesomeIcon icon={faRedoAlt} size="lg" />
          </Button>
      </Row>
      <Row>
        <Col>Score: 0</Col>
      </Row>
    </Container>
  );
}

const mapStateToProps = state => {
  return {aiActive: state.game.aiActive};
}

export default connect(mapStateToProps, {toggleAI})(GameHeader);