import { describe, it, expect, vi, beforeEach } from "vitest";
import { syncToJira, syncFromJira } from "../sync";
import { loadJiraConfig } from "../config";
import { mdToJira, jiraToMd } from "jira-md-sync";

vi.mock("../config");
vi.mock("jira-md-sync");

describe("Jira Sync Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("syncToJira", () => {
    it("should sync successfully with valid config", async () => {
      const mockConfig = {
        jiraUrl: "https://test.atlassian.net",
        email: "test@example.com",
        apiToken: "token123",
        projectKey: "TEST",
        issueTypeId: "10001",
      };

      vi.mocked(loadJiraConfig).mockResolvedValue(mockConfig);
      vi.mocked(mdToJira).mockResolvedValue({
        created: 5,
        skipped: 2,
        errors: 0,
      } as any);

      const result = await syncToJira({
        userId: "user123",
        inputDir: "/test/dir",
      });

      expect(result).toEqual({
        created: 5,
        skipped: 2,
        errors: 0,
      });
    });

    it("should throw error when inputDir is missing", async () => {
      await expect(
        syncToJira({
          userId: "user123",
        })
      ).rejects.toThrow("inputDir is required");
    });

    it("should throw error when config not found", async () => {
      vi.mocked(loadJiraConfig).mockResolvedValue(null);

      await expect(
        syncToJira({
          userId: "user123",
          inputDir: "/test/dir",
        })
      ).rejects.toThrow("Jira configuration not found");
    });

    it("should support dry run mode", async () => {
      const mockConfig = {
        jiraUrl: "https://test.atlassian.net",
        email: "test@example.com",
        apiToken: "token123",
        projectKey: "TEST",
        issueTypeId: "10001",
      };

      vi.mocked(loadJiraConfig).mockResolvedValue(mockConfig);
      vi.mocked(mdToJira).mockResolvedValue({
        created: 0,
        skipped: 5,
        errors: 0,
      } as any);

      await syncToJira({
        userId: "user123",
        inputDir: "/test/dir",
        dryRun: true,
      });

      expect(mdToJira).toHaveBeenCalledWith(
        expect.objectContaining({
          dryRun: true,
        })
      );
    });

    it("should use custom config name", async () => {
      const mockConfig = {
        jiraUrl: "https://test.atlassian.net",
        email: "test@example.com",
        apiToken: "token123",
        projectKey: "TEST",
        issueTypeId: "10001",
      };

      vi.mocked(loadJiraConfig).mockResolvedValue(mockConfig);
      vi.mocked(mdToJira).mockResolvedValue({
        created: 5,
        skipped: 2,
        errors: 0,
      } as any);

      await syncToJira({
        userId: "user123",
        inputDir: "/test/dir",
        configName: "Production",
      });

      expect(loadJiraConfig).toHaveBeenCalledWith("user123", "Production");
    });
  });

  describe("syncFromJira", () => {
    it("should download successfully with valid config", async () => {
      const mockConfig = {
        jiraUrl: "https://test.atlassian.net",
        email: "test@example.com",
        apiToken: "token123",
        projectKey: "TEST",
      };

      vi.mocked(loadJiraConfig).mockResolvedValue(mockConfig);
      vi.mocked(jiraToMd).mockResolvedValue({
        written: 10,
        totalIssues: 10,
      } as any);

      const result = await syncFromJira({
        userId: "user123",
        outputDir: "/test/output",
      });

      expect(result).toEqual({
        written: 10,
        totalIssues: 10,
      });
    });

    it("should throw error when outputDir is missing", async () => {
      await expect(
        syncFromJira({
          userId: "user123",
        })
      ).rejects.toThrow("outputDir is required");
    });

    it("should throw error when config not found", async () => {
      vi.mocked(loadJiraConfig).mockResolvedValue(null);

      await expect(
        syncFromJira({
          userId: "user123",
          outputDir: "/test/output",
        })
      ).rejects.toThrow("Jira configuration not found");
    });

    it("should support custom JQL query", async () => {
      const mockConfig = {
        jiraUrl: "https://test.atlassian.net",
        email: "test@example.com",
        apiToken: "token123",
        projectKey: "TEST",
      };

      vi.mocked(loadJiraConfig).mockResolvedValue(mockConfig);
      vi.mocked(jiraToMd).mockResolvedValue({
        written: 5,
        totalIssues: 5,
      } as any);

      await syncFromJira({
        userId: "user123",
        outputDir: "/test/output",
        jql: "status = Done",
      });

      expect(jiraToMd).toHaveBeenCalledWith(
        expect.objectContaining({
          jql: "status = Done",
        })
      );
    });

    it("should use custom config name", async () => {
      const mockConfig = {
        jiraUrl: "https://test.atlassian.net",
        email: "test@example.com",
        apiToken: "token123",
        projectKey: "TEST",
      };

      vi.mocked(loadJiraConfig).mockResolvedValue(mockConfig);
      vi.mocked(jiraToMd).mockResolvedValue({
        written: 10,
        totalIssues: 10,
      } as any);

      await syncFromJira({
        userId: "user123",
        outputDir: "/test/output",
        configName: "Production",
      });

      expect(loadJiraConfig).toHaveBeenCalledWith("user123", "Production");
    });

    it("should preserve label order using inputDir", async () => {
      const mockConfig = {
        jiraUrl: "https://test.atlassian.net",
        email: "test@example.com",
        apiToken: "token123",
        projectKey: "TEST",
      };

      vi.mocked(loadJiraConfig).mockResolvedValue(mockConfig);
      vi.mocked(jiraToMd).mockResolvedValue({
        written: 10,
        totalIssues: 10,
      } as any);

      await syncFromJira({
        userId: "user123",
        outputDir: "/test/output",
      });

      expect(jiraToMd).toHaveBeenCalledWith(
        expect.objectContaining({
          inputDir: "/test/output",
        })
      );
    });
  });
});
