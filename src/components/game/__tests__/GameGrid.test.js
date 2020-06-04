import React from "react";
import {mount} from "enzyme";
import {Row, Col} from "react-bootstrap";

import {INITIAL_GRID_STATE} from "../../../globalOptions";
import GameGrid from "../GameGrid";

let wrapper;

beforeEach(() => {
  wrapper = mount(<GameGrid grid={INITIAL_GRID_STATE()} />);
});

afterEach(() => {
  wrapper.unmount();
});

it("renders rows and columns", () => {
  expect(wrapper.find(".grid").find(Row)).toHaveLength(4);
  expect(wrapper.find(".grid").find(Col)).toHaveLength(4 * 4);
});