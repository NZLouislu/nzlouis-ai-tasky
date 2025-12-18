import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { taskyDb } from "@/lib/supabase/tasky-db-client";
import { getUserIdFromRequest } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = getUserIdFromRequest(session?.user?.id, req);
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: settings, error } = await taskyDb
      .from('user_ai_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!settings) {
      const { data: newSettings, error: createError } = await taskyDb
        .from('user_ai_settings')
        .insert({
          id: crypto.randomUUID(),
          user_id: userId,
          default_provider: 'google',
          default_model: 'gemini-3-flash-preview',
          temperature: 0.8,
          max_tokens: 1024,
          system_prompt: 'You are a helpful AI assistant.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) throw createError;
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

    const { data: settings, error } = await taskyDb
      .from('user_ai_settings')
      .upsert({
        id: crypto.randomUUID(),
        user_id: userId,
        default_provider: data.defaultProvider || data.default_provider || 'google',
        default_model: data.defaultModel || data.default_model || 'gemini-3-flash-preview',
        temperature: data.temperature ?? 0.8,
        max_tokens: (data.maxTokens || data.max_tokens) ?? 1024,
        system_prompt: data.systemPrompt || data.system_prompt || 'You are a helpful AI assistant.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) throw error;

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
