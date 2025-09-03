"use client";
import { useState } from "react";
import Editor from "./Editor";
import { PartialBlock } from "@blocknote/core";
import { Plus, Image, Trash2, Menu } from "lucide-react";

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
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-30 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-200 ease-in-out w-64 bg-gray-50 border-r border-gray-200 flex-col`}
      >
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <span className="mr-2">📁</span> Workspace
          </h2>
        </div>

        <div
          className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 flex items-center cursor-pointer rounded-md"
          onClick={addNewPage}
        >
          <Plus size={16} className="mr-2 text-gray-500" />
          New Page
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {pages.map((page) => (
              <div
                key={page.id}
                onClick={() => {
                  setActivePageId(page.id);
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
                {activePageId === page.id ? (
                  <input
                    type="text"
                    value={page.title}
                    onChange={(e) => updatePageTitle(page.id, e.target.value)}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center">
          <div className="md:hidden mr-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={20} />
            </button>
          </div>
          <nav className="text-sm text-gray-500 flex items-center">
            <span className="flex items-center">
              <span className="mr-1">📁</span> Workspace
            </span>
            <span className="mx-2">/</span>
            <span className="text-gray-900 flex items-center">
              {activePage.icon && (
                <span className="mr-1">{activePage.icon}</span>
              )}
              {activePage.title}
            </span>
          </nav>
        </div>

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
            <div className="max-w-[900px] mx-auto px-4">
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
                        <Image size={16} className="mr-1" />
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
                          >
                            {activePage.icon}
                          </span>
                        </div>
                      ) : null}
                      <div
                        className="text-3xl font-bold text-gray-800 text-left w-full"
                        onClick={() => {
                          const input = document.getElementById(
                            `title-input-${activePageId}`
                          );
                          if (input) {
                            input.focus();
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
  );
}
