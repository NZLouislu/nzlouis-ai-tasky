import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";
import { auth } from "@/lib/auth-config";
import { syncToTrello, syncFromTrello } from "@/lib/stories/trello/sync";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth-config");
vi.mock("@/lib/stories/trello/sync");

describe("Trello Sync API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle upload action successfully", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user123" },
    } as any);

    vi.mocked(syncToTrello).mockResolvedValue({
      created: 5,
      updated: 2,
    });

    const request = new NextRequest("http://localhost/api/stories/trello/sync", {
      method: "POST",
      body: JSON.stringify({
        action: "upload",
        inputDir: "./test",
        configName: "Default",
        dryRun: false,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.result.created).toBe(5);
    expect(data.result.updated).toBe(2);
  });

  it("should handle download action successfully", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user123" },
    } as any);

    vi.mocked(syncFromTrello).mockResolvedValue({
      written: 10,
    });

    const request = new NextRequest("http://localhost/api/stories/trello/sync", {
      method: "POST",
      body: JSON.stringify({
        action: "download",
        outputDir: "./output",
        configName: "Default",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.result.written).toBe(10);
  });

  it("should return 401 for unauthenticated requests", async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const request = new NextRequest("http://localhost/api/stories/trello/sync", {
      method: "POST",
      body: JSON.stringify({
        action: "upload",
        inputDir: "./test",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 400 for invalid action parameter", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user123" },
    } as any);

    const request = new NextRequest("http://localhost/api/stories/trello/sync", {
      method: "POST",
      body: JSON.stringify({
        action: "invalid",
        inputDir: "./test",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Invalid action");
  });

  it("should return 500 for sync function errors", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user123" },
    } as any);

    vi.mocked(syncToTrello).mockRejectedValue(new Error("Sync failed"));

    const request = new NextRequest("http://localhost/api/stories/trello/sync", {
      method: "POST",
      body: JSON.stringify({
        action: "upload",
        inputDir: "./test",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Sync failed");
  });
});
