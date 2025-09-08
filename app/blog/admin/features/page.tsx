"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Menu, Settings } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Breadcrumb from "@/components/Breadcrumb";
import { useBlogStore } from "@/lib/stores/blog-store";

interface SidebarPage {
  id: string;
  title: string;
  icon?: string;
  href?: string;
}

export default function BlogFeaturesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navbarVisible, setNavbarVisible] = useState(true);
  const router = useRouter();

  const { featureToggles, setFeatureToggles } = useBlogStore();
  const [localToggles, setLocalToggles] = useState(featureToggles || {
    total_views: true,
    total_likes: true,
    total_comments: true,
    ai_summaries: true,
    ai_questions: true
  });

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

  const loadFeatureToggles = useCallback(async () => {
    if (featureToggles) {
      setLocalToggles(featureToggles);
      return;
    }

    try {
      const response = await fetch('/api/blog/features');
      if (response.ok) {
        const data = await response.json();
        setLocalToggles(data);
        setFeatureToggles(data);
      }
    } catch (error) {
      console.error('Failed to load feature toggles:', error);
    }
  }, [setFeatureToggles, featureToggles]);

  useEffect(() => {
    loadFeatureToggles();
  }, [loadFeatureToggles]);

  const handleToggleChange = async (key: string, value: boolean) => {
    const updatedToggles = { ...localToggles, [key]: value };
    setLocalToggles(updatedToggles);

    try {
      const response = await fetch('/api/blog/features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedToggles)
      });

      if (response.ok) {
        const result = await response.json();
        setFeatureToggles(result);
      } else {
        setLocalToggles(localToggles);
      }
    } catch (error) {
      console.error('Failed to update feature toggles:', error);
      setLocalToggles(localToggles);
    }
  };

  const pages: SidebarPage[] = [
    { id: "overview", title: "Overview", icon: "📊", href: "/blog/admin" },
    { id: "analytics", title: "Analytics", icon: "📈", href: "/blog/admin/analytics" },
    { id: "comments", title: "Comments", icon: "💬", href: "/blog/admin/comments" },
    { id: "features", title: "Features", icon: "⚙️", href: "/blog/admin/features" },
  ];

  const breadcrumbItems = [
    { label: "Blog Admin", href: "/blog/admin", icon: "⚙️" },
    { label: "Features", href: "/blog/admin/features", icon: "⚙️" },
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
        activePageId="features"
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
          <div className="max-w-4xl mx-auto p-6">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Settings className="h-8 w-8 text-blue-600" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Feature Toggles</h2>
                  <p className="text-gray-600">Control which features are visible on your blog</p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 space-y-6">
                  {Object.entries(localToggles).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 capitalize">
                          {key.replace('_', ' ')}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {key === 'total_views' && 'Show total view counts on posts'}
                          {key === 'total_likes' && 'Show total like counts on posts'}
                          {key === 'total_comments' && 'Show total comment counts on posts'}
                          {key === 'ai_summaries' && 'Enable AI-generated post summaries'}
                          {key === 'ai_questions' && 'Enable AI-powered question answering'}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Pro Tips</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Changes take effect immediately on your blog</li>
                  <li>• Feature toggles help you test new features gradually</li>
                  <li>• You can always re-enable features later</li>
                  <li>• Consider your audience when enabling AI features</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}