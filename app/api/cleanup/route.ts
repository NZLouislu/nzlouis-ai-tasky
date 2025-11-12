import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { cleanupOrphanedFiles } from '@/lib/services/cleanup-service';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { dryRun = true } = await req.json();

    const result = await cleanupOrphanedFiles(session.user.id, dryRun);

    return NextResponse.json({
      success: true,
      result,
      message: dryRun
        ? 'Dry run completed. No files were deleted.'
        : 'Cleanup completed.',
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { error: 'Cleanup failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await cleanupOrphanedFiles(session.user.id, true);

    return NextResponse.json({
      success: true,
      result,
      message: 'Scan completed.',
    });
  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json(
      { error: 'Scan failed' },
      { status: 500 }
    );
  }
}
