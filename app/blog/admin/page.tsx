"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FaChartBar as BarChart3,
  FaComments as MessageCircle,
  FaCog as Settings,
  FaBars as Menu,
  FaEye as Eye,
  FaHeart as Heart,
} from "react-icons/fa";
import Sidebar from "@/components/Sidebar";

import BlogAnalytics from "@/components/blog/analytics/BlogAnalytics";
import CommentsPanel from "@/components/blog/comments/CommentsPanel";
import { useBlogStore } from "@/lib/stores/blog-store";
import { verifyAuth } from "@/lib/auth";

interface SidebarPage {
  id: string;
  title: string;
  icon?: string;
  href?: string;
}

export default function BlogAdminPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("overview");
  const router = useRouter();

  const { posts, comments, featureToggles, setPosts, setFeatureToggles } =
    useBlogStore();

  const checkAuthentication = useCallback(async () => {
    try {
      const isAuth = await verifyAuth();
      if (isAuth) {
        setIsAuthenticated(true);
        setLoading(false);
      } else {
        router.replace("/blog/admin/login");
      }
    } catch (error) {
      console.error("Authentication check failed:", error);
      router.replace("/blog/admin/login");
    }
  }, [router]);

  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);

  const loadPosts = useCallback(async () => {
    if (posts.length > 0) return;

    try {
      const response = await fetch("/api/blog/posts");
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error("Failed to load posts:", error);
    }
  }, [setPosts, posts.length]);

  const loadFeatureToggles = useCallback(async () => {
    if (featureToggles) return;

    try {
      const response = await fetch("/api/blog/features");
      if (response.ok) {
        const data = await response.json();
        setFeatureToggles(data);
      }
    } catch (error) {
      console.error("Failed to load feature toggles:", error);
    }
  }, [setFeatureToggles, featureToggles]);

  useEffect(() => {
    loadPosts();
    loadFeatureToggles();
  }, [loadPosts, loadFeatureToggles]);

  const activePageId = activeView;

  const pages: SidebarPage[] = [
    { id: "overview", title: "Overview", icon: "📊", href: "/blog/admin" },
    {
      id: "analytics",
      title: "Analytics",
      icon: "📈",
      href: "/blog/admin/analytics",
    },
    {
      id: "comments",
      title: "Comments",
      icon: "💬",
      href: "/blog/admin/comments",
    },
    {
      id: "features",
      title: "Features",
      icon: "⚙️",
      href: "/blog/admin/features",
    },
  ];

  // const breadcrumbItems: never[] = [];

  const handleToggleSidebar = () => {
    if (sidebarCollapsed) {
      setSidebarCollapsed(false);
      setSidebarOpen(true);
    } else {
      setSidebarCollapsed(true);
      setSidebarOpen(false);
    }
  };

  const handleSelectPage = (pageId: string) => {
    setActiveView(pageId);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const renderContent = () => {
    switch (activePageId) {
      case "analytics":
        return <BlogAnalytics />;
      case "comments":
        return <CommentsPanel postId={Object.keys(comments)[0] || ""} />;
      case "features":
        return <FeatureTogglesPanel />;
      default:
        return <OverviewPanel />;
    }
  };

  const OverviewPanel = () => {
    const totalPosts = posts.length;
    const totalComments = Object.values(comments).reduce(
      (sum, postComments) => sum + postComments.length,
      0
    );
    const totalViews = 0;
    const totalLikes = 0;
    const totalAISummaries = 0;
    const totalAIQuestions = 0;

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Blog Overview</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Posts</p>
                <p className="text-2xl font-bold text-gray-900">{totalPosts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalViews.toLocaleString()}
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
                  {totalLikes.toLocaleString()}
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
                  {totalComments}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  AI Summaries
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalAISummaries.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <MessageCircle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  AI Questions
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalAIQuestions.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setActiveView("analytics")}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <BarChart3 className="h-6 w-6 text-blue-600 mb-2" />
              <h4 className="font-medium text-gray-900">View Analytics</h4>
              <p className="text-sm text-gray-600">
                Detailed blog performance metrics
              </p>
            </button>

            <button
              onClick={() => setActiveView("comments")}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <MessageCircle className="h-6 w-6 text-green-600 mb-2" />
              <h4 className="font-medium text-gray-900">Manage Comments</h4>
              <p className="text-sm text-gray-600">
                Moderate and manage blog comments
              </p>
            </button>

            <button
              onClick={() => setActiveView("features")}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <Settings className="h-6 w-6 text-purple-600 mb-2" />
              <h4 className="font-medium text-gray-900">Feature Settings</h4>
              <p className="text-sm text-gray-600">
                Configure blog feature toggles
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const FeatureTogglesPanel = () => {
    const [localToggles, setLocalToggles] = useState(
      featureToggles || {
        total_views: true,
        total_likes: true,
        total_comments: true,
        ai_summaries: true,
        ai_questions: true,
      }
    );

    const handleToggleChange = async (key: string, value: boolean) => {
      const updatedToggles = { ...localToggles, [key]: value };
      setLocalToggles(updatedToggles);

      try {
        const response = await fetch("/api/blog/features", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedToggles),
        });

        if (response.ok) {
          const result = await response.json();
          setFeatureToggles(result);
        } else {
          setLocalToggles(localToggles);
        }
      } catch (error) {
        console.error("Failed to update feature toggles:", error);
        setLocalToggles(localToggles);
      }
    };

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Feature Toggles</h2>
        <p className="text-gray-600">
          Control which features are visible on your blog
        </p>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 space-y-6">
            {Object.entries(localToggles).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 capitalize">
                    {key.replace("_", " ")}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {key === "total_views" && "Show total view counts on posts"}
                    {key === "total_likes" && "Show total like counts on posts"}
                    {key === "total_comments" &&
                      "Show total comment counts on posts"}
                    {key === "ai_summaries" &&
                      "Enable AI-generated post summaries"}
                    {key === "ai_questions" &&
                      "Enable AI-powered question answering"}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(e) => handleToggleChange(key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading && !isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 pt-16">
      {!sidebarCollapsed && (
        <Sidebar
          title="Blog Admin"
          icon="⚙️"
          pages={pages}
          activePageId={activePageId}
          onSelectPage={handleSelectPage}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          className="top-16"
          onCollapse={handleToggleSidebar}
        />
      )}

      {sidebarCollapsed && (
        <div className="fixed left-0 z-30 w-12 bg-white border-r border-gray-200 flex flex-col items-center py-4 transition-all duration-200 top-16 bottom-0">
          <button
            onClick={handleToggleSidebar}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Show sidebar"
          >
            <Settings size={20} />
          </button>
        </div>
      )}

      <div
        className={`flex-1 flex flex-col transition-all duration-200 ${
          sidebarCollapsed ? "ml-0 md:ml-12" : "ml-0 md:ml-64"
        }`}
      >
        <div className="md:hidden p-4 border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto pt-4">
          <div className="max-w-7xl mx-auto p-6">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}
