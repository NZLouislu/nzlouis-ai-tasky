import { NextRequest, NextResponse } from 'next/server'
import { blogDb } from '@/lib/supabase/blog-client'

export async function GET(request: NextRequest) {
  try {
    if (!blogDb) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 503 }
      )
    }

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
        const { data: dailyData, error: dailyError } = await blogDb!
          .from('daily_stats')
          .select('views, likes, ai_questions, ai_summaries, date')
          .eq('post_id', post.post_id)
          .gte('date', startDate.toISOString().split('T')[0])

        const { data: commentsData, error: commentsError } = await blogDb!
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

    const { data: allDailyData, error: allDailyError } = await blogDb
      .from('daily_stats')
      .select('views, likes, ai_questions, ai_summaries, date')
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true })

    if (allDailyError) {
      console.error('Error fetching all daily stats:', allDailyError)
    }

    const dailyStats = allDailyData ? allDailyData.reduce((acc, day) => {
      const date = day.date;
      if (!acc[date]) {
        acc[date] = { date, views: 0, likes: 0, comments: 0, aiQuestions: 0, aiSummaries: 0 };
      }
      acc[date].views += day.views || 0;
      acc[date].likes += day.likes || 0;
      acc[date].aiQuestions += day.ai_questions || 0;
      acc[date].aiSummaries += day.ai_summaries || 0;
      return acc;
    }, {} as Record<string, { date: string; views: number; likes: number; comments: number; aiQuestions: number; aiSummaries: number }>) : {};

    const dailyStatsArray = Object.values(dailyStats);

    return NextResponse.json({
      posts,
      dailyStats: dailyStatsArray
    });
  } catch (error) {
    console.error('Error fetching post analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}