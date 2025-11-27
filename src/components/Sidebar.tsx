"use client";
import React, { useState } from "react";
import {
  FaPlus as Plus,
  FaChevronRight as ChevronRight,
  FaChevronDown as ChevronDown,
  FaBars as PanelLeftClose,
} from "react-icons/fa";
import { Edit2, Trash2 } from "lucide-react";

interface Page {
  id: string;
  title: string;
  icon?: string;
  href?: string;
  children?: Page[];
}

interface SidebarProps {
  title: string;
  icon: string;
  pages: Page[];
  activePageId: string;
  onAddPage?: () => void;
  onAddSubPage?: (parentPageId: string) => void | Promise<void>;
  onUpdatePageTitle?: (
    pageId: string,
    newTitle: string
  ) => void | Promise<void>;
  onDeletePage?: (pageId: string) => void | Promise<void>;
  onSelectPage: (pageId: string, href?: string) => void;
  sidebarOpen: boolean;
  // setSidebarOpen: (open: boolean) => void;
  className?: string;
  onCollapse?: () => void;
  expandedPages?: Set<string>;
  onToggleExpand?: (pageId: string) => void;
}

export default function Sidebar({
  title,
  icon,
  pages,
  activePageId,
  onAddPage,
  onAddSubPage,
  onUpdatePageTitle,
  onDeletePage,
  onSelectPage,
  sidebarOpen,
  // setSidebarOpen,
  className = "",
  onCollapse,
  expandedPages,
  onToggleExpand,
}: SidebarProps) {
  const [localExpandedPages, setLocalExpandedPages] = useState<Set<string>>(
    new Set()
  );
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const currentExpandedPages = expandedPages || localExpandedPages;

  const toggleExpanded = (pageId: string) => {
    if (onToggleExpand) {
      onToggleExpand(pageId);
      return;
    }

    const newExpanded = new Set(currentExpandedPages);
    if (newExpanded.has(pageId)) {
      newExpanded.delete(pageId);
    } else {
      newExpanded.add(pageId);
    }
    if (!expandedPages) {
      setLocalExpandedPages(newExpanded);
    }
  };

  const handlePageClick = (pageId: string, href?: string) => {
    if (editingPageId === pageId) return;
    onSelectPage(pageId, href);
    if (onToggleExpand) {
      onToggleExpand(pageId);
    }
  };

  const handleRename = async (pageId: string) => {
    if (onUpdatePageTitle && editingTitle.trim() !== "") {
      await onUpdatePageTitle(pageId, editingTitle);
    }
    setEditingPageId(null);
  };

  const renderPage = (page: Page, level = 0) => {
    const isExpanded = currentExpandedPages.has(page.id);
    const hasChildren = page.children && page.children.length > 0;
    const isActive = activePageId === page.id;
    // Increase indentation to make hierarchy more obvious
    const paddingLeft = 12 + level * 12;

    return (
      <div key={page.id}>
        <div
          className={`group flex items-center justify-between w-full ${
            isActive
              ? "bg-blue-50 text-blue-700"
              : "text-gray-700 hover:bg-gray-100"
          } rounded px-3 py-2 transition-colors cursor-pointer`}
          style={{ paddingLeft }}
          onClick={() => handlePageClick(page.id, page.href)}
          title={page.title} // Show full title on hover
        >
          <div className="flex items-center flex-1 min-w-0">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(page.id);
                }}
                className="p-1 -ml-1 mr-1 text-gray-500 hover:text-gray-700"
              >
                {isExpanded ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </button>
            ) : (
              // For pages without subpages, also display a placeholder icon to maintain alignment
              <div className="w-5 mr-1"></div>
            )}
            {page.icon && (!page.title || !page.title.trim().startsWith(page.icon)) && (
              <span className="mr-2 flex-shrink-0">{page.icon}</span>
            )}
            {editingPageId === page.id ? (
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={() => handleRename(page.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRename(page.id);
                  } else if (e.key === "Escape") {
                    setEditingPageId(null);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                className="flex-1 bg-white border border-blue-500 rounded px-1 text-sm focus:outline-none focus:ring-0"
                style={{ fontSize: "inherit" }}
              />
            ) : (
              <span className="truncate font-medium">
                {page.title || "Untitled"}
              </span>
            )}
          </div>
          
          {/* Action Buttons Group - Visible on Group Hover */}
          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-2 gap-1 flex-shrink-0">
            {onUpdatePageTitle && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingPageId(page.id);
                  setEditingTitle(page.title);
                }}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                title="Rename"
              >
                <Edit2 size={14} />
              </button>
            )}
            {onDeletePage && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm("Are you sure you want to delete this blog?")) {
                    onDeletePage(page.id);
                  }
                }}
                className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            )}
            {onAddSubPage && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const result = onAddSubPage(page.id);
                  if (result instanceof Promise) {
                    result.catch(console.error);
                  }
                }}
                className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
                title="Add sub-blog"
              >
                <Plus size={14} />
              </button>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {page.children!.map((child) => (
              <div key={child.id}>{renderPage(child, level + 1)}</div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-200 z-40 ${className} ${
        sidebarOpen ? "w-80" : "w-0 overflow-hidden"
      }`}
      style={{ paddingTop: "64px" }} // Account for header height
    >
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <span className="mr-2">{icon}</span> {title}
        </h2>
        {onCollapse && (
          <button
            onClick={onCollapse}
            className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            title="Hide sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>

      {onAddPage && (
        <div className="px-4 py-2 border-b border-gray-200">
          <button
            onClick={onAddPage}
            className="flex items-center text-sm text-green-600 hover:text-green-800 hover:bg-gray-100 px-3 py-2 rounded-lg w-full transition-colors"
          >
            <Plus size={16} className="mr-2 text-green-600" />
            New Blog
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {pages.map((page) => renderPage(page))}
        </div>
      </div>
    </div>
  );
}
