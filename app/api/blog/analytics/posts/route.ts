import { NextRequest, NextResponse } from 'next/server'
import { blogDb } from '@/lib/supabase/blog-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const period = searchParams.get('period') || '30' // days

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    const { data: postStats, error } = await blogDb
      .from('post_stats')
      .select('*')
      .order('views', { ascending: false })
      .limit(limit)

    if (error) throw error

    const posts = await Promise.all(
      postStats.map(async (post) => {
        const { data: dailyData, error: dailyError } = await blogDb
          .from('daily_stats')
          .select('views, likes, ai_questions, ai_summaries, date')
          .eq('post_id', post.post_id)
          .gte('date', startDate.toISOString().split('T')[0])

        const { data: commentsData, error: commentsError } = await blogDb
          .from('comments')
          .select('id')
          .eq('post_id', post.post_id)

        if (dailyError) {
          console.error('Error fetching daily stats for post:', post.post_id, dailyError)
        }

        if (commentsError) {
          console.error('Error fetching comments for post:', post.post_id, commentsError)
        }

        const totalViews = post.views || 0;
        const totalLikes = post.likes || 0;
        const totalAIQuestions = post.ai_questions || 0;
        const totalAISummaries = post.ai_summaries || 0;
        const totalComments = commentsData ? commentsData.length : 0;

        return {
          ...post,
          totalViews,
          totalLikes,
          totalComments,
          totalAIQuestions,
          totalAISummaries,
          dailyData: dailyData || []
        }
      })
    );

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching post analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}