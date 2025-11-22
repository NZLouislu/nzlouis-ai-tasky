import { describe, it, expect } from "vitest";
import {
  generateStoryId,
  validateStoryId,
  extractStoryIds,
  hasDuplicateIds,
  findDuplicateIds,
  addStoryIdToMarkdown,
} from "../story-id";

describe("generateStoryId", () => {
  it("should generate STORY-001 for empty list", () => {
    const id = generateStoryId([]);
    expect(id).toBe("STORY-001");
  });

  it("should generate next available ID", () => {
    const id = generateStoryId(["STORY-001", "STORY-002"]);
    expect(id).toBe("STORY-003");
  });

  it("should skip existing IDs", () => {
    const id = generateStoryId(["STORY-001", "STORY-003"]);
    expect(id).toBe("STORY-002");
  });

  it("should handle large numbers", () => {
    const id = generateStoryId(["STORY-099", "STORY-100"]);
    expect(id).toBe("STORY-001");
  });
});

describe("validateStoryId", () => {
  it("should validate correct format", () => {
    expect(validateStoryId("STORY-001")).toBe(true);
    expect(validateStoryId("STORY-999")).toBe(true);
    expect(validateStoryId("STORY-1234")).toBe(true);
  });

  it("should reject invalid formats", () => {
    expect(validateStoryId("STORY-1")).toBe(false);
    expect(validateStoryId("STORY-12")).toBe(false);
    expect(validateStoryId("story-001")).toBe(false);
    expect(validateStoryId("STORY001")).toBe(false);
    expect(validateStoryId("TASK-001")).toBe(false);
  });
});

describe("extractStoryIds", () => {
  it("should extract IDs from markdown", () => {
    const markdown = `
## Backlog

- Story: STORY-001 First Story
  Description: Test

- Story: STORY-002 Second Story
  Description: Test
    `;

    const ids = extractStoryIds(markdown);
    expect(ids).toEqual(["STORY-001", "STORY-002"]);
  });

  it("should return empty array for no IDs", () => {
    const markdown = "No stories here";
    const ids = extractStoryIds(markdown);
    expect(ids).toEqual([]);
  });

  it("should handle multiple sections", () => {
    const markdown = `
## Backlog
- Story: STORY-001 First

## In Progress
- Story: STORY-002 Second

## Done
- Story: STORY-003 Third
    `;

    const ids = extractStoryIds(markdown);
    expect(ids).toEqual(["STORY-001", "STORY-002", "STORY-003"]);
  });
});

describe("hasDuplicateIds", () => {
  it("should detect duplicates", () => {
    expect(hasDuplicateIds(["STORY-001", "STORY-001"])).toBe(true);
    expect(hasDuplicateIds(["STORY-001", "STORY-002", "STORY-001"])).toBe(true);
  });

  it("should return false for unique IDs", () => {
    expect(hasDuplicateIds(["STORY-001", "STORY-002"])).toBe(false);
    expect(hasDuplicateIds([])).toBe(false);
  });
});

describe("findDuplicateIds", () => {
  it("should find duplicate IDs", () => {
    const duplicates = findDuplicateIds([
      "STORY-001",
      "STORY-002",
      "STORY-001",
      "STORY-003",
      "STORY-002",
    ]);
    expect(duplicates).toEqual(expect.arrayContaining(["STORY-001", "STORY-002"]));
    expect(duplicates.length).toBe(2);
  });

  it("should return empty array for no duplicates", () => {
    const duplicates = findDuplicateIds(["STORY-001", "STORY-002"]);
    expect(duplicates).toEqual([]);
  });
});

describe("addStoryIdToMarkdown", () => {
  it("should add IDs to stories without them", () => {
    const markdown = `
- Story: First Story
  Description: Test
    `;

    const result = addStoryIdToMarkdown(markdown, []);
    expect(result).toContain("- Story: STORY-001 First Story");
  });

  it("should preserve existing IDs", () => {
    const markdown = `
- Story: STORY-001 First Story
  Description: Test
    `;

    const result = addStoryIdToMarkdown(markdown, ["STORY-001"]);
    expect(result).toContain("- Story: STORY-001 First Story");
  });

  it("should generate unique IDs", () => {
    const markdown = `
- Story: First Story
- Story: Second Story
    `;

    const result = addStoryIdToMarkdown(markdown, []);
    expect(result).toContain("STORY-001");
    expect(result).toContain("STORY-002");
  });

  it("should avoid duplicate IDs", () => {
    const markdown = `
- Story: First Story
- Story: Second Story
    `;

    const result = addStoryIdToMarkdown(markdown, ["STORY-001"]);
    expect(result).toContain("STORY-002");
    expect(result).toContain("STORY-003");
  });
});
