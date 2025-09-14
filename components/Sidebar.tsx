"use client";
import { useState } from "react";
import {
  FaPlus as Plus,
  FaChevronRight as ChevronRight,
  FaChevronDown as ChevronDown,
  FaBars as PanelLeftClose,
} from "react-icons/fa";
import Link from "next/link";

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
  onSelectPage: (pageId: string, href?: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
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
  onSelectPage,
  sidebarOpen,
  setSidebarOpen,
  className = "",
  onCollapse,
  expandedPages,
  onToggleExpand,
}: SidebarProps) {
  const [localExpandedPages, setLocalExpandedPages] = useState<Set<string>>(
    new Set()
  );

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

  const renderPage = (page: Page, level = 0) => {
    const isExpanded = currentExpandedPages.has(page.id);
    const hasChildren = page.children && page.children.length > 0;
    const isActive = activePageId === page.id;

    const content = (
      <>
        {page.icon && <span className="mr-2">{page.icon}</span>}
        {activePageId === page.id && onUpdatePageTitle ? (
          <input
            type="text"
            value={page.title}
            onChange={(e) => onUpdatePageTitle(page.id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-sm"
            style={{ fontSize: "inherit" }}
          />
        ) : (
          <span className="truncate">{page.title}</span>
        )}
      </>
    );

    return (
      <div key={page.id}>
        {page.href ? (
          <Link
            href={page.href}
            onClick={() => {
              onSelectPage(page.id, page.href);
              if (window.innerWidth < 768) {
                setSidebarOpen(false);
              }
            }}
            className={`flex items-center px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${
              isActive
                ? "bg-blue-100 text-blue-800"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            style={{ paddingLeft: `${12 + level * 16}px` }}
          >
            {content}
          </Link>
        ) : (
          <div className="group">
            <div
              onClick={() => {
                onSelectPage(page.id);
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
              className={`flex items-center px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${
                isActive
                  ? "bg-blue-100 text-blue-800"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              style={{ paddingLeft: `${12 + level * 16}px` }}
            >
              {hasChildren && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(page.id);
                  }}
                  className="mr-1 p-0.5 rounded hover:bg-gray-200"
                >
                  {isExpanded ? (
                    <ChevronDown size={12} />
                  ) : (
                    <ChevronRight size={12} />
                  )}
                </button>
              )}
              <div className="flex-1">{content}</div>
              {onAddSubPage && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const result = onAddSubPage(page.id);
                    if (result instanceof Promise) {
                      result.catch(console.error);
                    }
                  }}
                  className="opacity-100 group-hover:opacity-100 p-1 text-green-600 hover:text-green-800 rounded transition-opacity"
                  title="Add sub-page"
                >
                  <Plus size={12} />
                </button>
              )}
            </div>

            {hasChildren && isExpanded && (
              <div className="ml-2">
                {page.children!.map((child) => renderPage(child, level + 1))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`fixed inset-y-0 left-0 z-30 transform ${className} ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 transition-transform duration-200 ease-in-out w-64 bg-white border-r border-gray-200 flex flex-col`}
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
            New Page
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
