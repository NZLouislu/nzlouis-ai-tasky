// Simple test to check if component can be imported without crashing
import BlogContent from "../BlogContent";

describe("BlogContent", () => {
  it("should be importable", () => {
    expect(BlogContent).toBeDefined();
  });
});
