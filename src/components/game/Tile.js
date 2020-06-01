import React from "react";

import {Container} from "react-bootstrap";

const Tile = props => {
  return (
    <Container className="tile">{props.value}</Container>
  );
}

export default Tile;