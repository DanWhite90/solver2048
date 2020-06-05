import React from "react";

const Tile = props => {
  return (
    <div className={props.className}><div>{props.value}</div></div>
  );
}

export default Tile;