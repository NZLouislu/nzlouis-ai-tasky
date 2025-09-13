"use client";
import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { PartialBlock } from "@blocknote/core";
import {
  Plus,
  Image as ImageIcon,
  Trash2,
  Menu,
  MoreHorizontal,
  GripVertical,
  MessageCircle,
  X,
} from "lucide-react";
import Sidebar from "./Sidebar";

import UnifiedChatbot from "./UnifiedChatbot";
import { mockPages, Page } from "@/lib/mockData";

const Editor = dynamic(() => import("./Editor"), {
  ssr: false,
  loading: () => <div className="p-4 text-gray-500">Loading editor...</div>,
});

export default function Workspace() {
  const [pages, setPages] = useState<Page[]>(mockPages);

  const [activePageId, setActivePageId] = useState<string>("page-1");
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [showCoverOptions, setShowCoverOptions] = useState(false);
  const [showCoverActions, setShowCoverActions] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isChatbotVisible, setIsChatbotVisible] = useState(false);
  const [chatbotWidth, setChatbotWidth] = useState(600);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const activePage = pages.find((page) => page.id === activePageId) || pages[0];

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, []);

  const handleToggleSidebar = () => {
    if (sidebarCollapsed) {
      setSidebarCollapsed(false);
      setSidebarOpen(true);
    } else {
      setSidebarCollapsed(true);
      setSidebarOpen(false);
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      const minWidth = 360;
      const maxWidth = window.innerWidth - 300;
      setChatbotWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)));
    },
    [isResizing]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const addNewWorkspacePage = () => {
    const pageNumber = pages.length + 1;
    const newPage: Page = {
      id: `page-${Date.now()}`,
      title: `Page ${pageNumber}`,
      content: [
        {
          type: "paragraph",
          content: `Welcome to Page ${pageNumber}! This is an independent page with its own content.`,
        },
        {
          type: "paragraph",
          content: "You can edit this content and add more blocks as needed.",
        },
      ],
    };
    setPages([...pages, newPage]);
    setActivePageId(newPage.id);
  };

  const addNewSubPage = (parentPageId?: string) => {
    const parentId = parentPageId || activePageId;
    const parentPage = pages.find((p) => p.id === parentId);
    const subPageNumber = (parentPage?.children?.length || 0) + 1;
    const newSubPage: Page = {
      id: `${parentId}-sub-${Date.now()}`,
      title: `Sub page ${subPageNumber}`,
      content: [
        {
          type: "paragraph",
          content: `This is Sub page ${subPageNumber} of ${
            parentPage?.title || "parent page"
          }.`,
        },
        {
          type: "paragraph",
          content:
            "Sub pages have their own independent content and can be organized hierarchically.",
        },
      ],
    };
    setPages((prev) =>
      prev.map((page) =>
        page.id === parentId
          ? { ...page, children: [...(page.children || []), newSubPage] }
          : page
      )
    );
    setActivePageId(newSubPage.id);
  };

  const updatePageTitle = (pageId: string, newTitle: string) => {
    setPages(
      pages.map((page) =>
        page.id === pageId ? { ...page, title: newTitle } : page
      )
    );
  };

  const updatePageContent = (newContent: PartialBlock[]) => {
    setPages(
      pages.map((page) =>
        page.id === activePageId ? { ...page, content: newContent } : page
      )
    );
  };

  const handlePageModification = async (modification: {
    type: string;
    target?: string;
    content?: string;
    title?: string;
  }): Promise<string> => {
    switch (modification.type) {
      case "add":
        if (!modification.content)
          return "Content is required for add operation";
        const newBlock: PartialBlock = {
          type: "paragraph",
          content: [{ type: "text", text: modification.content, styles: {} }],
        };
        updatePageContent([...activePage.content, newBlock]);
        return `Added content to the page`;

      case "edit":
        if (!modification.content)
          return "Content is required for edit operation";
        const editBlock: PartialBlock = {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: `Edited: ${modification.content}`,
              styles: {},
            },
          ],
        };
        updatePageContent([...activePage.content, editBlock]);
        return `Edited content on the page`;

      case "create_page":
        addNewWorkspacePage();
        return `Created new page: "${modification.title || "Untitled"}"`;

      case "set_title":
        if (!modification.title)
          return "Title is required for set title operation";
        updatePageTitle(activePageId, modification.title);
        return `Set page title to: "${modification.title}"`;

      case "add_heading":
        if (!modification.content)
          return "Content is required for add heading operation";
        const headingBlock: PartialBlock = {
          type: "heading",
          content: [{ type: "text", text: modification.content, styles: {} }],
          props: { level: 1 },
        };
        updatePageContent([...activePage.content, headingBlock]);
        return `Added heading: "${modification.content}"`;

      case "add_paragraph":
        if (!modification.content)
          return "Content is required for add paragraph operation";
        const paraBlock: PartialBlock = {
          type: "paragraph",
          content: [{ type: "text", text: modification.content, styles: {} }],
        };
        updatePageContent([...activePage.content, paraBlock]);
        return `Added paragraph: "${modification.content}"`;

      default:
        return "Unknown modification type";
    }
  };

  const setPageIcon = (pageId: string, icon: string) => {
    setPages(
      pages.map((page) => (page.id === pageId ? { ...page, icon } : page))
    );
    setShowIconSelector(false);
  };

  const removePageIcon = (pageId: string) => {
    setPages(
      pages.map((page) =>
        page.id === pageId ? { ...page, icon: undefined } : page
      )
    );
    setShowIconSelector(false);
  };

  const setPageCover = (
    pageId: string,
    cover: { type: "color" | "image"; value: string }
  ) => {
    setPages(
      pages.map((page) => (page.id === pageId ? { ...page, cover } : page))
    );
    setShowCoverOptions(false);
  };

  const removePageCover = (pageId: string) => {
    setPages(
      pages.map((page) =>
        page.id === pageId ? { ...page, cover: undefined } : page
      )
    );
  };

  const handleCoverFileUpload = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPageCover(activePageId, {
          type: "image",
          value: result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleCoverFileUpload(e.target.files[0]);
    }
  };

  const iconOptions = ["📝", "📄", "📑", "📊", "📋", "📌", "⭐", "💡"];

  const colorOptions = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-yellow-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-gray-500",
    "bg-red-500",
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {!sidebarCollapsed && (
        <Sidebar
          title="Workspace"
          icon="📁"
          pages={pages.map((p) => ({
            id: p.id,
            title: p.title,
            icon: p.icon,
            children: p.children?.map((c) => ({
              id: c.id,
              title: c.title,
              icon: c.icon,
            })),
          }))}
          activePageId={activePageId}
          onAddPage={addNewWorkspacePage}
          onAddSubPage={(parentPageId) => addNewSubPage(parentPageId)}
          onUpdatePageTitle={updatePageTitle}
          onSelectPage={setActivePageId}
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
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
              />
            </svg>
          </button>
        </div>
      )}

      <div
        className={`flex-1 flex flex-col transition-all duration-200 ${
          sidebarCollapsed ? "ml-0 md:ml-12" : "ml-0 md:ml-64"
        }`}
        style={{ paddingTop: "64px" }}
      >
        <div className="md:hidden p-4 border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
        </div>

        <div className="h-full overflow-y-auto chatbot-scrollbar">
          <div className="max-w-[900px] mx-auto px-6 py-8">
            <div className="w-full">
              {activePage.cover && (
                <div
                  className="relative mb-8 rounded-lg overflow-hidden"
                  onMouseEnter={() => setShowCoverActions(true)}
                  onMouseLeave={() => setShowCoverActions(false)}
                  style={{
                    height: "12rem",
                  }}
                >
                  {activePage.cover.type === "color" ? (
                    <div className={`h-full ${activePage.cover.value}`}></div>
                  ) : (
                    <div
                      className="h-full bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${activePage.cover.value})`,
                      }}
                    ></div>
                  )}
                  <div
                    className={`absolute bottom-4 right-4 flex space-x-2 transition-opacity duration-200 ${
                      showCoverActions ||
                      (!activePage.icon && !activePage.cover)
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                  >
                    <button
                      onClick={() => setShowCoverOptions(true)}
                      className="px-3 py-1 bg-white bg-opacity-80 text-sm rounded hover:bg-opacity-100"
                    >
                      Change Cover
                    </button>
                    <button
                      onClick={() => removePageCover(activePageId)}
                      className="p-1 bg-white bg-opacity-80 rounded hover:bg-opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    {!activePage.icon && !activePage.cover && (
                      <button
                        onClick={() => setShowIconSelector(!showIconSelector)}
                        className="flex items-center text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
                      >
                        <Plus size={16} className="mr-2" />
                        Add Icon
                      </button>
                    )}

                    {!activePage.cover && (
                      <button
                        onClick={() => setShowCoverOptions(!showCoverOptions)}
                        className="flex items-center text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
                      >
                        <ImageIcon size={16} className="mr-2" />
                        Add Cover
                      </button>
                    )}
                  </div>

                  <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreHorizontal size={16} />
                  </button>
                </div>

                {showIconSelector && (
                  <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
                    <div className="grid grid-cols-8 gap-3">
                      {iconOptions.map((icon) => (
                        <button
                          key={icon}
                          onClick={() => setPageIcon(activePageId, icon)}
                          className="text-2xl p-3 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          {icon}
                        </button>
                      ))}
                      <button
                        onClick={() => removePageIcon(activePageId)}
                        className="text-sm p-3 hover:bg-gray-100 rounded-lg flex items-center justify-center text-gray-500"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                {showCoverOptions && (
                  <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-lg relative">
                    <button
                      onClick={() => setShowCoverOptions(false)}
                      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      title="Close"
                    >
                      <X size={16} />
                    </button>
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">
                        Colors
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {colorOptions.map((color) => (
                          <button
                            key={color}
                            onClick={() =>
                              setPageCover(activePageId, {
                                type: "color",
                                value: color,
                              })
                            }
                            className={`w-10 h-10 rounded-lg ${color} hover:opacity-80 transition-opacity`}
                          ></button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">
                        Upload Image
                      </h3>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverFileSelect}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Or enter image URL below
                      </p>
                      <input
                        type="text"
                        placeholder="Enter image URL"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-2"
                        onBlur={(e) => {
                          if (e.target.value)
                            setPageCover(activePageId, {
                              type: "image",
                              value: e.target.value,
                            });
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center">
                  {activePage.icon && (
                    <div className="relative mr-4">
                      <span
                        className="text-3xl cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors"
                        onClick={() => setShowIconSelector(true)}
                      >
                        {activePage.icon}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      id={`title-input-${activePageId}`}
                      type="text"
                      value={activePage.title}
                      onChange={(e) =>
                        updatePageTitle(activePageId, e.target.value)
                      }
                      placeholder="Untitled"
                      className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-4xl font-bold text-gray-800 placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>

              <div className="min-h-[400px]">
                <Editor
                  initialContent={activePage.content}
                  onChange={updatePageContent}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {isChatbotVisible && !isMobile && (
        <>
          <div
            className="fixed right-0 w-1.5 bg-gray-200 hover:bg-gray-300 cursor-col-resize z-20 flex items-center justify-center transition-all duration-300 flex-shrink-0"
            onMouseDown={handleMouseDown}
            style={{
              right: `${chatbotWidth}px`,
              top: "64px",
              bottom: "0",
            }}
          >
            <GripVertical size={16} className="text-gray-600" />
          </div>
          <div
            className="fixed right-0 bg-white shadow-xl flex flex-col z-10 transition-all duration-300 border-l border-gray-200"
            style={{
              width: chatbotWidth,
              top: "64px",
              bottom: "0",
            }}
          >
            <div className="p-4 border-b border-gray-200 flex-shrink-0 relative">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  AI Workspace Assistant
                </h3>
                <button
                  onClick={() => setIsChatbotVisible(false)}
                  className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100 transition-colors z-20"
                  title="Close Chatbot"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <UnifiedChatbot
                mode="workspace"
                onPageModification={handlePageModification}
              />
            </div>
          </div>
        </>
      )}

      {!isChatbotVisible && !isMobile && (
        <button
          onClick={() => {
            setIsChatbotVisible(true);
            setSidebarOpen(false);
            setSidebarCollapsed(true);
          }}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-30"
          title="Open Chatbot"
          style={{ width: "56px", height: "56px" }}
        >
          <MessageCircle size={24} />
        </button>
      )}

      {isChatbotVisible && isMobile && (
        <div
          className="lg:hidden fixed inset-0 bg-white z-50 flex flex-col"
          style={{ top: "64px" }}
        >
          <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <h3 className="font-semibold text-gray-900">
              AI Workspace Assistant
            </h3>
            <button
              onClick={() => setIsChatbotVisible(false)}
              className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100 transition-colors"
              title="Close Chatbot"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pb-20">
            <UnifiedChatbot
              mode="workspace"
              onPageModification={handlePageModification}
            />
          </div>
        </div>
      )}
    </div>
  );
}
