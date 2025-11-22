import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadJiraConfig } from "../config";
import { taskyDb } from "@/lib/supabase/tasky-db-client";
import { decrypt } from "@/lib/encryption";

vi.mock("@/lib/supabase/tasky-db-client", () => ({
  taskyDb: {
    from: vi.fn(),
  },
}));

vi.mock("@/lib/encryption", () => ({
  decrypt: vi.fn(),
}));

describe("Jira Config Loader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should load config successfully with valid data", async () => {
    const mockData = {
      jira_url: "https://test.atlassian.net",
      jira_email: "test@example.com",
      jira_api_token_encrypted: "encrypted_token",
      jira_project_key: "TEST",
    };

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    };

    vi.mocked(taskyDb.from).mockReturnValue(mockChain as any);
    vi.mocked(decrypt).mockReturnValue("decrypted_token");

    const result = await loadJiraConfig("user123");

    expect(result).toEqual({
      jiraUrl: "https://test.atlassian.net",
      email: "test@example.com",
      apiToken: "decrypted_token",
      projectKey: "TEST",
      issueTypeId: "10001",
    });
  });

  it("should return null when config not found", async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
    };

    vi.mocked(taskyDb.from).mockReturnValue(mockChain as any);

    const result = await loadJiraConfig("user123");

    expect(result).toBeNull();
  });

  it("should return null when database error occurs", async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
    };

    vi.mocked(taskyDb.from).mockReturnValue(mockChain as any);

    const result = await loadJiraConfig("user123");

    expect(result).toBeNull();
  });

  it("should handle decryption errors", async () => {
    const mockData = {
      jira_url: "https://test.atlassian.net",
      jira_email: "test@example.com",
      jira_api_token_encrypted: "encrypted_token",
      jira_project_key: "TEST",
    };

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    };

    vi.mocked(taskyDb.from).mockReturnValue(mockChain as any);
    vi.mocked(decrypt).mockImplementation(() => {
      throw new Error("Decryption failed");
    });

    const result = await loadJiraConfig("user123");

    expect(result).toBeNull();
  });

  it("should use custom config name", async () => {
    const mockData = {
      jira_url: "https://test.atlassian.net",
      jira_email: "test@example.com",
      jira_api_token_encrypted: "encrypted_token",
      jira_project_key: "TEST",
    };

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    };

    vi.mocked(taskyDb.from).mockReturnValue(mockChain as any);
    vi.mocked(decrypt).mockReturnValue("decrypted_token");

    await loadJiraConfig("user123", "Production");

    expect(mockChain.eq).toHaveBeenCalledWith("config_name", "Production");
  });

  it("should filter by platform jira", async () => {
    const mockData = {
      jira_url: "https://test.atlassian.net",
      jira_email: "test@example.com",
      jira_api_token_encrypted: "encrypted_token",
      jira_project_key: "TEST",
    };

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    };

    vi.mocked(taskyDb.from).mockReturnValue(mockChain as any);
    vi.mocked(decrypt).mockReturnValue("decrypted_token");

    await loadJiraConfig("user123");

    expect(mockChain.eq).toHaveBeenCalledWith("platform", "jira");
  });

  it("should filter by is_active true", async () => {
    const mockData = {
      jira_url: "https://test.atlassian.net",
      jira_email: "test@example.com",
      jira_api_token_encrypted: "encrypted_token",
      jira_project_key: "TEST",
    };

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    };

    vi.mocked(taskyDb.from).mockReturnValue(mockChain as any);
    vi.mocked(decrypt).mockReturnValue("decrypted_token");

    await loadJiraConfig("user123");

    expect(mockChain.eq).toHaveBeenCalledWith("is_active", true);
  });
});
