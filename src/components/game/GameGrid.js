import React from "react";
import {Container} from "react-bootstrap";
import {connect} from "react-redux";
import {Transition} from "react-transition-group";

import Tile from "./Tile";

const GameGrid = props => {

  const duration = 1000;
  const defaultStyle = {
    opacity: 0,
    transition: `opacity ${duration}ms`
  };
  const transitionStyles = {
    entering: { opacity: 1 },
    entered:  { opacity: 1 },
    exiting:  { opacity: 0 },
    exited:  { opacity: 0 }
  };

  const computeStyles = (col, state) => {
    // implement styles to be added to render grid for animations
    if (col === 0) {
      return {opacity: 0};
    } else {
      // if (col === 64) {
      //   return {
      //     transform: "translate(0, 200%)",
      //     transition: "transform 1000ms cubic-bezier(0.34, 1.56, 0.64, 1)"
      //   };
      // }
      return {
        ...defaultStyle,
        ...transitionStyles[state]
      };
    }
  }

  const renderGrid = () => {
    return props.grid.map((row, i) => {
      return row.map((col, j) => {
        return (
          <Transition key={j} in={true} timeout={duration}>
            {state => (<Tile
              value={col} 
              position={{i, j}} 
              className="tile"
              style={computeStyles(col, state)}
            />)}
          </Transition>
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

  return (
    <Container className="grid-wrapper">
      <Container className="grid-bg">
        {renderBackground()}
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