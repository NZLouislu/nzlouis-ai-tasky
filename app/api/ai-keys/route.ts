import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { PrismaClient } from "@prisma/client";
import { encryptAPIKey } from "@/lib/encryption";

const prisma = new PrismaClient();

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

    await prisma.userAPIKey.upsert({
      where: {
        userId_provider: {
          userId: session.user.id,
          provider,
        },
      },
      update: {
        keyEncrypted: encrypted,
        iv,
        authTag,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        provider,
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

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const keys = await prisma.userAPIKey.findMany({
      where: { userId: session.user.id },
      select: { 
        id: true,
        provider: true, 
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ keys });
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

    await prisma.userAPIKey.delete({
      where: {
        userId_provider: {
          userId: session.user.id,
          provider,
        },
      },
    });

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
