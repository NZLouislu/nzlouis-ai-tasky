"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { PartialBlock } from "@blocknote/core";
import Sidebar from "../Sidebar";
import BlogHeader from "./BlogHeader";
import BlogContent from "./BlogContent";
import BlogCover from "./BlogCover";
import IconSelector from "./IconSelector";
import CoverOptions from "./CoverOptions";
import DeleteDropdown from "./DeleteDropdown";
import ChatbotPanel from "./ChatbotPanel";

const Editor = dynamic(() => import("../Editor"), {
  ssr: false,
  loading: () => <div>Loading editor...</div>,
});



interface PostCover {
  type: "color" | "image";
  value: string;
}

interface Post {
  id: string;
  title: string;
  content: PartialBlock[];
  icon?: string;
  cover?: PostCover;
  parent_id?: string | null;
  children?: Post[];
  [key: string]: unknown;
}

interface PageModification {
  type: string;
  target?: string;
  content?: string;
  title?: string;
}

const mockBlogPosts = [
  {
    id: "1",
    title: "Getting Started with AI Writing",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Welcome to our AI-powered writing assistant! This blog post will help you get started with using AI to enhance your writing workflow.",
            styles: {},
          },
        ],
      },
      {
        type: "heading",
        content: "Key Features",
        props: {
          level: 2,
        },
      },
      {
        type: "bulletListItem",
        content: "AI content generation",
      },
      {
        type: "bulletListItem",
        content: "Real-time collaboration",
      },
      {
        type: "bulletListItem",
        content: "Smart editing suggestions",
      },
    ] as PartialBlock[],
    icon: "📝",
    cover: {
      type: "color" as const,
      value: "bg-blue-500",
    },
    parent_id: null,
    children: [
      {
        id: "1-1",
        title: "Basic Setup",
        content: [
          {
            type: "paragraph",
            content: "Learn how to configure your AI writing environment.",
          },
        ] as PartialBlock[],
        icon: "⚙️",
        parent_id: "1",
        children: [],
      },
      {
        id: "1-2",
        title: "Configuration Options",
        content: [
          {
            type: "paragraph",
            content: "Explore different configuration options available.",
          },
        ] as PartialBlock[],
        icon: "🔧",
        parent_id: "1",
        children: [],
      },
    ],
  },
  {
    id: "2",
    title: "Advanced AI Techniques",
    content: [
      {
        type: "paragraph",
        content:
          "Explore advanced techniques for leveraging AI in your writing process.",
      },
      {
        type: "heading",
        content: "Natural Language Processing",
        props: {
          level: 2,
        },
      },
      {
        type: "paragraph",
        content: "NLP is at the core of modern AI writing assistants.",
      },
    ] as PartialBlock[],
    icon: "🔬",
    cover: {
      type: "image" as const,
      value: "https://images.unsplash.com/photo-1677442135722-5f11e06a4e6d",
    },
    parent_id: null,
    children: [
      {
        id: "2-1",
        title: "Language Models",
        content: [
          {
            type: "paragraph",
            content: "Understanding transformer-based language models.",
          },
        ] as PartialBlock[],
        icon: "🤖",
        parent_id: "2",
        children: [],
      },
    ],
  },
  {
    id: "3",
    title: "Troubleshooting Guide",
    content: [
      {
        type: "paragraph",
        content:
          "Common issues and solutions when working with AI writing tools.",
      },
    ] as PartialBlock[],
    icon: "❓",
    parent_id: null,
    children: [],
  },
];

