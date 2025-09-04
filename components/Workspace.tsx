"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { PartialBlock } from "@blocknote/core";
import { Plus, Image, Trash2, Menu } from "lucide-react";
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

  const addNewPage = () => {
    const newPage: Page = {
      id: `page-${Date.now()}`,
      title: `Page ${pages.length + 1}`,
      content: [],
    };
    setPages([...pages, newPage]);
    setActivePageId(newPage.id);
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
        pages={pages.map(p => ({ id: p.id, title: p.title, icon: p.icon }))}
        activePageId={activePageId}
        onAddPage={addNewPage}
        onUpdatePageTitle={updatePageTitle}
        onSelectPage={setActivePageId}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        className={navbarVisible ? "top-16" : "top-0"}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-0 md:ml-64 lg:ml-64">
        <div className={`fixed ${navbarVisible ? "top-16" : "top-0"} left-0 right-0 z-40 bg-white/30 backdrop-blur-md border-b border-gray-200 md:left-64 lg:left-64 transition-all duration-300`}>
          <div className="p-4 md:pl-4 lg:pl-4">
            <Breadcrumb items={[
              { label: "Workspace", icon: "📁" },
              { label: activePage.title || "Untitled", icon: activePage.icon }
            ]} />
          </div>
        </div>

        <div className="md:hidden p-4 border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-600 hover:text-gray-900"
          >
            <Menu size={20} />
          </button>
        </div>

        <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${navbarVisible ? "pt-20" : "pt-4"}`}>
          <div className="flex-1 overflow-auto">
            <div className="py-8">
              {/* Cover */}
              {activePage.cover && (
                <div
                  className="relative"
                  onMouseEnter={() => setShowCoverActions(true)}
                  onMouseLeave={() => setShowCoverActions(false)}
                  style={{
                    marginTop: "2px",
                    height: "12rem",
                    marginBottom: "8px",
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

              {/* Title + Editor */}
              <div className="max-w-[900px] mx-auto px-2 md:px-2 lg:px-8">
                <div className="flex justify-start">
                  <div className="w-full">
                    <div className="flex space-x-2 mb-2 transition-opacity duration-200 pl-8">
                      {!activePage.icon && (
                        <button
                          onClick={() => setShowIconSelector(!showIconSelector)}
                          className="flex items-center text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded"
                        >
                          <Plus size={16} className="mr-1" />
                          Add Icon
                        </button>
                      )}

                      {!activePage.cover && (
                        <button
                          onClick={() => setShowCoverOptions(!showCoverOptions)}
                          className="flex items-center text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded"
                        >
                          <Image size={16} className="mr-1" aria-label="Add cover" />
                          Add Cover
                        </button>
                      )}
                    </div>

                    {showIconSelector && (
                      <div className="mb-3 p-3 bg-white border border-gray-200 rounded-lg shadow-lg ml-8">
                        <div className="grid grid-cols-8 gap-2">
                          {iconOptions.map((icon) => (
                            <button
                              key={icon}
                              onClick={() => setPageIcon(activePageId, icon)}
                              className="text-lg p-2 hover:bg-gray-100 rounded"
                            >
                              {icon}
                            </button>
                          ))}
                          <button
                            onClick={() => removePageIcon(activePageId)}
                            className="text-sm p-2 hover:bg-gray-100 rounded flex items-center justify-center text-gray-500"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}

                    {showCoverOptions && (
                      <div className="mb-3 p-3 bg-white border border-gray-200 rounded-lg shadow-lg ml-8">
                        <div className="mb-3">
                          <h3 className="text-sm font-medium text-gray-700 mb-2">
                            Colors
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {colorOptions.map((color) => (
                              <button
                                key={color}
                                onClick={() =>
                                  setPageCover(activePageId, {
                                    type: "color",
                                    value: color,
                                  })
                                }
                                className={`w-8 h-8 rounded ${color} hover:opacity-80`}
                              ></button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-2">
                            Image URL
                          </h3>
                          <input
                            type="text"
                            placeholder="Enter image URL"
                            className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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

                    <div className="mb-6 mt-2 ml-8">
                      <div className="flex items-center">
                        {activePage.icon ? (
                          <div className="relative">
                            <span
                              className="text-2xl mr-3 cursor-pointer"
                              onClick={() => setShowIconSelector(true)}
                              role="button"
                              tabIndex={0}
                              aria-label="Edit page icon"
                            >
                              {activePage.icon}
                            </span>
                          </div>
                        ) : null}
                        <div
                          className="text-3xl font-bold text-gray-800 text-left w-full"
                          onClick={() => {
                            if (typeof window !== 'undefined') {
                              const input = document.getElementById(
                                `title-input-${activePageId}`
                              );
                              if (input) {
                                input.focus();
                              }
                            }
                          }}
                        >
                          <input
                            id={`title-input-${activePageId}`}
                            type="text"
                            value={activePage.title}
                            onChange={(e) =>
                              updatePageTitle(activePageId, e.target.value)
                            }
                            placeholder="Untitled"
                            className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-3xl font-bold text-gray-800 placeholder-gray-400"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-left -ml-4">
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
