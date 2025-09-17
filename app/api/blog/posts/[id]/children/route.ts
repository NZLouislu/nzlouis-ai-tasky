import { supabaseService } from "@/lib/supabase/service-server-client";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const parent_id = (await params).id;
  const { title, user_id, icon, cover, content } = await req.json();
  let id: string;
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    id = crypto.randomUUID();
  } else {
    id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c == "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  const { error, data } = await supabaseService
    .from("blog_posts")
    .insert({
      id,
      user_id,
      title,
      parent_id,
      icon: icon || null,
      cover: cover || null,
      content: content || [],
    })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, id, post: data?.[0] });
}
