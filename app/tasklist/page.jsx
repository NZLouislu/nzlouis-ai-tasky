"use client";

import { useState } from "react";
import TaskList from "@/components/TaskList";
import { boardData } from "@/lib/boardData";
import Sidebar from "@/components/Sidebar";

export default function Page() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState("task-board");

  const pages = [
    { id: "task-board", title: "Task Board", icon: "📋" },
    { id: "analytics", title: "Analytics", icon: "📊" },
    { id: "settings", title: "Settings", icon: "⚙️" },
  ];

  return (
    <div className="flex h-screen">
      <Sidebar
        title="Task Management"
        icon="📝"
        pages={pages}
        activePageId={activePage}
        onSelectPage={setActivePage}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center">
          <div className="md:hidden mr-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <h1 className="text-xl font-bold">My Task Board</h1>
        </div>
        
        <div className="flex-1 overflow-auto bg-gray-50 p-4">
          <TaskList initialBoard={boardData} />
        </div>
      </div>
    </div>
  );
}
