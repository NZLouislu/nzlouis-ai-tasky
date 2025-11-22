import { describe, it, expect } from "vitest";
import {
  mapAliasToTrelloMember,
  getLabelColor,
  parseAssignees,
  parseLabels,
  createMemberMapping,
  createLabelColorMapping,
  defaultMemberMappings,
  defaultLabelColors,
} from "../member-mapping";

describe("Member Mapping", () => {
  describe("mapAliasToTrelloMember", () => {
    it("should map alias to Trello username", () => {
      const result = mapAliasToTrelloMember("developer");
      expect(result).toBe("developer");
    });

    it("should be case insensitive", () => {
      const result = mapAliasToTrelloMember("DEVELOPER");
      expect(result).toBe("developer");
    });

    it("should return null for unknown alias", () => {
      const result = mapAliasToTrelloMember("unknown");
      expect(result).toBeNull();
    });

    it("should use custom mappings", () => {
      const customMappings = [
        { alias: "dev", trelloUsername: "john_doe" },
      ];
      const result = mapAliasToTrelloMember("dev", customMappings);
      expect(result).toBe("john_doe");
    });
  });

  describe("getLabelColor", () => {
    it("should return color for known label", () => {
      expect(getLabelColor("bug")).toBe("red");
      expect(getLabelColor("feature")).toBe("green");
      expect(getLabelColor("urgent")).toBe("orange");
    });

    it("should be case insensitive", () => {
      expect(getLabelColor("BUG")).toBe("red");
      expect(getLabelColor("Feature")).toBe("green");
    });

    it("should return default color for unknown label", () => {
      const result = getLabelColor("unknown");
      expect(result).toBe("sky");
    });

    it("should use custom color mappings", () => {
      const customColors = [
        { labelName: "custom", color: "lime" },
      ];
      const result = getLabelColor("custom", customColors);
      expect(result).toBe("lime");
    });
  });

  describe("parseAssignees", () => {
    it("should parse assignees from string", () => {
      const result = parseAssignees("Assignees: [developer, tester]");
      expect(result).toEqual(["developer", "tester"]);
    });

    it("should handle single assignee", () => {
      const result = parseAssignees("Assignees: [developer]");
      expect(result).toEqual(["developer"]);
    });

    it("should handle empty brackets", () => {
      const result = parseAssignees("Assignees: []");
      expect(result).toEqual([]);
    });

    it("should handle no brackets", () => {
      const result = parseAssignees("Assignees: developer");
      expect(result).toEqual([]);
    });

    it("should trim whitespace", () => {
      const result = parseAssignees("Assignees: [ developer , tester ]");
      expect(result).toEqual(["developer", "tester"]);
    });
  });

  describe("parseLabels", () => {
    it("should parse labels from string", () => {
      const result = parseLabels("Labels: [bug, feature, urgent]");
      expect(result).toEqual(["bug", "feature", "urgent"]);
    });

    it("should handle single label", () => {
      const result = parseLabels("Labels: [bug]");
      expect(result).toEqual(["bug"]);
    });

    it("should handle empty brackets", () => {
      const result = parseLabels("Labels: []");
      expect(result).toEqual([]);
    });

    it("should trim whitespace", () => {
      const result = parseLabels("Labels: [ bug , feature ]");
      expect(result).toEqual(["bug", "feature"]);
    });
  });

  describe("createMemberMapping", () => {
    it("should create member mapping without ID", () => {
      const mapping = createMemberMapping("dev", "john_doe");
      expect(mapping).toEqual({
        alias: "dev",
        trelloUsername: "john_doe",
        trelloMemberId: undefined,
      });
    });

    it("should create member mapping with ID", () => {
      const mapping = createMemberMapping("dev", "john_doe", "member123");
      expect(mapping).toEqual({
        alias: "dev",
        trelloUsername: "john_doe",
        trelloMemberId: "member123",
      });
    });
  });

  describe("createLabelColorMapping", () => {
    it("should create label color mapping", () => {
      const mapping = createLabelColorMapping("custom", "lime");
      expect(mapping).toEqual({
        labelName: "custom",
        color: "lime",
      });
    });
  });

  describe("defaultMemberMappings", () => {
    it("should have default mappings", () => {
      expect(defaultMemberMappings.length).toBeGreaterThan(0);
      expect(defaultMemberMappings).toContainEqual({
        alias: "developer",
        trelloUsername: "developer",
      });
    });
  });

  describe("defaultLabelColors", () => {
    it("should have default colors", () => {
      expect(defaultLabelColors.length).toBeGreaterThan(0);
      expect(defaultLabelColors).toContainEqual({
        labelName: "bug",
        color: "red",
      });
    });
  });
});
