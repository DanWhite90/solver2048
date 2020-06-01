import React from "react";
import {mount} from "enzyme";
import {Container, Row, Col} from "react-bootstrap";

import GameGrid from "../GameGrid";

let wrapper;

beforeEach(() => {
  wrapper = mount(<GameGrid n={3} m={4} />);
});

afterEach(() => {
  wrapper.unmount();
});

it("renders rows and columns", () => {
  expect(wrapper.find(Row)).toHaveLength(3);
  expect(wrapper.find(Col)).toHaveLength(3 * 4);
});