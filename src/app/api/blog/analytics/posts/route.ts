import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/connection'
import { postStats, dailyStats, comments } from '@/lib/db/schema/blog'
import { eq, and, desc, asc, gte } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const period = searchParams.get('period') || '30'

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    const postsData = await db
      .select()
      .from(postStats)
      .orderBy(desc(postStats.views))
      .limit(limit)

    const posts = await Promise.all(
      postsData.map(async (post) => {
        let dailyData: any[] = []
        let commentsCount = 0

        try {
          dailyData = await db
            .select({
              views: dailyStats.views,
              likes: dailyStats.likes,
              aiQuestions: dailyStats.aiQuestions,
              aiSummaries: dailyStats.aiSummaries,
              date: dailyStats.date,
            })
            .from(dailyStats)
            .where(
              and(
                eq(dailyStats.postId, post.postId),
                gte(dailyStats.date, startDate.toISOString().split('T')[0])
              )
            )
        } catch (err) {
          console.error('Error fetching daily stats for post:', post.postId, err)
        }

        try {
          const commentsResult = await db
            .select({ id: comments.id })
            .from(comments)
            .where(eq(comments.postId, post.postId))
          commentsCount = commentsResult.length
        } catch (err) {
          console.error('Error fetching comments for post:', post.postId, err)
        }

        const totalViews = post.views || 0;
        const totalLikes = post.likes || 0;
        const totalAIQuestions = post.aiQuestions || 0;
        const totalAISummaries = post.aiSummaries || 0;
        const totalComments = commentsCount;

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

    let allDailyData: any[] = []
    try {
      allDailyData = await db
        .select({
          views: dailyStats.views,
          likes: dailyStats.likes,
          aiQuestions: dailyStats.aiQuestions,
          aiSummaries: dailyStats.aiSummaries,
          date: dailyStats.date,
        })
        .from(dailyStats)
        .where(gte(dailyStats.date, startDate.toISOString().split('T')[0]))
        .orderBy(asc(dailyStats.date))
    } catch (err) {
      console.error('Error fetching all daily stats:', err)
    }

    const dailyStatsMap = allDailyData.reduce((acc, day) => {
      const date = day.date;
      if (!acc[date]) {
        acc[date] = { date, views: 0, likes: 0, comments: 0, aiQuestions: 0, aiSummaries: 0 };
      }
      acc[date].views += day.views || 0;
      acc[date].likes += day.likes || 0;
      acc[date].aiQuestions += day.aiQuestions || 0;
      acc[date].aiSummaries += day.aiSummaries || 0;
      return acc;
    }, {} as Record<string, { date: string; views: number; likes: number; comments: number; aiQuestions: number; aiSummaries: number }>);

    const dailyStatsArray = Object.values(dailyStatsMap);

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
