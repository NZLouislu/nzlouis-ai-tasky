import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/chat-sessions/[id]/messages - Save messages
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify session belongs to user
    const chatSession = await prisma.chatSession.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!chatSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const body = await req.json();
    const { messages } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 });
    }

    // Save messages
    interface MessageInput {
      role: string;
      content: string;
      imageUrl?: string;
    }
    
    const savedMessages = await prisma.chatMessage.createMany({
      data: (messages as MessageInput[]).map((msg) => ({
        sessionId: id,
        role: msg.role,
        content: msg.content,
        imageUrl: msg.imageUrl || null,
      })),
    });

    // Update session timestamp
    await prisma.chatSession.update({
      where: { id: id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ 
      success: true,
      count: savedMessages.count,
    });
  } catch (error) {
    console.error('Save messages error:', error);
    return NextResponse.json(
      { error: 'Failed to save messages' },
      { status: 500 }
    );
  }
}
