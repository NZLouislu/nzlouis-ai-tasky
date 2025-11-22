import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { syncToJira, syncFromJira } from "@/lib/stories/jira/sync";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, inputDir, outputDir, configName, dryRun, jql } = body;

    let result;

    if (action === "upload") {
      result = await syncToJira({
        userId: session.user.id,
        inputDir,
        configName,
        dryRun: dryRun || false,
      });
    } else if (action === "download") {
      result = await syncFromJira({
        userId: session.user.id,
        outputDir,
        configName,
        jql,
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "upload" or "download"' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Jira sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
