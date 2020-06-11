import React from "react";
import {mount} from "enzyme";

import GameGrid from "../GameGrid";
import Tile from "../Tile";
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
  expect(wrapper.find(".grid").find(Tile)).toHaveLength(4 * 4);
});