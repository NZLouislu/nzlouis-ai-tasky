import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { getUserIdFromRequest } from '@/lib/admin-auth';

interface TrelloValidationRequest {
  trelloKey: string;
  trelloToken: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = getUserIdFromRequest(session?.user?.id, request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: TrelloValidationRequest = await request.json();
    const { trelloKey, trelloToken } = body;

    if (!trelloKey || !trelloToken) {
      return NextResponse.json(
        { error: 'Missing required fields: trelloKey, trelloToken' },
        { status: 400 }
      );
    }

    try {
      const boardsResponse = await fetch(
        `https://api.trello.com/1/members/me/boards?key=${trelloKey}&token=${trelloToken}&fields=id,name,desc,url`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!boardsResponse.ok) {
        return NextResponse.json(
          { error: 'Failed to connect to Trello. Please check your credentials.' },
          { status: 400 }
        );
      }

      const boards = await boardsResponse.json();
      
      return NextResponse.json({
        success: true,
        message: 'Trello credentials validated successfully',
        boards: boards || []
      });

    } catch (error) {
      console.error('Trello validation failed:', error);
      return NextResponse.json(
        { error: 'Failed to connect to Trello. Please check your credentials.' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Trello validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}