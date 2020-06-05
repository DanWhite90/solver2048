import "bootstrap/dist/css/bootstrap.min.css";
import "./styles.css";

import React from "react";
import ReactDOM from "react-dom";

import Root from "./Root";
import App from "./components/App";

ReactDOM.render(
  <Root>
    <App />
  </Root>,
  document.querySelector("#root")
);