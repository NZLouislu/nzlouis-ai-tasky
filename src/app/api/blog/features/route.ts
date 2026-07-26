import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { featureToggles } from "@/lib/db/schema/blog";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const [data] = await db
      .select({
        totalViews: featureToggles.totalViews,
        totalLikes: featureToggles.totalLikes,
        totalComments: featureToggles.totalComments,
        aiSummaries: featureToggles.aiSummaries,
        aiQuestions: featureToggles.aiQuestions,
      })
      .from(featureToggles)
      .limit(1);

    if (!data) {
      const [allData] = await db
        .select()
        .from(featureToggles)
        .limit(1);

      if (allData) {
        return NextResponse.json(allData);
      } else {
        const defaultToggles = {
          totalViews: true,
          totalLikes: true,
          totalComments: true,
          aiSummaries: true,
          aiQuestions: true,
        };

        const [insertedData] = await db
          .insert(featureToggles)
          .values(defaultToggles)
          .returning();

        return NextResponse.json(insertedData);
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching feature toggles:", error);
    return NextResponse.json(
      { error: "Failed to fetch feature toggles" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      total_views,
      total_likes,
      total_comments,
      ai_summaries,
      ai_questions,
    } = body;

    const updateData = {
      totalViews: total_views,
      totalLikes: total_likes,
      totalComments: total_comments,
      aiSummaries: ai_summaries,
      aiQuestions: ai_questions,
      updatedAt: new Date(),
    };

    let resultData;

    const [existingToggle] = await db
      .select({ id: featureToggles.id })
      .from(featureToggles)
      .limit(1);

    if (existingToggle) {
      const [updatedData] = await db
        .update(featureToggles)
        .set(updateData)
        .where(eq(featureToggles.id, existingToggle.id))
        .returning({
          totalViews: featureToggles.totalViews,
          totalLikes: featureToggles.totalLikes,
          totalComments: featureToggles.totalComments,
          aiSummaries: featureToggles.aiSummaries,
          aiQuestions: featureToggles.aiQuestions,
        });

      resultData = updatedData;
    } else {
      const [insertedData] = await db
        .insert(featureToggles)
        .values(updateData)
        .returning({
          totalViews: featureToggles.totalViews,
          totalLikes: featureToggles.totalLikes,
          totalComments: featureToggles.totalComments,
          aiSummaries: featureToggles.aiSummaries,
          aiQuestions: featureToggles.aiQuestions,
        });

      resultData = insertedData;
    }

    return NextResponse.json(resultData);
  } catch (error) {
    console.error("Error updating feature toggles:", error);
    return NextResponse.json(
      { error: "Failed to update feature toggles" },
      { status: 500 }
    );
  }
}
