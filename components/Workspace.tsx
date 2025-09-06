"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { PartialBlock } from "@blocknote/core";
import { Plus, Image, Trash2, Menu, MoreHorizontal } from "lucide-react";
import Sidebar from "./Sidebar";
import Breadcrumb from "./Breadcrumb";

const Editor = dynamic(() => import("./Editor"), {
  ssr: false,
  loading: () => <div className="p-4 text-gray-500">Loading editor...</div>
});

interface Page {
  id: string;
  title: string;
  content: PartialBlock[];
  icon?: string;
  cover?: {
    type: "color" | "image";
    value: string;
  };
  children?: Page[];
}

export default function Workspace() {
  const [pages, setPages] = useState<Page[]>([
    {
      id: "page-1",
      title: "My first page",
      content: [
        {
          type: "paragraph",
          content: "Welcome to your new page!",
        },
      ],
      children: [
        {
          id: "page-1-1",
          title: "Sub page 1",
          content: [],
        },
        {
          id: "page-1-2",
          title: "Sub page 2",
          content: [],
        }
      ]
    },
  ]);

  const [activePageId, setActivePageId] = useState<string>("page-1");
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [showCoverOptions, setShowCoverOptions] = useState(false);
  const [showCoverActions, setShowCoverActions] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const activePage = pages.find((page) => page.id === activePageId) || pages[0];

  const addNewWorkspacePage = () => {
    const newPage: Page = {
      id: `page-${Date.now()}`,
      title: `Workspace ${pages.length + 1}`,
      content: [],
    };
    setPages([...pages, newPage]);
    setActivePageId(newPage.id);
  };

  const addNewSubPage = () => {
    const newSubPage: Page = {
      id: `${activePageId}-sub-${Date.now()}`,
      title: `Sub page ${(activePage.children?.length || 0) + 1}`,
      content: [],
    };
    setPages(prev => prev.map(page =>
      page.id === activePageId
        ? { ...page, children: [...(page.children || []), newSubPage] }
        : page
    ));
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
      <Sidebar
        title="Workspace"
        icon="📁"
        pages={pages.map(p => ({ id: p.id, title: p.title, icon: p.icon, children: p.children }))}
        activePageId={activePageId}
        onAddPage={addNewWorkspacePage}
        onAddSubPage={addNewSubPage}
        onUpdatePageTitle={updatePageTitle}
        onSelectPage={setActivePageId}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        className={navbarVisible ? "top-16" : "top-0"}
      />

      <div className="flex-1 flex flex-col ml-0 md:ml-64">
        <div className={`fixed ${navbarVisible ? "top-16" : "top-0"} left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 md:left-64 transition-all duration-300`}>
          <div className="px-4 md:px-6 py-3 flex items-center justify-between">
            <Breadcrumb items={[
              { label: "Workspace", icon: "📁" },
              { label: activePage.title || "Untitled", icon: activePage.icon }
            ]} />
            <button
              onClick={addNewWorkspacePage}
              className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition-colors"
              title="Create new workspace page"
            >
              <Plus size={16} />
            </button>
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

        <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${navbarVisible ? "pt-20" : "pt-4"}`}>
          <div className="flex-1 overflow-auto">
            <div className="py-8">
              <div className="max-w-[900px] mx-auto pl-5 md:px-6 lg:px-8">
                <div className="flex justify-start">
                  <div className="w-full">
                    {/* Cover */}
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
                            showCoverActions || (!activePage.icon && !activePage.cover)
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

                    {/* Title + Actions */}
                    <div className="mb-6 pl-[23px] md:pl-0">
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
                              <Image size={16} className="mr-2" />
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
                        <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
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
                            <p className="text-xs text-gray-500 mt-1">Or enter image URL below</p>
                            <input
                              type="text"
                              placeholder="Enter image URL"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-2"
                              onBlur={(e) => {
                                if (e.target.value) {
                                  setPageCover(activePageId, {
                                    type: "image",
                                    value: e.target.value,
                                  });
                                }
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

                    {/* Editor */}
                    <div className="min-h-[400px] -ml-8 pl-[23px] md:pl-0">
                      <Editor
                        initialContent={activePage.content}
                        onChange={updatePageContent}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
