import { NextResponse } from "next/server";
import { db } from '@/lib/db/connection';
import { blogPosts } from '@/lib/db/schema/tasky';
import { eq } from 'drizzle-orm';

export async function GET() {
  let testId: string;
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    testId = crypto.randomUUID();
  } else {
    testId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0,
          v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  let insertSuccess = false;
  let insertError: string | null = null;
  let insertData: unknown = null;
  let deleteSuccess = false;
  let deleteError: string | null = null;
  let deleteData: unknown = null;

  try {
    const [inserted] = await db
      .insert(blogPosts)
      .values({
        id: testId,
        userId: "00000000-0000-0000-0000-000000000000",
        title: "SUPABASE SERVICE KEY DELETE TEST",
        content: [],
      })
      .returning();
    insertSuccess = true;
    insertData = inserted;
  } catch (e) {
    insertError = e instanceof Error ? e.message : String(e);
  }

  try {
    const [deleted] = await db
      .delete(blogPosts)
      .where(eq(blogPosts.id, testId))
      .returning();
    deleteSuccess = true;
    deleteData = deleted;
  } catch (e) {
    deleteError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceKeyPresent: !!process.env.TASKY_SUPABASE_SERVICE_ROLE_KEY,
    insertSuccess,
    insertError,
    deleteSuccess,
    deleteError,
    insertData,
    deleteData,
  });
}
