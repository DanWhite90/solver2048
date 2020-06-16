import React, { useEffect } from "react";
import {Container} from "react-bootstrap";
import {connect} from "react-redux";
// import {Transition} from "react-transition-group";

import {LEFT, RIGHT} from "../../globalOptions";
import {addRandomTile} from "./lib/gameEngine";
import * as actions from "../../actions";

import Tile from "./Tile";

const GameGrid = props => {
  let {moveCount} = props;

  const duration = 1000;

  const computeStyles = (col, i, j) => {
    // implement styles to be added to render grid for animations
    if (col === 0) {
      return {opacity: 0};
    } else {
      return {
        transform: (props.direction === LEFT || props.direction === RIGHT) ? `translate(${props.destinations[i][j] * 100}% ,0)` : `translate(0, ${props.destinations[i][j] * 100}%)`,
        transition: `transform ${duration}ms ease-in-out`
        // transition: "transform 1000ms cubic-bezier(0.34, 1.56, 0.64, 1)"
      };
    }
  }

  // const renderGrid = () => {
  //   return props.grid.map((row, i) => {
  //     return row.map((col, j) => {
  //       return (
  //         <Transition key={j} in={true} timeout={duration}>
  //           {state => {
  //             return <Tile
  //               value={col} 
  //               position={{i, j}} 
  //               className="tile"
  //               style={computeStyles(col, i, j)}
  //             />;
  //           }}
  //         </Transition>
  //       );
  //     });
  //   });
  // }

  const renderGrid = () => {
    return props.grid.map((row, i) => {
      return row.map((col, j) => {
        return (
          <Tile
            key={j}
            value={col} 
            position={{i, j}} 
            className="tile"
            style={computeStyles(col, i, j)}
          />
        );
      });
    });
  }

  const renderBackground = () => {
    return props.grid.map((row, i) => {
      return row.map((col, j) => {
        return (
          <Tile
            key={j}
            value="" 
            className="tile-bg"
          />
        );
      });
    });
  }

  useEffect(() => {
    if (props.computedGrid) {
      const newGrid = addRandomTile(props.computedGrid);
      props.updateGame(newGrid, props.computedScore);
    }
  }, [moveCount]);

  return (
    <Container className="grid-wrapper">
      <Container className="grid-bg">
        {renderBackground()}
      </Container>
      <Container ref={props.gridRef} className="grid">
        {renderGrid()}
      </Container>
    </Container>
  );
}

const mapStateToProps = state => {
  return {
    grid: state.game.grid,
    moveCount: state.game.moveCount,
    direction: state.ui.direction,
    destinations: state.ui.destinations
  };
}

export default connect(mapStateToProps, actions)(GameGrid);