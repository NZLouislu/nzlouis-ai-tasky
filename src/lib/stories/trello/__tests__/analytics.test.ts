import { describe, it, expect } from "vitest";
import {
  parseStoryStatus,
  calculateCompletionPercentage,
  identifyBlockedStories,
  getHighPriorityBacklog,
  generateProgressReport,
  generateDailyReport,
} from "../analytics";

const sampleMarkdown = `
## Backlog

- Story: STORY-001 Setup Infrastructure
  Description: Initialize project
  Acceptance_Criteria:
    - [ ] Install packages
    - [ ] Configure environment
  Priority: High
  Labels: [setup, infrastructure]

- Story: STORY-002 Create Database Schema
  Description: Design database
  Priority: Medium
  Labels: [database]

## Ready

- Story: STORY-003 Implement Authentication
  Description: Add auth
  Priority: High
  Labels: [auth, security]

## In Progress

- Story: STORY-004 Build API
  Description: Create REST API
  Priority: High
  Labels: [api, blocked]

- Story: STORY-005 Add Tests
  Description: Write tests
  Priority: Medium
  Labels: [testing]

## Done

- Story: STORY-006 Setup CI/CD
  Description: Configure pipeline
  Priority: High
  Labels: [devops]
`;

describe("parseStoryStatus", () => {
  it("should parse stories from markdown", () => {
    const stories = parseStoryStatus(sampleMarkdown);
    expect(stories.length).toBe(6);
  });

  it("should extract story IDs correctly", () => {
    const stories = parseStoryStatus(sampleMarkdown);
    expect(stories[0].id).toBe("STORY-001");
    expect(stories[1].id).toBe("STORY-002");
  });

  it("should extract story titles correctly", () => {
    const stories = parseStoryStatus(sampleMarkdown);
    expect(stories[0].title).toBe("Setup Infrastructure");
  });

  it("should extract status correctly", () => {
    const stories = parseStoryStatus(sampleMarkdown);
    expect(stories[0].status).toBe("Backlog");
    expect(stories[2].status).toBe("Ready");
    expect(stories[3].status).toBe("In Progress");
    expect(stories[5].status).toBe("Done");
  });

  it("should extract priority correctly", () => {
    const stories = parseStoryStatus(sampleMarkdown);
    expect(stories[0].priority).toBe("High");
    expect(stories[1].priority).toBe("Medium");
  });

  it("should extract labels correctly", () => {
    const stories = parseStoryStatus(sampleMarkdown);
    expect(stories[0].labels).toEqual(["setup", "infrastructure"]);
    expect(stories[3].labels).toEqual(["api", "blocked"]);
  });

  it("should handle empty markdown", () => {
    const stories = parseStoryStatus("");
    expect(stories).toEqual([]);
  });
});

describe("calculateCompletionPercentage", () => {
  it("should calculate completion percentage", () => {
    const stories = parseStoryStatus(sampleMarkdown);
    const percentage = calculateCompletionPercentage(stories);
    expect(percentage).toBe(17);
  });

  it("should return 0 for empty list", () => {
    const percentage = calculateCompletionPercentage([]);
    expect(percentage).toBe(0);
  });

  it("should return 100 for all done", () => {
    const stories = [
      { id: "1", title: "Test", status: "Done", priority: "High", labels: [], acceptanceCriteria: [] },
      { id: "2", title: "Test", status: "Done", priority: "High", labels: [], acceptanceCriteria: [] },
    ];
    const percentage = calculateCompletionPercentage(stories);
    expect(percentage).toBe(100);
  });
});

describe("identifyBlockedStories", () => {
  it("should identify blocked stories", () => {
    const stories = parseStoryStatus(sampleMarkdown);
    const blocked = identifyBlockedStories(stories);
    expect(blocked.length).toBe(1);
    expect(blocked[0].id).toBe("STORY-004");
  });

  it("should return empty array if no blocked stories", () => {
    const stories = [
      { id: "1", title: "Test", status: "In Progress", priority: "High", labels: [], acceptanceCriteria: [] },
    ];
    const blocked = identifyBlockedStories(stories);
    expect(blocked).toEqual([]);
  });
});

describe("getHighPriorityBacklog", () => {
  it("should get high priority backlog items", () => {
    const stories = parseStoryStatus(sampleMarkdown);
    const highPriority = getHighPriorityBacklog(stories);
    expect(highPriority.length).toBe(1);
    expect(highPriority[0].id).toBe("STORY-001");
  });

  it("should return empty array if no high priority backlog", () => {
    const stories = [
      { id: "1", title: "Test", status: "Backlog", priority: "Low", labels: [], acceptanceCriteria: [] },
    ];
    const highPriority = getHighPriorityBacklog(stories);
    expect(highPriority).toEqual([]);
  });
});

describe("generateProgressReport", () => {
  it("should generate complete progress report", () => {
    const report = generateProgressReport(sampleMarkdown);

    expect(report.totalStories).toBe(6);
    expect(report.completionPercentage).toBe(17);
    expect(report.byStatus.Backlog).toBe(2);
    expect(report.byStatus.Ready).toBe(1);
    expect(report.byStatus["In Progress"]).toBe(2);
    expect(report.byStatus.Done).toBe(1);
  });

  it("should include recommendations", () => {
    const report = generateProgressReport(sampleMarkdown);
    expect(report.recommendations.length).toBeGreaterThan(0);
  });

  it("should identify blocked stories in recommendations", () => {
    const report = generateProgressReport(sampleMarkdown);
    const hasBlockedRecommendation = report.recommendations.some((r) =>
      r.includes("blocked")
    );
    expect(hasBlockedRecommendation).toBe(true);
  });

  it("should identify high priority backlog in recommendations", () => {
    const report = generateProgressReport(sampleMarkdown);
    const hasHighPriorityRecommendation = report.recommendations.some((r) =>
      r.includes("high-priority")
    );
    expect(hasHighPriorityRecommendation).toBe(true);
  });
});

describe("generateDailyReport", () => {
  it("should generate formatted daily report", () => {
    const report = generateDailyReport(sampleMarkdown);
    expect(report).toContain("Daily Progress Report");
    expect(report).toContain("Total Stories: 6");
    expect(report).toContain("Completion: 17%");
  });

  it("should include status breakdown", () => {
    const report = generateDailyReport(sampleMarkdown);
    expect(report).toContain("Backlog: 2");
    expect(report).toContain("Ready: 1");
    expect(report).toContain("In Progress: 2");
    expect(report).toContain("Done: 1");
  });

  it("should include recommendations", () => {
    const report = generateDailyReport(sampleMarkdown);
    expect(report).toContain("Recommendations");
  });
});
