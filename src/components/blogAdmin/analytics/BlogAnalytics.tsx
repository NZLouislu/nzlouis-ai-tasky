"use client";
import { useState, useEffect, useCallback } from "react";
import { BarChart3, MessageCircle, Eye, Heart, Download } from "lucide-react";
import { useBlogStore } from "@/lib/stores/blog-store";

interface DailyStats {
  date: string;
  views: number;
  likes: number;
  ai_questions: number;
  ai_summaries: number;
}

interface AnalyticsData {
  post_id: string;
  title: string;
  views: number;
  likes: number;
  ai_questions: number;
  ai_summaries: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalAIQuestions: number;
  totalAISummaries: number;
  dailyData: DailyStats[];
}

interface DailyStatsSummary {
  date: string;
  views: number;
  likes: number;
  comments: number;
  aiQuestions: number;
  aiSummaries: number;
}

export default function BlogAnalytics() {
  const { analytics: storeAnalytics, setAnalytics } = useBlogStore();
  const [analytics, setAnalyticsState] = useState<AnalyticsData[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStatsSummary[]>([]);
  const [period, setPeriod] = useState("30");
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/blog/analytics/posts?period=${period}`
      );
      if (response.ok) {
        const data = await response.json();
        const analyticsData = {
          posts: data.posts || [],
          dailyStats: data.dailyStats || [],
        };
        setAnalytics(analyticsData);
        setAnalyticsState(data.posts || []);
        setDailyStats(data.dailyStats || []);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [period, setAnalytics]);

  useEffect(() => {
    if (storeAnalytics && storeAnalytics.posts && storeAnalytics.dailyStats) {
      setAnalyticsState(storeAnalytics.posts);
      setDailyStats(storeAnalytics.dailyStats);
      setLoading(false);
    } else {
      fetchAnalytics();
    }
  }, [storeAnalytics, period, fetchAnalytics]);

  const totalStats = analytics.reduce(
    (acc, post) => ({
      views: acc.views + (post.totalViews || 0),
      likes: acc.likes + (post.totalLikes || 0),
      comments: acc.comments + (post.totalComments || 0),
      aiQuestions: acc.aiQuestions + (post.totalAIQuestions || 0),
      aiSummaries: acc.aiSummaries + (post.totalAISummaries || 0),
    }),
    { views: 0, likes: 0, comments: 0, aiQuestions: 0, aiSummaries: 0 }
  );

  const exportData = () => {
    const csvContent = [
      [
        "Post Title",
        "Views",
        "Likes",
        "Comments",
        "AI Summaries",
        "AI Questions",
      ].join(","),
      ...analytics.map((post) =>
        [
          `"${post.title}"`,
          post.totalViews,
          post.totalLikes,
          post.totalComments,
          post.totalAISummaries,
          post.totalAIQuestions,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `blog-analytics-${period}days.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Blog Analytics</h2>
        <div className="flex items-center space-x-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <button
            onClick={exportData}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Eye className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalStats.views.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Heart className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Likes</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalStats.likes.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <MessageCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Comments
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {totalStats.comments.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">AI Summaries</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalStats.aiSummaries.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <MessageCircle className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">AI Questions</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalStats.aiQuestions.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-12">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Daily Statistics
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Likes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AI Questions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AI Summaries
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dailyStats.map((day) => (
                  <tr key={day.date} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(day.views || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(day.likes || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(day.comments || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(day.aiQuestions || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(day.aiSummaries || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-12">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Post Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Post Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Likes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AI Summaries
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AI Questions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.map((post) => (
                  <tr key={post.post_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {post.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(post.totalViews || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(post.totalLikes || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(post.totalComments || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(post.totalAISummaries || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(post.totalAIQuestions || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
