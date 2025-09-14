"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaBars as Menu } from "react-icons/fa";
import Sidebar from "@/components/Sidebar";
import BlogAnalytics from "@/components/blog/analytics/BlogAnalytics";

interface SidebarPage {
  id: string;
  title: string;
  icon?: string;
  href?: string;
}

export default function BlogAnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();

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

  const handleToggleSidebar = () => {
    if (sidebarCollapsed) {
      setSidebarCollapsed(false);
      setSidebarOpen(true);
    } else {
      setSidebarCollapsed(true);
      setSidebarOpen(false);
    }
  };

  const handleSelectPage = (pageId: string, href?: string) => {
    if (href) {
      router.push(href);
    }
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 pt-16">
      {!sidebarCollapsed && (
        <Sidebar
          title="Blog Admin"
          icon="⚙️"
          pages={pages}
          activePageId="analytics"
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
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
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
          <div className="max-w-7xl mx-auto p-6">
            <BlogAnalytics />
          </div>
        </div>
      </div>
    </div>
  );
}
