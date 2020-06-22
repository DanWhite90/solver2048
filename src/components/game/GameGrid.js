import React, {useEffect} from "react";
import {Container} from "react-bootstrap";
import {connect} from "react-redux";

import usePrevious from "../../hooks/usePrevious";
import {LEFT, RIGHT, directions, ANIM_NONE, ANIM_SLIDE, ANIM_NEW_TILE} from "../../globalOptions";
import {addRandomTile, isGameOver} from "./lib/gameEngine";
import * as actions from "../../actions";

import Tile from "./Tile";

const GameGrid = props => {
  let {animPhase} = props;
  let prevAnimPhase = usePrevious(animPhase);

  const animPhaseChanged = () => animPhase !== prevAnimPhase;

  const duration = 2000;
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
            style={background ? {} : {...defaultStyle, ...computeStyles(col, i, j)[state]}}
          />
        );
      });
    });
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
        break;
      case ANIM_SLIDE:
        if (animPhaseChanged()) {
          setTimeout(() => {
            props.updateGame(props.computedGrid, props.computedScore, props.newTile)
            props.setAnimationPhase(ANIM_NEW_TILE);
          }, duration);
        }
        break;
      case ANIM_NEW_TILE:
        if (animPhaseChanged()) {
          const {newGrid, newTile} = addRandomTile(props.grid);
          if (isGameOver(newGrid)) {
            console.log("game over");
            // call termination action creator
            // show game end modal etc
          } else {
            // continue the game
            // animate new tile in the meanwhile
            setTimeout(() => {
              props.updateGame(newGrid, 0, newTile);
              props.setAnimationPhase(ANIM_NONE);
            }, duration);
          }
        }
        break;
      default:
    }
  });

  return (
    <Container className="grid-wrapper">
      <Container className="grid-bg">
        {renderGrid(null, true)}
      </Container>
      <Container className="grid">
        {renderGrid("entered")}
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