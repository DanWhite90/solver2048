import React from "react";
import {Container} from "react-bootstrap";
import {mount} from "enzyme";

import Tile from "../Tile"; 


let wrapper;

beforeEach(() => {
  wrapper = mount(<Tile value={1} position={{x: 2, y: 3}} />);
});

afterEach(() => {
  wrapper.unmount();
});

it("contains the right props", () => {
  expect(wrapper.props().value).toBe(1);
  expect(wrapper.props().position.x).toBe(2);
  expect(wrapper.props().position.y).toBe(3);
});

it("renders the right value", () => {
  expect(wrapper.find("div").render().length).toBe(1);
  expect(wrapper.find("div").render().text()).toBe("1");
});