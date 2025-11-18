"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaBars as Menu } from "react-icons/fa";
import Sidebar from "@/components/Sidebar";
import CommentsPanel from "@/components/blogAdmin/comments/CommentsPanel";

interface SidebarPage {
  id: string;
  title: string;
  icon?: string;
  href?: string;
}

export default function BlogCommentsPage() {
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
          activePageId="comments"
          onSelectPage={handleSelectPage}
          sidebarOpen={sidebarOpen}
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
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-2.28-.298l-5.848 2.006a.75.75 0 01-.971-.971l2.006-5.848A8.959 8.959 0 014 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"
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
          <div className="h-full">
            <CommentsPanel postId="" />
          </div>
        </div>
      </div>
    </div>
  );
}
