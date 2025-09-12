"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import UnifiedChatbot from "@/components/UnifiedChatbot";
import { useRouter, usePathname } from "next/navigation";

interface SidebarPage {
  id: string;
  title: string;
  icon?: string;
  href?: string;
}

export default function Page() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const activePageId =
    pathname === "/chatbot/settings" ? "settings" : "chatbot";

  const pages: SidebarPage[] = [
    { id: "chatbot", title: "AI Chatbot", icon: "🤖", href: "/chatbot" },
    {
      id: "settings",
      title: "Settings",
      icon: "⚙️",
      href: "/chatbot/settings",
    },
  ];

  const handleSelectPage = (pageId: string, href?: string) => {
    if (href) {
      router.push(href);
    }
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleToggleSidebar = () => {
    if (sidebarCollapsed) {
      setSidebarCollapsed(false);
      setSidebarOpen(true);
    } else {
      setSidebarCollapsed(true);
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-white">
      {!sidebarCollapsed && (
        <Sidebar
          title="AI Assistant"
          icon="🤖"
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
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      )}

      <div
        className={`flex-1 flex flex-col bg-white transition-all duration-200 overflow-hidden ${
          sidebarCollapsed ? "ml-0 md:ml-12" : "ml-0 md:ml-64"
        }`}
        style={{ height: "calc(100vh - 64px)", marginTop: "64px" }}
      >
        <UnifiedChatbot mode="standalone" sidebarCollapsed={sidebarCollapsed} />
      </div>
    </div>
  );
}
