import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { syncToTrello, syncFromTrello } from "@/lib/stories/trello/sync";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, inputDir, outputDir, configName, dryRun } = body;

    let result;

    if (action === "upload") {
      result = await syncToTrello({
        userId: session.user.id,
        inputDir,
        configName,
        dryRun: dryRun || false,
      });
    } else if (action === "download") {
      result = await syncFromTrello({
        userId: session.user.id,
        outputDir,
        configName,
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
    console.error("Trello sync error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
