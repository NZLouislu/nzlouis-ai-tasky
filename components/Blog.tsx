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
  Book,
  X,
  MessageCircle,
} from "lucide-react";
import Sidebar from "./Sidebar";
import UnifiedChatbot from "./UnifiedChatbot";

const Editor = dynamic(() => import("./Editor"), {
  ssr: false,
  loading: () => <div className="p-4 text-gray-500">Loading editor...</div>,
});

interface Post {
  id: string;
  title: string;
  content: PartialBlock[];
  icon?: string;
  cover?: {
    type: "color" | "image";
    value: string;
  };
  children?: Post[];
}

export default function Blog() {
  const [posts, setPosts] = useState<Post[]>([
    {
      id: "post-1",
      title: "My first blog post",
      content: [
        {
          type: "paragraph",
          content: "Welcome to your new blog post!",
        },
      ],
      children: [
        {
          id: "post-1-1",
          title: "Introduction",
          content: [],
        },
        {
          id: "post-1-2",
          title: "Conclusion",
          content: [],
        },
      ],
    },
  ]);

  const [activePostId, setActivePostId] = useState<string>("post-1");
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [showCoverOptions, setShowCoverOptions] = useState(false);
  const [showCoverActions, setShowCoverActions] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isChatbotVisible, setIsChatbotVisible] = useState(false);
  const [chatbotWidth, setChatbotWidth] = useState(600);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // const containerRef = useRef<HTMLDivElement>(null);

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

  const activePost = posts.find((post) => post.id === activePostId) || posts[0];

  const addNewPost = () => {
    const newPost: Post = {
      id: `post-${Date.now()}`,
      title: `Post ${posts.length + 1}`,
      content: [],
    };
    setPosts([...posts, newPost]);
    setActivePostId(newPost.id);
  };

  const addNewSubPost = (parentId: string) => {
    const newSubPost: Post = {
      id: `${parentId}-sub-${Date.now()}`,
      title: `Sub post ${
        posts.find((p) => p.id === parentId)?.children?.length || 0 + 1
      }`,
      content: [],
    };
    setPosts((prev) =>
      prev.map((post) =>
        post.id === parentId
          ? { ...post, children: [...(post.children || []), newSubPost] }
          : post
      )
    );
    setActivePostId(newSubPost.id);
  };

  const updatePostTitle = (postId: string, newTitle: string) => {
    setPosts(
      posts.map((post) =>
        post.id === postId ? { ...post, title: newTitle } : post
      )
    );
  };

  const updatePostContent = (newContent: PartialBlock[]) => {
    setPosts(
      posts.map((post) =>
        post.id === activePostId ? { ...post, content: newContent } : post
      )
    );
  };

  const setPostIcon = (postId: string, icon: string) => {
    setPosts(
      posts.map((post) => (post.id === postId ? { ...post, icon } : post))
    );
    setShowIconSelector(false);
  };

  const removePostIcon = (postId: string) => {
    setPosts(
      posts.map((post) =>
        post.id === postId ? { ...post, icon: undefined } : post
      )
    );
    setShowIconSelector(false);
  };

  const setPostCover = (
    postId: string,
    cover: { type: "color" | "image"; value: string }
  ) => {
    setPosts(
      posts.map((post) => (post.id === postId ? { ...post, cover } : post))
    );
    setShowCoverOptions(false);
  };

  const removePostCover = (postId: string) => {
    setPosts(
      posts.map((post) =>
        post.id === postId ? { ...post, cover: undefined } : post
      )
    );
  };

  const handleCoverFileUpload = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPostCover(activePostId, {
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
        const newContent = [...activePost.content, newBlock];
        updatePostContent(newContent);
        return `Added content to the blog post`;

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
        updatePostContent([...activePost.content, editBlock]);
        return `Edited content in the blog post`;

      case "create_page":
        addNewPost();
        return `Created new blog post: "${modification.title || "Untitled"}"`;

      case "set_title":
        if (!modification.title)
          return "Title is required for set title operation";
        updatePostTitle(activePostId, modification.title);
        return `Set blog post title to: "${modification.title}"`;

      case "add_heading":
        if (!modification.content)
          return "Content is required for add heading operation";
        const headingBlock: PartialBlock = {
          type: "heading",
          content: [{ type: "text", text: modification.content, styles: {} }],
          props: { level: 1 },
        };
        updatePostContent([...activePost.content, headingBlock]);
        return `Added heading: "${modification.content}"`;

      case "add_paragraph":
        if (!modification.content)
          return "Content is required for add paragraph operation";
        const paraBlock: PartialBlock = {
          type: "paragraph",
          content: [{ type: "text", text: modification.content, styles: {} }],
        };
        updatePostContent([...activePost.content, paraBlock]);
        return `Added paragraph: "${modification.content}"`;

      default:
        return "Unknown modification type";
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
          title="Blog"
          icon="📖"
          pages={posts.map((p) => ({
            id: p.id,
            title: p.title,
            icon: p.icon,
            children: p.children,
          }))}
          activePageId={activePostId}
          onAddPage={addNewPost}
          onAddSubPage={addNewSubPost}
          onUpdatePageTitle={updatePostTitle}
          onSelectPage={setActivePostId}
          sidebarOpen={sidebarOpen && !(isChatbotVisible && isMobile)}
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
            <Book size={20} />
          </button>
        </div>
      )}

      <div
        className={`flex-1 flex flex-col transition-all duration-200 ${
          sidebarCollapsed ? "ml-0 md:ml-12" : "ml-0 md:ml-64"
        }`}
      >
        <div className="md:hidden p-4 border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
        </div>

        <div
          className={`flex-1 flex overflow-hidden ${
            isChatbotVisible && !isMobile ? `pr-0` : ""
          }`}
          style={{
            paddingTop: "80px",
            paddingRight:
              isChatbotVisible && !isMobile ? `${chatbotWidth}px` : "0",
          }}
        >
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 pb-8">
              <div className="max-w-[900px] mx-auto">
                <div className="w-full">
                  {activePost.cover && (
                    <div
                      className="relative mb-8 rounded-lg overflow-hidden"
                      onMouseEnter={() => setShowCoverActions(true)}
                      onMouseLeave={() => setShowCoverActions(false)}
                      style={{
                        height: "12rem",
                      }}
                    >
                      {activePost.cover.type === "color" ? (
                        <div
                          className={`h-full ${activePost.cover.value}`}
                        ></div>
                      ) : (
                        <div
                          className="h-full bg-cover bg-center"
                          style={{
                            backgroundImage: `url(${activePost.cover.value})`,
                          }}
                        ></div>
                      )}
                      <div
                        className={`absolute bottom-4 right-4 flex space-x-2 transition-opacity duration-200 ${
                          showCoverActions ||
                          (!activePost.icon && !activePost.cover)
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
                          onClick={() => removePostCover(activePostId)}
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
                        {!activePost.icon && !activePost.cover && (
                          <button
                            onClick={() =>
                              setShowIconSelector(!showIconSelector)
                            }
                            className="flex items-center text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
                          >
                            <Plus size={16} className="mr-2" />
                            Add Icon
                          </button>
                        )}

                        {!activePost.cover && (
                          <button
                            onClick={() =>
                              setShowCoverOptions(!showCoverOptions)
                            }
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
                              onClick={() => setPostIcon(activePostId, icon)}
                              className="text-2xl p-3 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              {icon}
                            </button>
                          ))}
                          <button
                            onClick={() => removePostIcon(activePostId)}
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
                                  setPostCover(activePostId, {
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
                                setPostCover(activePostId, {
                                  type: "image",
                                  value: e.target.value,
                                });
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center">
                      {activePost.icon && (
                        <div className="relative mr-4">
                          <span
                            className="text-3xl cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors"
                            onClick={() => setShowIconSelector(true)}
                          >
                            {activePost.icon}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          id={`title-input-${activePostId}`}
                          type="text"
                          value={activePost.title}
                          onChange={(e) =>
                            updatePostTitle(activePostId, e.target.value)
                          }
                          placeholder="Untitled"
                          className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-4xl font-bold text-gray-800 placeholder-gray-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="min-h-[400px]">
                    <Editor
                      initialContent={activePost.content}
                      onChange={updatePostContent}
                    />
                  </div>
                </div>
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
            className="fixed right-0 bg-white shadow-xl flex flex-col z-10 transition-all duration-300"
            style={{
              width: chatbotWidth,
              top: "64px",
              bottom: "0",
            }}
          >
            <div className="p-4 border-b border-gray-200 flex-shrink-0 relative">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">AI Blog Assistant</h3>
                <button
                  onClick={() => setIsChatbotVisible(false)}
                  className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100 transition-colors"
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
          <div className="p-4 border-b border-gray-200 flex items-center justify-center flex-shrink-0">
            <h3 className="font-semibold">AI Blog Assistant</h3>
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
