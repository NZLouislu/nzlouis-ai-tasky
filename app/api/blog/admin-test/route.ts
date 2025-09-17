import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.TASKY_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: "Missing SUPABASE_URL or SERVICE_ROLE_KEY" },
      { status: 500 }
    );
  }

  const supabase = createClient(url, serviceKey);
  // Valid UUID v4 test ID
  let testId: string;
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    testId = crypto.randomUUID();
  } else {
    // Fallback for Node.js environment
    testId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0,
          v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  // 1. Attempt to insert
  const { error: insertError, data: insertData } = await supabase
    .from("blog_posts")
    .insert({
      id: testId,
      user_id: "00000000-0000-0000-0000-000000000000",
      title: "SUPABASE SERVICE KEY DELETE TEST",
      content: [],
    });

  // 2. Attempt to delete
  const { error: deleteError, data: deleteData } = await supabase
    .from("blog_posts")
    .delete()
    .eq("id", testId);

  return NextResponse.json({
    url,
    serviceKeyPresent: !!serviceKey,
    insertSuccess: !insertError,
    insertError: insertError?.message ?? null,
    deleteSuccess: !deleteError,
    deleteError: deleteError?.message ?? null,
    insertData,
    deleteData,
  });
}
