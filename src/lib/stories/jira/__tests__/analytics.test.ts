import { describe, it, expect } from "vitest";
import {
  parseStoryStatuses,
  calculateCompletionPercentage,
  analyzeProgress,
  generateProgressReport,
} from "../analytics";

const sampleMarkdown = `## Backlog

- Story: JIRA-001 Setup Project
  Description: Initialize project
  Priority: High

- Story: JIRA-002 Add Tests
  Description: Add unit tests
  Priority: Medium

## In Progress

- Story: JIRA-003 Implement Feature
  Description: Working on feature
  Priority: High

## Done

- Story: JIRA-004 Fix Bug
  Description: Bug fixed
  Priority: Low

- Story: JIRA-005 Update Docs
  Description: Documentation updated
  Priority: Medium
`;

describe("Story Analytics", () => {
  describe("parseStoryStatuses", () => {
    it("should parse story statuses correctly", () => {
      const statusMap = parseStoryStatuses(sampleMarkdown);

      expect(statusMap.size).toBe(3);
      expect(statusMap.get("Backlog")).toHaveLength(2);
      expect(statusMap.get("In Progress")).toHaveLength(1);
      expect(statusMap.get("Done")).toHaveLength(2);
    });

    it("should handle empty content", () => {
      const statusMap = parseStoryStatuses("");
      expect(statusMap.size).toBe(0);
    });

    it("should handle content with no stories", () => {
      const content = "## Backlog\n\nNo stories yet";
      const statusMap = parseStoryStatuses(content);
      expect(statusMap.get("Backlog")).toEqual([]);
    });
  });

  describe("calculateCompletionPercentage", () => {
    it("should calculate completion percentage correctly", () => {
      const statusMap = parseStoryStatuses(sampleMarkdown);
      const percentage = calculateCompletionPercentage(statusMap);

      expect(percentage).toBe(40);
    });

    it("should return 0 for empty status map", () => {
      const statusMap = new Map();
      const percentage = calculateCompletionPercentage(statusMap);

      expect(percentage).toBe(0);
    });

    it("should handle 100% completion", () => {
      const content = "## Done\n\n- Story: Test\n";
      const statusMap = parseStoryStatuses(content);
      const percentage = calculateCompletionPercentage(statusMap);

      expect(percentage).toBe(100);
    });
  });

  describe("analyzeProgress", () => {
    it("should analyze progress correctly", () => {
      const analysis = analyzeProgress(sampleMarkdown);

      expect(analysis.totalStories).toBe(5);
      expect(analysis.completionPercentage).toBe(40);
      expect(analysis.statusBreakdown).toHaveLength(3);
    });

    it("should identify high priority backlog items", () => {
      const analysis = analyzeProgress(sampleMarkdown);

      expect(analysis.highPriorityBacklog).toContain("JIRA-001 Setup Project");
    });

    it("should identify stalled stories", () => {
      const analysis = analyzeProgress(sampleMarkdown);

      expect(analysis.stalledStories).toContain("JIRA-003 Implement Feature");
    });

    it("should handle blocked stories", () => {
      const content = `## In Progress\n\n- Story: JIRA-001 Test\n  Status: Blocked\n`;
      const analysis = analyzeProgress(content);

      expect(analysis.blockedStories).toContain("JIRA-001 Test");
    });
  });

  describe("generateProgressReport", () => {
    it("should generate a progress report", () => {
      const analysis = analyzeProgress(sampleMarkdown);
      const report = generateProgressReport(analysis);

      expect(report).toContain("Project Progress Report");
      expect(report).toContain("Total Stories: 5");
      expect(report).toContain("Completion: 40%");
      expect(report).toContain("Status Breakdown");
    });

    it("should include high priority items", () => {
      const analysis = analyzeProgress(sampleMarkdown);
      const report = generateProgressReport(analysis);

      expect(report).toContain("High Priority Items in Backlog");
      expect(report).toContain("JIRA-001 Setup Project");
    });

    it("should include stalled stories", () => {
      const analysis = analyzeProgress(sampleMarkdown);
      const report = generateProgressReport(analysis);

      expect(report).toContain("In Progress (Potential Stalls)");
    });
  });
});
