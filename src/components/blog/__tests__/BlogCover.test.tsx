// Simple test to check if component can be imported without crashing
import BlogCover from "../BlogCover";

describe("BlogCover", () => {
  it("should be importable", () => {
    expect(BlogCover).toBeDefined();
  });
});
