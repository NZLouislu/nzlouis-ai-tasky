import { describe, it, expect, vi, beforeEach } from "vitest";
import { syncToTrello, syncFromTrello } from "../sync";
import { loadTrelloConfig } from "../config";
import { mdToTrello, trelloToMd } from "trello-md-sync";

vi.mock("../config");
vi.mock("trello-md-sync");

describe("syncToTrello", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should sync to Trello successfully", async () => {
    const mockConfig = {
      trelloKey: "test_key",
      trelloToken: "test_token",
      trelloBoardId: "board123",
    };

    (loadTrelloConfig as any).mockResolvedValue(mockConfig);
    (mdToTrello as any).mockResolvedValue({
      result: { created: 5, updated: 2 },
    });

    const result = await syncToTrello({
      userId: "user123",
      inputDir: "./test",
      configName: "Default",
      dryRun: false,
    });

    expect(result).toEqual({ created: 5, updated: 2 });
    expect(loadTrelloConfig).toHaveBeenCalledWith("user123", "Default");
    expect(mdToTrello).toHaveBeenCalledWith({
      trelloKey: "test_key",
      trelloToken: "test_token",
      trelloBoardId: "board123",
      mdInputDir: "./test",
      mdOutputDir: "./trello_export",
      logLevel: "info",
      dryRun: false,
      ensureLabels: true,
    });
  });

  it("should throw error when inputDir is missing", async () => {
    await expect(
      syncToTrello({
        userId: "user123",
        configName: "Default",
      })
    ).rejects.toThrow("inputDir is required");
  });

  it("should throw error when config not found", async () => {
    (loadTrelloConfig as any).mockResolvedValue(null);

    await expect(
      syncToTrello({
        userId: "user123",
        inputDir: "./test",
        configName: "Default",
      })
    ).rejects.toThrow("Trello configuration not found");
  });

  it("should support dry-run mode", async () => {
    const mockConfig = {
      trelloKey: "test_key",
      trelloToken: "test_token",
      trelloBoardId: "board123",
    };

    (loadTrelloConfig as any).mockResolvedValue(mockConfig);
    (mdToTrello as any).mockResolvedValue({
      result: { created: 0, updated: 0 },
    });

    await syncToTrello({
      userId: "user123",
      inputDir: "./test",
      configName: "Default",
      dryRun: true,
    });

    expect(mdToTrello).toHaveBeenCalledWith(
      expect.objectContaining({ dryRun: true })
    );
  });

  it("should support ensureLabels option", async () => {
    const mockConfig = {
      trelloKey: "test_key",
      trelloToken: "test_token",
      trelloBoardId: "board123",
    };

    (loadTrelloConfig as any).mockResolvedValue(mockConfig);
    (mdToTrello as any).mockResolvedValue({
      result: { created: 5, updated: 2 },
    });

    await syncToTrello({
      userId: "user123",
      inputDir: "./test",
      configName: "Default",
    });

    expect(mdToTrello).toHaveBeenCalledWith(
      expect.objectContaining({ ensureLabels: true })
    );
  });

  it("should handle API failures", async () => {
    const mockConfig = {
      trelloKey: "test_key",
      trelloToken: "test_token",
      trelloBoardId: "board123",
    };

    (loadTrelloConfig as any).mockResolvedValue(mockConfig);
    (mdToTrello as any).mockRejectedValue(new Error("API error"));

    await expect(
      syncToTrello({
        userId: "user123",
        inputDir: "./test",
        configName: "Default",
      })
    ).rejects.toThrow("API error");
  });
});

describe("syncFromTrello", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should sync from Trello successfully", async () => {
    const mockConfig = {
      trelloKey: "test_key",
      trelloToken: "test_token",
      trelloBoardId: "board123",
    };

    (loadTrelloConfig as any).mockResolvedValue(mockConfig);
    (trelloToMd as any).mockResolvedValue({
      written: 10,
    });

    const result = await syncFromTrello({
      userId: "user123",
      outputDir: "./output",
      configName: "Default",
    });

    expect(result).toEqual({ written: 10 });
    expect(loadTrelloConfig).toHaveBeenCalledWith("user123", "Default");
    expect(trelloToMd).toHaveBeenCalledWith({
      trelloKey: "test_key",
      trelloToken: "test_token",
      trelloBoardId: "board123",
      mdOutputDir: "./output",
    });
  });

  it("should throw error when outputDir is missing", async () => {
    await expect(
      syncFromTrello({
        userId: "user123",
        configName: "Default",
      })
    ).rejects.toThrow("outputDir is required");
  });

  it("should throw error when config not found", async () => {
    (loadTrelloConfig as any).mockResolvedValue(null);

    await expect(
      syncFromTrello({
        userId: "user123",
        outputDir: "./output",
        configName: "Default",
      })
    ).rejects.toThrow("Trello configuration not found");
  });

  it("should handle API failures", async () => {
    const mockConfig = {
      trelloKey: "test_key",
      trelloToken: "test_token",
      trelloBoardId: "board123",
    };

    (loadTrelloConfig as any).mockResolvedValue(mockConfig);
    (trelloToMd as any).mockRejectedValue(new Error("API error"));

    await expect(
      syncFromTrello({
        userId: "user123",
        outputDir: "./output",
        configName: "Default",
      })
    ).rejects.toThrow("API error");
  });

  it("should handle large file processing", async () => {
    const mockConfig = {
      trelloKey: "test_key",
      trelloToken: "test_token",
      trelloBoardId: "board123",
    };

    (loadTrelloConfig as any).mockResolvedValue(mockConfig);
    (trelloToMd as any).mockResolvedValue({
      written: 500,
    });

    const result = await syncFromTrello({
      userId: "user123",
      outputDir: "./output",
      configName: "Default",
    });

    expect(result.written).toBe(500);
  });
});
