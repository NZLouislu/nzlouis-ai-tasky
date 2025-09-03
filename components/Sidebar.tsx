"use client";
import { Plus } from "lucide-react";

interface Page {
  id: string;
  title: string;
  icon?: string;
}

interface SidebarProps {
  title: string;
  icon: string;
  pages: Page[];
  activePageId: string;
  onAddPage?: () => void; // 改为可选
  onUpdatePageTitle?: (pageId: string, newTitle: string) => void; // 改为可选
  onSelectPage: (pageId: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({
  title,
  icon,
  pages,
  activePageId,
  onAddPage,
  onUpdatePageTitle,
  onSelectPage,
  sidebarOpen,
  setSidebarOpen
}: SidebarProps) {
  return (
    <div
      className={`fixed md:static inset-y-0 left-0 z-30 transform ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 transition-transform duration-200 ease-in-out w-64 bg-gray-50 border-r border-gray-200 flex-col`}
    >
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <span className="mr-2">{icon}</span> {title}
        </h2>
      </div>

      {onAddPage && (
        <div
          className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 flex items-center cursor-pointer rounded-md"
          onClick={onAddPage}
        >
          <Plus size={16} className="mr-2 text-gray-500" />
          New Page
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {pages.map((page) => (
            <div
              key={page.id}
              onClick={() => {
                onSelectPage(page.id);
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
              className={`flex items-center p-2 mb-1 text-sm rounded cursor-pointer truncate ${
                activePageId === page.id
                  ? "bg-blue-100 text-blue-800"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {page.icon && <span className="mr-2">{page.icon}</span>}
              {activePageId === page.id && onUpdatePageTitle ? (
                <input
                  type="text"
                  value={page.title}
                  onChange={(e) => onUpdatePageTitle(page.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full bg-transparent border-none focus:outline-none focus:ring-0"
                />
              ) : (
                <span>{page.title}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}