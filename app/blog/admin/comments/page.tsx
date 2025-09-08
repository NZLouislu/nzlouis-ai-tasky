"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Breadcrumb from "@/components/Breadcrumb";
import CommentsPanel from "@/components/blog/comments/CommentsPanel";

interface SidebarPage {
  id: string;
  title: string;
  icon?: string;
  href?: string;
}

export default function BlogCommentsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navbarVisible, setNavbarVisible] = useState(true);
  const router = useRouter();

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

  const pages: SidebarPage[] = [
    { id: "overview", title: "Overview", icon: "📊", href: "/blog/admin" },
    { id: "analytics", title: "Analytics", icon: "📈", href: "/blog/admin/analytics" },
    { id: "comments", title: "Comments", icon: "💬", href: "/blog/admin/comments" },
    { id: "features", title: "Features", icon: "⚙️", href: "/blog/admin/features" },
  ];

  const breadcrumbItems = [
    { label: "Blog Admin", href: "/blog/admin", icon: "⚙️" },
    { label: "Comments", href: "/blog/admin/comments", icon: "💬" },
  ];

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
        title="Blog Admin"
        icon="⚙️"
        pages={pages}
        activePageId="comments"
        onSelectPage={handleSelectPage}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        className={navbarVisible ? "top-16" : "top-0"}
      />

      <div className="flex-1 flex flex-col ml-0 md:ml-64">
        <div className={`fixed ${navbarVisible ? "top-16" : "top-0"} left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 md:left-64 transition-all duration-300`}>
          <div className="px-4 md:px-6 py-3">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        </div>

        <div className="md:hidden p-4 border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
        </div>

        <div className={`flex-1 overflow-auto ${navbarVisible ? "pt-20" : "pt-4"} transition-all duration-300`}>
          <div className="h-full">
            <CommentsPanel postId="" />
          </div>
        </div>
      </div>
    </div>
  );
}