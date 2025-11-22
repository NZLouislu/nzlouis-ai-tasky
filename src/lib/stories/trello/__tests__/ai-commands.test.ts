import { describe, it, expect } from "vitest";
import { detectAICommand, getAICommandSuggestions } from "../ai-commands";

const sampleMarkdown = `
## Backlog

- Story: STORY-001 Setup Infrastructure
  Description: Initialize project
  Acceptance_Criteria:
    - [ ] Install packages
  Priority: High
  Labels: [setup]

- Story: STORY-002 Create Database
  Description: Design database
  Priority: Medium
  Labels: [database]

## Ready

- Story: STORY-003 Implement Auth
  Description: Add auth
  Priority: High
  Labels: [auth]

## In Progress

- Story: STORY-004 Build API
  Description: Create API
  Priority: High
  Labels: [api, blocked]

## Done

- Story: STORY-005 Setup CI/CD
  Description: Configure pipeline
  Priority: High
  Labels: [devops]
`;

describe("AI Commands", () => {
  describe("move_to_ready", () => {
    it("should move story to Ready list", () => {
      const result = detectAICommand("move STORY-001 to ready", sampleMarkdown);
      expect(result).not.toBeNull();
      expect(result?.command.type).toBe("move_to_ready");
      expect(result?.result).toContain("## Ready");
      expect(result?.result).toContain("STORY-001");
    });

    it("should handle 'move story STORY-001 to ready'", () => {
      const result = detectAICommand(
        "move story STORY-001 to ready",
        sampleMarkdown
      );
      expect(result).not.toBeNull();
      expect(result?.command.type).toBe("move_to_ready");
    });
  });

  describe("move_to_in_progress", () => {
    it("should move story to In Progress list", () => {
      const result = detectAICommand(
        "move STORY-002 to progress",
        sampleMarkdown
      );
      expect(result).not.toBeNull();
      expect(result?.command.type).toBe("move_to_in_progress");
      expect(result?.result).toContain("## In Progress");
      expect(result?.result).toContain("STORY-002");
    });

    it("should handle 'move to in progress'", () => {
      const result = detectAICommand(
        "move STORY-002 to in progress",
        sampleMarkdown
      );
      expect(result).not.toBeNull();
    });
  });

  describe("move_to_done", () => {
    it("should move story to Done list", () => {
      const result = detectAICommand("move STORY-003 to done", sampleMarkdown);
      expect(result).not.toBeNull();
      expect(result?.command.type).toBe("move_to_done");
      expect(result?.result).toContain("## Done");
      expect(result?.result).toContain("STORY-003");
    });
  });

  describe("generate_progress_report", () => {
    it("should generate progress report", () => {
      const result = detectAICommand(
        "generate progress report",
        sampleMarkdown
      );
      expect(result).not.toBeNull();
      expect(result?.command.type).toBe("generate_progress_report");
      expect(result?.result).toContain("Progress Report");
      expect(result?.result).toContain("Total Stories");
      expect(result?.result).toContain("Completion");
    });

    it("should handle 'generate a progress report'", () => {
      const result = detectAICommand(
        "generate a progress report",
        sampleMarkdown
      );
      expect(result).not.toBeNull();
    });
  });

  describe("add_story", () => {
    it("should add new story to Backlog", () => {
      const result = detectAICommand(
        "add story: Implement User Profile",
        sampleMarkdown
      );
      expect(result).not.toBeNull();
      expect(result?.command.type).toBe("add_story");
      expect(result?.result).toContain("Implement User Profile");
      expect(result?.result).toContain("STORY-006");
    });

    it("should handle 'add a new story'", () => {
      const result = detectAICommand(
        "add a new story Create Login Page",
        sampleMarkdown
      );
      expect(result).not.toBeNull();
      expect(result?.result).toContain("Create Login Page");
    });
  });

  describe("set_priority", () => {
    it("should set story priority to High", () => {
      const result = detectAICommand(
        "set STORY-002 priority to high",
        sampleMarkdown
      );
      expect(result).not.toBeNull();
      expect(result?.command.type).toBe("set_priority");
      expect(result?.result).toContain("Priority: High");
    });

    it("should set story priority to Low", () => {
      const result = detectAICommand(
        "set story STORY-001 priority to low",
        sampleMarkdown
      );
      expect(result).not.toBeNull();
      expect(result?.result).toContain("Priority: Low");
    });
  });

  describe("add_label", () => {
    it("should add label to story", () => {
      const result = detectAICommand(
        "add label urgent to STORY-001",
        sampleMarkdown
      );
      expect(result).not.toBeNull();
      expect(result?.command.type).toBe("add_label");
      expect(result?.result).toContain("urgent");
    });

    it("should not duplicate existing labels", () => {
      const result = detectAICommand(
        "add label setup to STORY-001",
        sampleMarkdown
      );
      expect(result).not.toBeNull();
      const labelCount = (result?.result.match(/setup/g) || []).length;
      expect(labelCount).toBeLessThanOrEqual(2);
    });
  });

  describe("check_blocked", () => {
    it("should list blocked stories", () => {
      const result = detectAICommand("check blocked stories", sampleMarkdown);
      expect(result).not.toBeNull();
      expect(result?.command.type).toBe("check_blocked");
      expect(result?.result).toContain("STORY-004");
    });

    it("should handle 'show blocked stories'", () => {
      const result = detectAICommand("show blocked stories", sampleMarkdown);
      expect(result).not.toBeNull();
    });

    it("should handle 'list blocked stories'", () => {
      const result = detectAICommand("list blocked stories", sampleMarkdown);
      expect(result).not.toBeNull();
    });
  });

  describe("getAICommandSuggestions", () => {
    it("should return list of command descriptions", () => {
      const suggestions = getAICommandSuggestions();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions).toContain("Move story to Ready list");
      expect(suggestions).toContain("Generate progress report");
    });
  });

  describe("detectAICommand", () => {
    it("should return null for unknown commands", () => {
      const result = detectAICommand("do something random", sampleMarkdown);
      expect(result).toBeNull();
    });

    it("should be case insensitive", () => {
      const result = detectAICommand("MOVE STORY-001 TO READY", sampleMarkdown);
      expect(result).not.toBeNull();
    });
  });
});
