import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { db } from "@/lib/db/connection";
import { userAPIKeys } from "@/lib/db/schema/tasky";
import { encryptAPIKey } from "@/lib/encryption";
import { getUserIdFromRequest } from "@/lib/admin-auth";
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = getUserIdFromRequest(session?.user?.id, req);
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { provider, apiKey } = await req.json();
    
    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: "Missing provider or apiKey" }, 
        { status: 400 }
      );
    }

    const validProviders = ['openai', 'anthropic', 'google', 'openrouter', 'tavily'];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { error: "Invalid provider" }, 
        { status: 400 }
      );
    }

    const { encrypted, iv, authTag } = encryptAPIKey(apiKey);

    await db
      .insert(userAPIKeys)
      .values({
        userId,
        provider,
        keyEncrypted: encrypted,
        iv,
        authTag,
      })
      .onConflictDoUpdate({
        target: [userAPIKeys.userId, userAPIKeys.provider],
        set: {
          keyEncrypted: encrypted,
          iv,
          authTag,
        },
      });

    return NextResponse.json({ 
      success: true,
      message: `API key for ${provider} saved successfully`
    });
  } catch (error) {
    console.error('Error saving API key:', error);
    return NextResponse.json(
      { error: "Failed to save API key" }, 
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = getUserIdFromRequest(session?.user?.id, req);
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const keys = await db
      .select({ id: userAPIKeys.id, provider: userAPIKeys.provider, created_at: userAPIKeys.createdAt, updated_at: userAPIKeys.updatedAt })
      .from(userAPIKeys)
      .where(eq(userAPIKeys.userId, userId));

    console.log('[API /ai-keys GET] User ID:', userId);
    console.log('[API /ai-keys GET] Keys from DB:', keys);

    return NextResponse.json({ keys: keys || [] });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: "Failed to fetch API keys" }, 
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  const userId = getUserIdFromRequest(session?.user?.id, req);
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get('provider');

    if (!provider) {
      return NextResponse.json(
        { error: "Missing provider parameter" }, 
        { status: 400 }
      );
    }

    await db
      .delete(userAPIKeys)
      .where(and(eq(userAPIKeys.userId, userId), eq(userAPIKeys.provider, provider)));

    return NextResponse.json({ 
      success: true,
      message: `API key for ${provider} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { error: "Failed to delete API key" }, 
      { status: 500 }
    );
  }
}
