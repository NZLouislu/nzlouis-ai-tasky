"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Breadcrumb from "@/components/Breadcrumb";
import UnifiedChatbot from "@/components/UnifiedChatbot";
import { useRouter, usePathname } from "next/navigation";

interface SidebarPage {
  id: string;
  title: string;
  icon?: string;
  href?: string;
}

export default function Page() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navbarVisible, setNavbarVisible] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      if (window.scrollY > lastScrollY) {
        setNavbarVisible(false);
      } else {
        setNavbarVisible(true);
      }
      lastScrollY = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Chatbot", href: "/chatbot", icon: "💬" },
  ];

  if (pathname === "/chatbot/settings") {
    breadcrumbItems.push({
      label: "Settings",
      href: "/chatbot/settings",
      icon: "⚙️",
    });
  }

  const handleSelectPage = (pageId: string, href?: string) => {
    if (href) {
      router.push(href);
    }
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        title="AI Assistant"
        icon="🤖"
        pages={pages}
        activePageId={activePageId}
        onSelectPage={handleSelectPage}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        className={navbarVisible ? "top-16" : "top-0"}
      />

      <div className="flex-1 flex flex-col ml-0 md:ml-64">
        <div
          className={`fixed ${
            navbarVisible ? "top-16" : "top-0"
          } left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 md:left-64 transition-all duration-300`}
        >
          <div className="px-4 md:px-6 py-3">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        </div>

        <div className="md:hidden p-4 border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100"
          >
            <svg
              className="h-6 w-6"
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

        <div
          className={`flex-1 flex flex-col overflow-hidden ${
            navbarVisible ? "pt-20" : "pt-4"
          } transition-all duration-300`}
        >
          <UnifiedChatbot mode="standalone" />
        </div>
      </div>
    </div>
  );
}
