// Simple test to check if component can be imported without crashing

import Blog from "../Blog";

describe("Blog", () => {
  it("should be importable", () => {
    expect(Blog).toBeDefined();
  });
});
