import React from "react";

import {Container} from "react-bootstrap";

const Tile = props => {
  return (
    <div className="tile"><div>{props.value}</div></div>
  );
}

export default Tile;