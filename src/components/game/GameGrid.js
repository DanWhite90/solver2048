import React from "react";
import {Container, Row, Col} from "react-bootstrap";

import {GAME_GRID_SIZE_X, GAME_GRID_SIZE_Y} from "../../globalOptions";
import Tile from "./Tile";

const GameGrid = props => {

  function renderGrid(n, m) {
    const grid = new Array(n).fill(new Array(m).fill(0));
    return grid.map((row, i) => {
      return (
        <Row key={i}>
          {row.map((col, j) => {
            return (
              <Col key={j}>
                <Tile value={col} position={{x: i, y: j}} />
              </Col>
            );
          })}
        </Row>
      );
    });
  }

  return (
    <Container>
      {renderGrid(props.n || GAME_GRID_SIZE_X, props.m || GAME_GRID_SIZE_Y)}
    </Container>
  );
}

export default GameGrid;