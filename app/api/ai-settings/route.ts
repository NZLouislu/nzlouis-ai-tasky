import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let settings = await prisma.userAISettings.findUnique({
      where: { userId: session.user.id },
    });

    if (!settings) {
      settings = await prisma.userAISettings.create({
        data: {
          userId: session.user.id,
          defaultProvider: 'google',
          defaultModel: 'gemini-1.5-flash',
          temperature: 0.8,
          maxTokens: 1024,
          systemPrompt: 'You are a helpful AI assistant.',
        },
      });
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
  if (!session?.user?.id) {
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

    const settings = await prisma.userAISettings.upsert({
      where: { userId: session.user.id },
      update: {
        ...data,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        defaultProvider: data.defaultProvider || 'google',
        defaultModel: data.defaultModel || 'gemini-1.5-flash',
        temperature: data.temperature ?? 0.8,
        maxTokens: data.maxTokens ?? 1024,
        systemPrompt: data.systemPrompt || 'You are a helpful AI assistant.',
      },
    });

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
