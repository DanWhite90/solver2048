import React from "react";
import {mount} from "enzyme";

import Tile from "../Tile"; 


let wrapper;

beforeEach(() => {
  wrapper = mount(<Tile value={1} position={{x: 2, y: 3}} />);
});

afterEach(() => {
  wrapper.unmount();
});

it("renders the right value", () => {
  expect(wrapper.length).toBe(1);
  expect(wrapper.text()).toBe("1");
});