"use client";

import { useState } from "react";
import TaskList from "@/components/TaskList";
import { boardData } from "@/lib/boardData";
import Sidebar from "@/components/Sidebar";
import Breadcrumb from "@/components/Breadcrumb";

export default function Page() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState("task-board");

  const pages = [
    { id: "task-board", title: "Task Board", icon: "📋" },
    { id: "analytics", title: "Analytics", icon: "📊" },
    { id: "settings", title: "Settings", icon: "⚙️" },
  ];

  const renderContent = () => {
    switch (activePage) {
      case "task-board":
        return (
          <div className="flex-1 overflow-auto bg-gray-50">
            <TaskList initialBoard={boardData} />
          </div>
        );
      case "analytics":
        return (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Analytics</h2>
              <p className="text-gray-600">Analytics features will be implemented here.</p>
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Settings</h2>
              <p className="text-gray-600">Settings features will be implemented here.</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex-1 overflow-auto bg-gray-50">
            <TaskList initialBoard={boardData} />
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        title="Task Management"
        icon="📝"
        pages={pages}
        activePageId={activePage}
        onSelectPage={setActivePage}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        className="top-16"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-0 md:ml-64 lg:ml-64">
        <div className="fixed top-16 left-0 right-0 z-40 bg-white/30 backdrop-blur-md border-b border-gray-200 md:left-64 lg:left-64">
          <div className="p-4 md:pl-4 lg:pl-4">
            <Breadcrumb items={[
              { label: "Tasks", icon: "📝" },
              { label: pages.find(p => p.id === activePage)?.title || "Task Board", icon: pages.find(p => p.id === activePage)?.icon || "📋" }
            ]} />
          </div>
        </div>

        <div className="md:hidden p-4 border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-600 hover:text-gray-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden pt-16 md:pt-20">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
