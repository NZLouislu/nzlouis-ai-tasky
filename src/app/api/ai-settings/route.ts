import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { db } from "@/lib/db/connection";
import { userAISettings } from "@/lib/db/schema/tasky";
import { getUserIdFromRequest } from "@/lib/admin-auth";
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = getUserIdFromRequest(session?.user?.id, req);
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [settings] = await db
      .select()
      .from(userAISettings)
      .where(eq(userAISettings.userId, userId))
      .limit(1);

    if (!settings) {
      const [newSettings] = await db
        .insert(userAISettings)
        .values({
          userId,
          defaultProvider: 'google',
          defaultModel: 'gemini-3-flash-preview',
          temperature: 8,
          maxTokens: 1024,
          systemPrompt: 'You are a helpful AI assistant.',
        })
        .returning();

      return NextResponse.json({ settings: newSettings });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching AI settings:', error);
    return NextResponse.json(
      { error: "Failed to fetch settings" }, 
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = getUserIdFromRequest(session?.user?.id, req);
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    
    if (data.temperature !== undefined) {
      if (data.temperature < 0 || data.temperature > 2) {
        return NextResponse.json(
          { error: "Temperature must be between 0 and 2" }, 
          { status: 400 }
        );
      }
    }

    if (data.maxTokens !== undefined) {
      if (data.maxTokens < 1 || data.maxTokens > 8192) {
        return NextResponse.json(
          { error: "Max tokens must be between 1 and 8192" }, 
          { status: 400 }
        );
      }
    }

    const [settings] = await db
      .insert(userAISettings)
      .values({
        userId,
        defaultProvider: data.defaultProvider || data.default_provider || 'google',
        defaultModel: data.defaultModel || data.default_model || 'gemini-3-flash-preview',
        temperature: data.temperature !== undefined ? Math.round(data.temperature * 10) : 8,
        maxTokens: (data.maxTokens || data.max_tokens) ?? 1024,
        systemPrompt: data.systemPrompt || data.system_prompt || 'You are a helpful AI assistant.',
      })
      .onConflictDoUpdate({
        target: userAISettings.userId,
        set: {
          defaultProvider: data.defaultProvider || data.default_provider || 'google',
          defaultModel: data.defaultModel || data.default_model || 'gemini-3-flash-preview',
          temperature: data.temperature !== undefined ? Math.round(data.temperature * 10) : 8,
          maxTokens: (data.maxTokens || data.max_tokens) ?? 1024,
          systemPrompt: data.systemPrompt || data.system_prompt || 'You are a helpful AI assistant.',
        },
      })
      .returning();

    return NextResponse.json({ 
      success: true,
      settings 
    });
  } catch (error) {
    console.error('Error saving AI settings:', error);
    return NextResponse.json(
      { error: "Failed to save settings" }, 
      { status: 500 }
    );
  }
}
