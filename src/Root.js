import React from "react";
import {Provider} from "react-redux";
import {createStore, compose} from "redux";

import {REDUX_INITIAL_STATE} from "./globalOptions";
import reducers from "./reducers";

const composeEnhancers = (typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose;
let store = createStore(reducers, REDUX_INITIAL_STATE(), composeEnhancers());

export default ({children}) => {
  return (
    <Provider store={store}>
      {children}
    </Provider>
  );
};