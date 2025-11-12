"use client";
import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { PartialBlock } from "@blocknote/core";
import Sidebar from "../Sidebar";
import { useBlogDataReadonly } from "@/hooks/use-blog-data-readonly";
import BlogCover from "./BlogCover";
import ChatbotPanel from "./ChatbotPanel";

interface PageModification {
  type: string;
  target?: string;
  content?: string;
  title?: string;
}

const Editor = dynamic(() => import("../Editor"), {
  ssr: false,
  loading: () => <div className="p-4 text-gray-500">Loading editor...</div>,
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



export default function BlogPageFromDB() {
  const {
    posts,
    isLoading,
    error,
    userId,
    setUserId,
  } = useBlogDataReadonly();

  const [localPosts, setLocalPosts] = useState<Post[]>([]);
  const [activePostId, setActivePostId] = useState<string>("");
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isChatbotVisible, setIsChatbotVisible] = useState(false);
  const [chatbotWidth, setChatbotWidth] = useState(600);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const mapPosts = useCallback((posts: Post[]): Post[] => {
    return posts.map((p) => ({
      ...p,
      content: (p.content as PartialBlock[]) || [],
      children: p.children ? mapPosts(p.children) : [],
      cover: p.cover
        ? {
            type:
              p.cover.type === "color" || p.cover.type === "image"
                ? p.cover.type
                : "color",
            value: p.cover.value || "",
          }
        : undefined,
    }));
  }, []);

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

  const findFirstAvailablePost = useCallback(
    (postList: Post[] | undefined): Post | null => {
      if (!postList || !Array.isArray(postList)) return null;
      for (const post of postList) {
        if (!post.parent_id) {
          return post;
        }
        if (post.children && post.children.length > 0) {
          const childPost = findFirstAvailablePost(post.children);
          if (childPost) return childPost;
        }
      }
      return postList[0] || null;
    },
    []
  );

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

  useEffect(() => {
    const isStorybook = typeof window !== "undefined" && 
      (window.location.port === "6007" || window.location.port === "6006");
    
    if (isStorybook) {
      const fetchRealUserId = async () => {
        try {
          const response = await fetch("/api/test-tasky-connection");
          const data = await response.json();
          
          if (data.success && data.posts && data.posts.length > 0) {
            const realUserId = data.posts[0].user_id;
            if (userId !== realUserId) {
              setUserId(realUserId);
              console.log("Using real userId from database:", realUserId);
            }
          } else {
            console.log("No posts found, using fallback userId");
            const fallbackUserId = "6d5ae2bf-cf17-4c69-b026-f86529ee37cd";
            if (userId !== fallbackUserId) {
              setUserId(fallbackUserId);
            }
          }
        } catch (error) {
          console.error("Failed to fetch real userId:", error);
          const fallbackUserId = "6d5ae2bf-cf17-4c69-b026-f86529ee37cd";
          if (userId !== fallbackUserId) {
            setUserId(fallbackUserId);
          }
        }
      };
      
      fetchRealUserId();
    } else if (userId === "00000000-0000-0000-0000-000000000000") {
      const realUserId = "6d5ae2bf-cf17-4c69-b026-f86529ee37cd";
      setUserId(realUserId);
      console.log("Using real userId for blog page:", realUserId);
    } else {
      console.log("Using existing userId:", userId);
    }
  }, [userId, setUserId]);

  useEffect(() => {
    if (posts) {
      const convertedPosts: Post[] = posts.map((post) => ({
        ...post,
        content: (post.content as PartialBlock[]) || [],
        children: post.children
          ? post.children.map((child) => ({
              ...child,
              content: (child.content as PartialBlock[]) || [],
            }))
          : [],
        cover: post.cover
          ? {
              type:
                post.cover.type === "color" || post.cover.type === "image"
                  ? post.cover.type
                  : "color",
              value: post.cover.value || "",
            }
          : undefined,
      }));

      const mapped = mapPosts(convertedPosts);
      setLocalPosts(mapped);

      if (mapped.length > 0 && !activePostId) {
        const defaultPost = findFirstAvailablePost(mapped);
        if (defaultPost) {
          setActivePostId(defaultPost.id);
          setExpandedPages(new Set([defaultPost.id]));
        }
      }
    }
  }, [posts, mapPosts, findFirstAvailablePost, activePostId]);

  const handlePageModification = useCallback(async (mod: PageModification) => {
    const instruction = typeof mod === 'string' ? mod : mod.content || mod.title || '';
    console.log("Read-only mode: Page modification not allowed", instruction);
    return "Read-only mode: Modifications not allowed";
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



  const activePost = findPostById(localPosts, activePostId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading blog posts from database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200">
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Error loading blog posts
          </h2>
          <p className="text-red-600 mb-4">
            {error && typeof error === "object" && "message" in error
              ? (error as Error).message
              : "An unknown error occurred"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div
        className={`${sidebarCollapsed ? "w-0" : "w-64"} flex-shrink-0 transition-all duration-200`}
      >
        <Sidebar
          title="Blog (Read-Only)"
          icon="📘"
          pages={localPosts}
          activePageId={activePostId}
          onAddPage={() => Promise.resolve("")}
          onAddSubPage={() => Promise.resolve()}
          onUpdatePageTitle={() => Promise.resolve()}
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
            <div className="fixed top-0 left-64 right-0 bg-white border-b border-gray-200 z-30 px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{activePost.icon || "📄"}</span>
                  <h1 className="text-xl font-semibold text-gray-800">
                    {activePost.title}
                  </h1>
                </div>
                <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                  Read-Only Mode
                </div>
              </div>
            </div>

            <BlogCover
              activePost={activePost}
              showCoverActions={false}
              setShowCoverActions={() => {}}
              setShowCoverOptions={() => {}}
              removePostCover={() => {}}
              activePostId={activePostId}
            />

            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto">
                <div className="prose prose-lg max-w-none">
                  <Editor
                    key={activePostId}
                    initialContent={activePost.content}
                    onChange={() => {}}
                  />
                </div>
              </div>
            </div>
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