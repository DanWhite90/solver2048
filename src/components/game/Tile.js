import React from "react";

import {Container} from "react-bootstrap";

const Tile = props => {
  return (
    <div className={props.className}><div>{props.value}</div></div>
  );
}

export default Tile;