export default function BlogPageStorybook() {
  const [localPosts, setLocalPosts] = useState<Post[]>(mockBlogPosts);
  const [activePostId, setActivePostId] = useState<string>("1");
  const [expandedPages, setExpandedPages] = useState<Set<string>>(
    new Set(["1"])
  );
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [showCoverOptions, setShowCoverOptions] = useState(false);
  const [showCoverActions, setShowCoverActions] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isChatbotVisible, setIsChatbotVisible] = useState(false);
  const [chatbotWidth, setChatbotWidth] = useState(600);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDropdown, setShowDeleteDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const findPostById = useCallback(
    (posts: Post[] | undefined, id: string): Post | null => {
      if (!posts || !Array.isArray(posts)) return null;
      for (const post of posts) {
        if (post.id === id) return post;
        if (post.children && post.children.length > 0) {
          const found = findPostById(post.children, id);
          if (found) return found;
        }
      }
      return null;
    },
    []
  );

  const createNewPost = useCallback(async () => {
    const newPostId = `post-${Date.now()}`;
    const newPost: Post = {
      id: newPostId,
      title: "New Post",
      content: [{ type: "paragraph", content: "Start writing here..." }],
      parent_id: null,
      children: [],
    };

    setLocalPosts((prev) => [...prev, newPost]);
    setActivePostId(newPostId);
    return newPostId;
  }, []);

  const handleSetActivePostId = useCallback(
    async (postId: string) => {
      setActivePostId(postId);

      const newExpanded = new Set(expandedPages);
      const post = findPostById(localPosts, postId);

      if (post && post.parent_id) {
        newExpanded.add(post.parent_id);
      }

      setExpandedPages(newExpanded);
    },
    [expandedPages, localPosts, findPostById]
  );

  const togglePageExpansion = useCallback((pageId: string) => {
    setExpandedPages((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(pageId)) {
        newExpanded.delete(pageId);
      } else {
        newExpanded.add(pageId);
      }
      return newExpanded;
    });
  }, []);

  const updateLocalPostContent = useCallback(
    (newContent: PartialBlock[]) => {
      setLocalPosts((prev) => {
        return prev.map((p) =>
          p.id === activePostId ? { ...p, content: newContent } : p
        ) as Post[];
      });
    },
    [activePostId]
  );

  const updateLocalPostTitle = useCallback(
    async (postId: string, newTitle: string) => {
      setLocalPosts((prev) => {
        return prev.map((p) => (p.id === postId ? { ...p, title: newTitle } : p)) as Post[];
      });
    },
    []
  );

  const addNewSubPost = useCallback(
    async (parentPageId: string) => {
      const newSubPostId = `sub-post-${Date.now()}`;
      const newSubPost: Post = {
        id: newSubPostId,
        title: "New Sub Page",
        content: [{ type: "paragraph", content: "Start writing here..." }],
        parent_id: parentPageId,
        children: [],
      };

      setLocalPosts((prev) => {
        const updatePosts = (posts: Post[]): Post[] => {
          return posts.map((post) => {
            if (post.id === parentPageId) {
              return {
                ...post,
                children: [...(post.children || []), newSubPost],
              };
            }
            if (post.children && post.children.length > 0) {
              return {
                ...post,
                children: updatePosts(post.children),
              };
            }
            return post;
          });
        };

        return updatePosts(prev);
      });

      setExpandedPages((prev) => new Set(prev).add(parentPageId));
    },
    []
  );

  const handleDeletePost = useCallback(async () => {
    if (!activePostId) return;

    setLocalPosts((prev) => {
      const deletePostRecursive = (posts: Post[]): Post[] => {
        return posts
          .filter((post) => post.id !== activePostId)
          .map((post) => ({
            ...post,
            children: post.children ? deletePostRecursive(post.children) : [],
          }));
      };

      return deletePostRecursive(prev);
    });

    const remainingPosts = localPosts.filter((p) => p.id !== activePostId);
    if (remainingPosts.length > 0) {
      setActivePostId(remainingPosts[0].id);
    }

    setShowDeleteDropdown(false);
  }, [activePostId, localPosts]);

  const handlePageModification = useCallback(async (mod: PageModification) => {
    console.log("Handling page modification", mod);
    return "Modification applied";
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      setChatbotWidth(Math.max(300, Math.min(800, newWidth)));
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
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleManualSave = useCallback(async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  }, []);

  const iconOptions = [
    "📝",
    "📘",
    "📚",
    "📋",
    "📌",
    "🔍",
    "💡",
    "⚙️",
    "🛠️",
    "🔬",
    "🎨",
    "📊",
    "📈",
    "📉",
    "💰",
    "🛒",
  ];

  const colorOptions = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-gray-500",
  ];

  const setPostIcon = useCallback((postId: string, icon: string) => {
    setLocalPosts((prev) =>
      prev.map((post) => (post.id === postId ? { ...post, icon } : post))
    );
  }, []);

  const removePostIcon = useCallback((postId: string) => {
    setLocalPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, icon: undefined } : post
      )
    );
  }, []);

  const setPostCover = useCallback((postId: string, cover: PostCover) => {
    setLocalPosts((prev) =>
      prev.map((post) => (post.id === postId ? { ...post, cover } : post))
    );
  }, []);

  const removePostCover = useCallback((postId: string) => {
    setLocalPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, cover: undefined } : post
      )
    );
  }, []);

  const handleCoverFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (result) {
          setPostCover(activePostId, {
            type: "image",
            value: result,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const activePost = findPostById(localPosts, activePostId);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div
        className={`${sidebarCollapsed ? "w-0" : "w-64"} flex-shrink-0 transition-all duration-200`}
      >
        <Sidebar
          title="Blog"
          icon="📘"
          pages={localPosts}
          activePageId={activePostId}
          onAddPage={createNewPost}
          onAddSubPage={addNewSubPost}
          onUpdatePageTitle={updateLocalPostTitle}
          onSelectPage={handleSetActivePostId}
          sidebarOpen={sidebarOpen}
          expandedPages={expandedPages}
          onToggleExpand={togglePageExpansion}
          className="fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-40"
        />
      </div>

      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-200 ${sidebarCollapsed ? "ml-0" : "ml-64"}`}
      >
        <div className="h-16"></div>
        {activePost && (
          <>
            <BlogHeader
              setShowDeleteDropdown={setShowDeleteDropdown}
              showDeleteDropdown={showDeleteDropdown}
              dropdownRef={dropdownRef}
              handleDeletePost={handleDeletePost}
            />

            <BlogCover
              activePost={activePost}
              showCoverActions={showCoverActions}
              setShowCoverActions={setShowCoverActions}
              setShowCoverOptions={setShowCoverOptions}
              removePostCover={removePostCover}
              activePostId={activePostId}
            />

            <div className="flex-1 overflow-y-auto p-6">
              <BlogContent
                activePost={activePost}
                activePostId={activePostId}
                updatePostTitle={updateLocalPostTitle}
                updatePostContent={updateLocalPostContent}
                Editor={Editor}
                isSaving={isSaving}
                handleManualSave={handleManualSave}
              />
            </div>

            <IconSelector
              showIconSelector={showIconSelector}
              setShowIconSelector={setShowIconSelector}
              iconOptions={iconOptions}
              setPostIcon={setPostIcon}
              removePostIcon={removePostIcon}
              activePostId={activePostId}
            />

            <CoverOptions
              showCoverOptions={showCoverOptions}
              setShowCoverOptions={setShowCoverOptions}
              colorOptions={colorOptions}
              setPostCover={setPostCover}
              activePostId={activePostId}
              handleCoverFileSelect={handleCoverFileSelect}
            />

            <DeleteDropdown
              dropdownRef={dropdownRef}
              handleDeletePost={handleDeletePost}
            />
          </>
        )}

        <ChatbotPanel
          isChatbotVisible={isChatbotVisible}
          isMobile={isMobile}
          chatbotWidth={chatbotWidth}
          setIsChatbotVisible={setIsChatbotVisible}
          setSidebarOpen={setSidebarOpen}
          setSidebarCollapsed={setSidebarCollapsed}
          handleMouseDown={handleMouseDown}
          handlePageModification={handlePageModification}
        />
      </div>
    </div>
  );
}