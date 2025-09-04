"use client";

import { useState, useEffect } from "react";
import Chatbot from "@/components/Chatbot";
import Sidebar from "@/components/Sidebar";
import Breadcrumb from "@/components/Breadcrumb";

export default function Page() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState("chatbot");
  const [navbarVisible, setNavbarVisible] = useState(true);

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

  const pages = [
    { id: "chatbot", title: "AI Chatbot", icon: "🤖" },
    { id: "analysis", title: "Analysis", icon: "📊" },
    { id: "settings", title: "Settings", icon: "⚙️" }
  ];

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Chatbot", icon: "💬" }
  ];

  const renderContent = () => {
    switch (activePage) {
      case "chatbot":
        return <Chatbot />;
      case "analysis":
        return (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Analysis</h2>
              <p className="text-gray-600">Analysis features will be implemented here.</p>
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Settings</h2>
              <p className="text-gray-600">Settings features will be implemented here.</p>
            </div>
          </div>
        );
      default:
        return <Chatbot />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        title="AI Assistant"
        icon="🤖"
        pages={pages}
        activePageId={activePage}
        onSelectPage={setActivePage}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        className={navbarVisible ? "top-16" : "top-0"}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-0 md:ml-64 lg:ml-64">
        <div className={`fixed ${navbarVisible ? "top-16" : "top-0"} left-0 right-0 z-40 bg-white/30 backdrop-blur-md border-b border-gray-200 md:left-64 lg:left-64 transition-all duration-300`}>
          <div className="p-4 md:pl-4 lg:pl-4">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        </div>

        <div className="md:hidden p-4 border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-600 hover:text-gray-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${navbarVisible ? "pt-16 md:pt-20" : "pt-0 md:pt-4"}`}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}