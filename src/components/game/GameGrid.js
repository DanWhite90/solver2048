import React, { useEffect, useRef } from "react";
import {Container} from "react-bootstrap";
import {connect} from "react-redux";
import {Transition} from "react-transition-group";

import {LEFT, RIGHT, directions, ANIM_NONE, ANIM_SLIDE, ANIM_NEW_TILE} from "../../globalOptions";
import {addRandomTile} from "./lib/gameEngine";
import * as actions from "../../actions";

import Tile from "./Tile";

const GameGrid = props => {
  let {animPhase} = props;

  const gridRef = useRef();

  const duration = 1000;
  const defaultStyle = {
    opacity: 1,
    transition: `transform ${duration}ms ease-in-out`
  };

  const computeStyles = (value, i, j) => {
    if (value === 0) {
      return {
        "entering": {opacity: 0},
        "entered": {opacity: 0},
        "exiting": {opacity: 0},
        "exited": {opacity: 0}
      };
    } else {
      switch (animPhase) {
        case ANIM_SLIDE:
          return {
            "entering": {
              transform: (props.direction === LEFT || props.direction === RIGHT) ? `translate(${props.destinations[i][j] * 100}% ,0)` : `translate(0, ${props.destinations[i][j] * 100}%)`
            },
            "entered": {
              transform: (props.direction === LEFT || props.direction === RIGHT) ? `translate(${props.destinations[i][j] * 100}% ,0)` : `translate(0, ${props.destinations[i][j] * 100}%)`
            },
            "exiting": {},
            "exited": {}
          };
        case ANIM_NEW_TILE:
          return {
            "entering": {
              transition: `transform ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity ${duration}ms ease-in-out`,
              transform: `scale(0.6)`,
              opacity: 0.6
            },
            "entered": {
              transition: `transform ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity ${duration}ms ease-in-out`,
              transform: `scale(1)`,
              opacity: 1
            },
            "exiting": {},
            "exited": {}
          };
        case ANIM_NONE:
        default:
          return {
            "entering": {},
            "entered": {},
            "exiting": {},
            "exited": {}
          };
      }
    }
  };

  const renderGrid = (state, background = false) => {
    return props.grid.map((row, i) => {
      return row.map((col, j) => {
        return (
          <Tile
            key={j}
            value={background ? "" : col} 
            className={background ? "tile-bg" : "tile"}
            style={background ? {} : {... defaultStyle, ...computeStyles(col, i, j)[state]}}
          />
        );
      });
    });
  };

  const renderAnimation = () => {
    switch (animPhase) {
      case ANIM_NONE:
      case ANIM_SLIDE:
      case ANIM_NEW_TILE:
        return (
          <Transition 
            in={!!animPhase} 
            timeout={duration} 
            onEntered={console.log("entered")}
          >
            {state => renderGrid(state)}
          </Transition>
        );
    }
  };

  // add keyboard listener
  useEffect(() => {
    const handleKeyboardMove = e => {
      if (directions.has(e.key)) {
        props.handleMove(directions.get(e.key), props.grid);
      }
    };
    document.addEventListener("keydown", handleKeyboardMove);

    return () => document.removeEventListener("keydown", handleKeyboardMove);
  });

  // handle animation logic
  useEffect(() => {
    switch (animPhase) {
      case ANIM_NONE:
      case ANIM_SLIDE:
      case ANIM_NEW_TILE:
        const {newGrid, newTile} = addRandomTile(props.grid);
        // shouldn't update here
        props.updateGame(newGrid, props.computedScore, newTile);
        props.setAnimationPhase(ANIM_NONE);
    }
  }, [animPhase]);

  return (
    <Container className="grid-wrapper">
      <Container className="grid-bg">
        {renderGrid(null, true)}
      </Container>
      <Container ref={gridRef} className="grid">
        {renderAnimation()}
      </Container>
    </Container>
  );
}

const mapStateToProps = state => {
  return {
    // game
    grid: state.game.grid,
    moveCount: state.game.moveCount,
    computedGrid: state.game.computedGrid,
    computedScore: state.game.computedScore,
    newTile: state.game.newTile,
    // ui
    direction: state.ui.direction,
    destinations: state.ui.destinations,
    animPhase: state.ui.animPhase
  };
}

export default connect(mapStateToProps, actions)(GameGrid);