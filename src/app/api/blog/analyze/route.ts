import { NextRequest, NextResponse } from 'next/server';
import { QualityAnalyzer } from '@/lib/blog/quality-analyzer';

export async function POST(request: NextRequest) {
  try {
    const { content, title } = await request.json();

    const analyzer = new QualityAnalyzer();
    const score = analyzer.analyze(content, title);

    return NextResponse.json(score);
  } catch (error) {
    console.error('Quality analysis error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
