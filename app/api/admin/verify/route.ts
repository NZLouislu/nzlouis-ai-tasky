import { NextRequest, NextResponse } from 'next/server';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('adminToken')?.value;

    if (!token) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    const decoded = Buffer.from(token, 'base64').toString().split(':');
    const username = decoded[0];

    if (username !== ADMIN_USERNAME) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    return NextResponse.json({ authenticated: true });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }
}