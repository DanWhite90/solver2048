import React from "react";
import {Container, Row, Col} from "react-bootstrap";
import {connect} from "react-redux";

import Tile from "./Tile";

const GameGrid = props => {

  const computeStyles = (background, col) => {
    // implement styles to be added to render grid for animations
    if (!background) {
      if (col === 0) {
        return {visibility: "hidden"};
      } else {
        if (col === 64) {
          return {top: "217%"};
        }
      }
    }
    return {};
  }

  const renderGrid = (background = false) => {
    return props.grid.map((row, i) => {
      return (
        <Row key={i} >
          {row.map((col, j) => {
            return (
              <Col 
                as={Tile}
                key={j}
                value={background ? "" : col} 
                position={{i, j}} 
                className={background ? "tile-bg" : "tile"}
                style={computeStyles(background, col)}
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
  return {
    grid: state.game.grid
  };
}

export default connect(mapStateToProps)(GameGrid);