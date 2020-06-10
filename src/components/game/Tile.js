import React from "react";

const Tile = props => {
  return (
    <div className={props.className} style={props.style}><div>{props.value}</div></div>
  );
}

export default Tile;