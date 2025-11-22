import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadTrelloConfig } from "../config";
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

describe("loadTrelloConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should load valid Trello config successfully", async () => {
    const mockData = {
      trello_key_encrypted: "encrypted_key",
      trello_token_encrypted: "encrypted_token",
      trello_board_id: "board123",
    };

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    };

    vi.mocked(taskyDb.from).mockReturnValue(mockChain as any);
    vi.mocked(decrypt).mockReturnValue("decrypted_value");

    const result = await loadTrelloConfig("user123", "Default");

    expect(result).toEqual({
      trelloKey: "decrypted_value",
      trelloToken: "decrypted_value",
      trelloBoardId: "board123",
    });
  });

  it("should return null when config not found", async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
    };

    vi.mocked(taskyDb.from).mockReturnValue(mockChain as any);

    const result = await loadTrelloConfig("user123", "Default");

    expect(result).toBeNull();
  });

  it("should return null when user not authenticated", async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: "Unauthorized" } }),
    };

    vi.mocked(taskyDb.from).mockReturnValue(mockChain as any);

    const result = await loadTrelloConfig("", "Default");

    expect(result).toBeNull();
  });

  it("should handle database errors gracefully", async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockRejectedValue(new Error("Database error")),
    };

    vi.mocked(taskyDb.from).mockReturnValue(mockChain as any);

    const result = await loadTrelloConfig("user123", "Default");

    expect(result).toBeNull();
  });

  it("should handle decryption errors", async () => {
    const mockData = {
      trello_key_encrypted: "encrypted_key",
      trello_token_encrypted: "encrypted_token",
      trello_board_id: "board123",
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

    const result = await loadTrelloConfig("user123", "Default");

    expect(result).toBeNull();
  });

  it("should support multiple config names", async () => {
    const mockData = {
      trello_key_encrypted: "encrypted_key",
      trello_token_encrypted: "encrypted_token",
      trello_board_id: "board123",
    };

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    };

    vi.mocked(taskyDb.from).mockReturnValue(mockChain as any);
    vi.mocked(decrypt).mockReturnValue("decrypted_value");

    await loadTrelloConfig("user123", "Production");

    expect(mockChain.eq).toHaveBeenCalledWith("config_name", "Production");
  });
});
