import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { taskyDb } from "@/lib/supabase/tasky-db-client";
import { encryptAPIKey } from "@/lib/encryption";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
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

    const validProviders = ['openai', 'anthropic', 'google', 'openrouter', 'kilo'];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { error: "Invalid provider" }, 
        { status: 400 }
      );
    }

    const { encrypted, iv, authTag } = encryptAPIKey(apiKey);

    const { error } = await taskyDb
      .from('user_api_keys')
      .upsert({
        user_id: session.user.id,
        provider,
        encrypted_key: encrypted,
        iv,
        auth_tag: authTag,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,provider',
      });

    if (error) throw error;

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

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: keys, error } = await taskyDb
      .from('user_api_keys')
      .select('id, provider, created_at, updated_at')
      .eq('user_id', session.user.id);

    if (error) throw error;

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
  if (!session?.user?.id) {
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

    const { error } = await taskyDb
      .from('user_api_keys')
      .delete()
      .eq('user_id', session.user.id)
      .eq('provider', provider);

    if (error) throw error;

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
