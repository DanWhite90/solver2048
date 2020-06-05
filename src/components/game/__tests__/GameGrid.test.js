import React from "react";
import {mount} from "enzyme";
import {Row, Col} from "react-bootstrap";

import GameGrid from "../GameGrid";
import Root from "../../../Root";

let wrapper;

beforeEach(() => {
  wrapper = mount(
    <Root>
      <GameGrid />
    </Root>
  );
});

afterEach(() => {
  wrapper.unmount();
});

it("renders rows and columns", () => {
  expect(wrapper.find(".grid").find(Row)).toHaveLength(4);
  expect(wrapper.find(".grid").find(Col)).toHaveLength(4 * 4);
});