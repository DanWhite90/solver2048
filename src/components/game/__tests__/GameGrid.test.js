import React from "react";
import {mount} from "enzyme";
import {Row, Col} from "react-bootstrap";

import {GRID_INITIAL_STATE} from "../../../globalOptions";
import GameGrid from "../GameGrid";

let wrapper;

beforeEach(() => {
  wrapper = mount(<GameGrid grid={GRID_INITIAL_STATE()} />);
});

afterEach(() => {
  wrapper.unmount();
});

it("renders rows and columns", () => {
  expect(wrapper.find(".grid").find(Row)).toHaveLength(4);
  expect(wrapper.find(".grid").find(Col)).toHaveLength(4 * 4);
});