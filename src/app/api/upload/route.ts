import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { getUserIdFromRequest } from "@/lib/admin-auth";
import { uploadImage } from "@/lib/services/upload-service";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    await auth();
    const userId = getUserIdFromRequest(request);
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (5MB max for route-level validation)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Upload using our upload service
    const uploadOptions = {
      file,
      entityType: 'blog_cover', // Default to blog_cover for upload route
      entityId: 'upload',       // Generic ID for direct uploads
      userId: userId.toString()
    };

    const result = await uploadImage(uploadOptions);

    return NextResponse.json({ url: result.publicUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}