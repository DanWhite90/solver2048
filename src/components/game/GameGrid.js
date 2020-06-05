import React from "react";
import {Container, Row, Col} from "react-bootstrap";
import {connect} from "react-redux";

import Tile from "./Tile";

const GameGrid = props => {

  function renderGrid(background = false) {
    return props.grid.map((row, i) => {
      return (
        <Row key={i} >
          {row.map((col, j) => {
            return (
              <Col 
                as={Tile}
                key={j}
                value={background ? "" : col} 
                position={{x: i, y: j}} 
                className={background ? "tile-bg" : "tile"}
              />
            );
          })}
        </Row>
      );
    });
  }

  return (
    <Container className="grid-wrapper">
      <Container className="grid-bg">
        {renderGrid(true)}
      </Container>
      <Container className="grid">
        {renderGrid()}
      </Container>
    </Container>
  );
}

const mapStateToProps = state => {
  return {grid: state.grid};
}

export default connect(mapStateToProps)(GameGrid);