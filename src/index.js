import "bootstrap/dist/css/bootstrap.min.css";
import "./styles.css";

import React from "react";
import ReactDOM from "react-dom";
import {Provider} from "react-redux";
import {createStore, compose} from "redux";

import {REDUX_INITIAL_STATE} from "./globalOptions";
import App from "./components/App";
import reducers from "./reducers";

const composeEnhancers = (typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose;
let store = createStore(reducers, REDUX_INITIAL_STATE, composeEnhancers());

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.querySelector("#root")
);