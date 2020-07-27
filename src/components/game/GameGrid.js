import React, {useEffect, useRef} from "react";
import {Container} from "react-bootstrap";
import {connect} from "react-redux";

import usePrevious from "../../hooks/usePrevious";
import {LEFT, RIGHT, UP, DOWN, directions, ANIM_NONE, ANIM_SLIDE, ANIM_NEW_TILE, TOUCH_SLIDE_MIN_RADIUS, GAME_OVER} from "../../globalOptions";
import {addRandomTile, isGameOver} from "./lib/gameEngine";
import {optimMove} from "./lib/AIEngine";
import * as actions from "../../actions";

import Tile from "./Tile";

const GameGrid = props => {
  let {animPhase, aiActive} = props;

  let prevAnimPhase = usePrevious(animPhase);
  let prevAiActive = usePrevious(aiActive);

  const touchInfoRef = useRef({
    touching: false,
    x: 0,
    y: 0
  });

  const animPhaseChanged = () => animPhase !== prevAnimPhase;
  const aiActiveChanged = () => aiActive !== prevAiActive;

  const duration = {
    [ANIM_SLIDE]: 40,
    [ANIM_NEW_TILE]: 0
  };

  const defaultStyle = {
    opacity: 1
  };

  // temporary minimal animation - UX could be improved
  const computeStyles = (value, i, j) => {
    if (value === 0) {
      return {opacity: 0};
    } else {
      switch (animPhase) {
        case ANIM_SLIDE:
          return {
            transition: `transform ${duration[animPhase]}ms ease-in-out`,
            transform: (props.direction === LEFT || props.direction === RIGHT) ? `translate(${props.destinations[i][j] * 100}% ,0)` : `translate(0, ${props.destinations[i][j] * 100}%)`
          };
        case ANIM_NEW_TILE:
          return {};
          // return {
          //   transition: `transform ${duration[animPhase]}ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity ${duration[animPhase]}ms ease-in-out`,
          //   transform: `scale(0.6)`,
          //   opacity: 0.6
          // };
        case ANIM_NONE:
        default:
          return {};
      }
    }
  };

  const renderGrid = (background = false) => {
    return props.grid.map((row, i) => {
      return row.map((col, j) => {
        return (
          <Tile
            key={j}
            value={background ? "" : col} 
            className={background ? "tile-bg" : "tile"}
            style={background ? {} : {...defaultStyle, ...computeStyles(col, i, j)}}
          />
        );
      });
    });
  };

  const handleTouchMoveStart = e => {
    if (!aiActive) {
      touchInfoRef.current = {
        touching: true,
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }
  };

  const handleTouchMove = e => {
    if (!aiActive) {
      const dx = e.touches[0].clientX - touchInfoRef.current.x;
      const dy = e.touches[0].clientY - touchInfoRef.current.y;
      const r = Math.sqrt(dx**2 + dy**2);
      let direction;
      
      if (r > TOUCH_SLIDE_MIN_RADIUS) {
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0) {
            direction = RIGHT;
          } else {
            direction = LEFT;
          }
        } else {
          if (dy > 0) {
            direction = DOWN;
          } else {
            direction = UP;
          }
        }
        if (touchInfoRef.current.touching) {
          props.handleMove(direction, props.grid);
          touchInfoRef.current.touching = false;
        }
      }
    }
  };

  // add keyboard listener
  useEffect(() => {
    const handleKeyboardMove = e => {
      if (!aiActive && directions.has(e.key)) {
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
        if (animPhaseChanged() || aiActiveChanged()) {
          if (aiActive) {
            let optMove = optimMove(props.grid, props.moveCount);

            if (optMove !== null) {
              props.handleMove(optMove, props.grid);
            } else {
              // do something to catch up for ending game
              console.log("null optMove");
            }
          }
        }
        break;

      case ANIM_SLIDE:
        if (animPhaseChanged()) {
          setTimeout(() => {
            props.updateGame(props.computedGrid, props.computedScore, props.newTile, true)
            props.setAnimationPhase(ANIM_NEW_TILE);
          }, duration[animPhase]);
        }
        break;

      case ANIM_NEW_TILE:
        if (animPhaseChanged()) {
          const {newGrid, newTile} = addRandomTile(props.grid);

          if (isGameOver(newGrid)) {
            props.updateGame(newGrid, 0, newTile);
            props.setGameStatus(GAME_OVER);
            props.setAnimationPhase(ANIM_NONE);
            console.log("game over");
            // call termination action creator
            // show game over modal etc
          } else {
            setTimeout(() => {
              props.updateGame(newGrid, 0, newTile);
              props.setAnimationPhase(ANIM_NONE);
            }, duration[animPhase]);

            // if (aiActive) {
            //   props.updateTreeStatus(pruneForecasts(props.forecastLeaves, props.direction, props.newTile));
            // }
          }
        }
        break;
        
      default:
    }
  });

  return (
    <Container className="grid-wrapper">
      <Container className="grid-bg">
        {renderGrid(true)}
      </Container>
      <Container 
        className="grid" 
        onTouchStart={handleTouchMoveStart}
        onTouchMove={handleTouchMove}
      >
        {renderGrid()}
      </Container>
    </Container>
  );
}

const mapStateToProps = state => {
  let mappedStates = {
    // game
    grid: state.game.grid,
    moveCount: state.game.moveCount,
    computedGrid: state.game.computedGrid,
    computedScore: state.game.computedScore,
    newTile: state.game.newTile,
    // ui
    direction: state.ui.direction,
    destinations: state.ui.destinations,
    animPhase: state.ui.animPhase,
    // ai
    aiActive: state.ai.aiActive,
  };

  if (state.ai.aiActive) {
    mappedStates.forecastLeaves = state.ai.forecastLeaves;
  }

  return mappedStates;
}

export default connect(mapStateToProps, actions)(GameGrid);