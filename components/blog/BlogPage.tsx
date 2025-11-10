"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { PartialBlock } from "@blocknote/core";
import Sidebar from "../Sidebar";
import { useBlogData } from "@/hooks/use-blog-data";
import { supabase } from "@/lib/supabase/supabase-client";
import { getTaskySupabaseConfig } from "@/lib/environment";
import BlogHeader from "./BlogHeader";
import BlogContent from "./BlogContent";
import BlogCover from "./BlogCover";
import IconSelector from "./IconSelector";
import CoverOptions from "./CoverOptions";
import DeleteDropdown from "./DeleteDropdown";
import ChatbotPanel from "./ChatbotPanel";

// Use different Editor imports in Storybook environment and other environments
const isStorybookEnv =
  typeof window !== "undefined" && window.location.search.includes("storybook");

// Dynamically decide which Editor to use
const getEditorComponent = () => {
  if (isStorybookEnv) {
    try {
      // Use dynamic import instead of require
      const EditorComponent = dynamic(() => import("../Editor"), {
        ssr: false,
        loading: () => <div>Loading editor...</div>,
      });
      EditorComponent.displayName = "EditorComponent";
      return EditorComponent;
    } catch (error) {
      // If dynamic import fails, return a simple alternative component
      console.warn("Failed to load Editor component:", error);
      const FallbackComponent = () => (
        <div>Editor Component (Storybook Mode)</div>
      );
      FallbackComponent.displayName = "FallbackEditorComponent";
      return FallbackComponent;
    }
  } else {
    // Use dynamic import in normal environment
    const EditorComponent = dynamic(() => import("../Editor"), {
      ssr: false,
      loading: () => <div className="p-4 text-gray-500">Loading editor...</div>,
    });
    EditorComponent.displayName = "EditorComponent";
    return EditorComponent;
  }
};

const Editor = getEditorComponent();

const DEFAULT_POST_ID = "11111111-1111-4111-8111-111111111111";

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

// Mock data for Storybook - extended version
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
      type: "color",
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
      type: "image",
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
  {
    id: "4",
    title: "Best Practices for Content Creation",
    content: [
      {
        type: "paragraph",
        content:
          "Learn the best practices for creating high-quality content with AI assistance.",
      },
    ] as PartialBlock[],
    icon: "🏆",
    cover: {
      type: "color",
      value: "bg-green-500",
    },
    parent_id: null,
    children: [
      {
        id: "4-1",
        title: "Content Strategy",
        content: [
          {
            type: "paragraph",
            content: "Developing an effective content strategy.",
          },
        ] as PartialBlock[],
        icon: "🧭",
        parent_id: "4",
        children: [],
      },
      {
        id: "4-2",
        title: "SEO Optimization",
        content: [
          {
            type: "paragraph",
            content: "Optimizing your content for search engines.",
          },
        ] as PartialBlock[],
        icon: "🔍",
        parent_id: "4",
        children: [],
      },
    ],
  },
  {
    id: "5",
    title: "Case Studies",
    content: [
      {
        type: "paragraph",
        content:
          "Real-world examples of successful AI-assisted writing projects.",
      },
    ] as PartialBlock[],
    icon: "📚",
    cover: {
      type: "color",
      value: "bg-purple-500",
    },
    parent_id: null,
    children: [
      {
        id: "5-1",
        title: "Marketing Copy",
        content: [
          {
            type: "paragraph",
            content:
              "How AI helped a company improve their marketing copy performance.",
          },
        ] as PartialBlock[],
        icon: "📢",
        parent_id: "5",
        children: [],
      },
      {
        id: "5-2",
        title: "Technical Documentation",
        content: [
          {
            type: "paragraph",
            content: "Streamlining technical documentation with AI tools.",
          },
        ] as PartialBlock[],
        icon: "📄",
        parent_id: "5",
        children: [],
      },
    ],
  },
  {
    id: "6",
    title: "Future of AI Writing",
    content: [
      {
        type: "paragraph",
        content:
          "Exploring the future trends and developments in AI writing technology.",
      },
    ] as PartialBlock[],
    icon: "🚀",
    cover: {
      type: "image",
      value: "https://images.unsplash.com/photo-1677442135723-5f11e06a4e6e",
    },
    parent_id: null,
    children: [],
  },
];

export default function BlogPage() {
  // Check if we're in a Storybook environment
  const isStorybook =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1") &&
    (window.location.port === "6006" ||
      window.location.port === "6007" ||
      window.location.port === "6008" ||
      window.location.port === "6009" ||
      window.location.port === "6010" ||
      window.location.port === "6011" ||
      window.location.port === "6012" ||
      window.location.port === "6013" ||
      window.location.port === "6014" ||
      window.location.port === "6015" ||
      window.location.port === "6016");

  // Always call the hook to comply with React Hooks rules
  const realBlogData = useBlogData();

  // Provide mock data for Storybook
  const mockBlogData = {
    posts: mockBlogPosts,
    isLoading: false,
    error: null,
    addNewPost: () => Promise.resolve("new-post-id"),
    addNewSubPost: () => Promise.resolve("new-sub-post-id"),
    updatePostTitle: (postId: string, title: string) => {
      console.log("Mock updatePostTitle:", postId, title);
      return Promise.resolve();
    },
    updatePostContent: (postId: string, content: unknown) => {
      console.log("Mock updatePostContent:", postId, content);
      return Promise.resolve();
    },
    setPostIcon: (postId: string, icon: string) => {
      console.log("Mock setPostIcon:", postId, icon);
      setLocalPosts((prev) =>
        prev.map((post) => (post.id === postId ? { ...post, icon } : post))
      );
      return Promise.resolve();
    },
    removePostIcon: (postId: string) => {
      console.log("Mock removePostIcon:", postId);
      setLocalPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, icon: undefined } : post
        )
      );
      return Promise.resolve();
    },
    setPostCover: (postId: string, cover: PostCover) => {
      console.log("Mock setPostCover:", postId, cover);
      setLocalPosts((prev) =>
        prev.map((post) => (post.id === postId ? { ...post, cover } : post))
      );
      return Promise.resolve();
    },
    removePostCover: (postId: string) => {
      console.log("Mock removePostCover:", postId);
      setLocalPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, cover: undefined } : post
        )
      );
      return Promise.resolve();
    },
    deletePost: () => Promise.resolve(),
    userId: "storybook-user",
    setUserId: () => {},
  };

  // Use mock data in Storybook, otherwise use real hook
  const blogData = isStorybook ? mockBlogData : realBlogData;

  const {
    posts,
    isLoading,
    error,
    addNewPost,
    addNewSubPost: addNewSubPostHook,
    updatePostTitle,
    setPostIcon,
    removePostIcon,
    setPostCover,
    removePostCover,
    deletePost,
    userId,
    setUserId,
  } = blogData;

  const [localPosts, setLocalPosts] = useState<Post[]>([]);
  const [activePostId, setActivePostId] = useState<string>(DEFAULT_POST_ID);
  const [expandedPages, setExpandedPages] = useState<Set<string>>(
    new Set([DEFAULT_POST_ID])
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
  const unsavedChanges = useRef<Map<string, Post>>(new Map());

  const createNewPost = useCallback(async () => {
    try {
      console.log("Creating new post");
      const newPostId = await addNewPost();
      console.log("Created new post with ID:", newPostId);
      setActivePostId(newPostId);
      return newPostId;
    } catch (error) {
      console.error("Failed to create new post:", error);
      throw error;
    }
  }, [addNewPost]);

  useEffect(() => {
    if (userId === "00000000-0000-0000-0000-000000000000") {
      const realUserId = "6d5ae2bf-cf17-4c69-b026-f86529ee37cd";
      setUserId(realUserId);
      console.log("Using real userId for blog page:", realUserId);
    } else {
      console.log("Using existing userId:", userId);
    }
  }, [userId, setUserId]);

  // Sync local UI state with data fetched by useBlogData
  const mapPosts = useCallback((posts: Post[]): Post[] => {
    return posts.map((p) => ({
      ...p,
      content: (p.content as PartialBlock[]) || [],
      children: p.children ? mapPosts(p.children) : [],
      // Ensure cover.type is properly typed
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

  const savePostToDatabase = useCallback(
    async (post: Post) => {
      // Skip database save operations in Storybook environment
      if (isStorybook) {
        console.log("Skipping database save in Storybook environment");
        unsavedChanges.current.delete(post.id);
        return;
      }

      if (!supabase || supabase === null) {
        console.warn(
          "Supabase client not configured. Skipping save operation."
        );
        console.warn("Current Supabase config:", getTaskySupabaseConfig());
        unsavedChanges.current.delete(post.id);
        return;
      }

      try {
        const { error } = await supabase.from("blog_posts").upsert({
          id: post.id,
          user_id: userId,
          title: post.title,
          content: post.content,
          icon: post.icon,
          cover: post.cover,
          parent_id: post.parent_id ?? null,
          updated_at: new Date().toISOString(),
        });

        if (error) {
          console.error(`Failed to save post ${post.id}:`, error);
          throw error;
        }

        console.log(`Successfully saved post ${post.id} to database`);
        unsavedChanges.current.delete(post.id);
      } catch (error) {
        console.error(`Error saving post ${post.id}:`, error);
        throw error;
      }
    },
    [userId, isStorybook]
  );

  const handleSetActivePostId = useCallback(
    async (postId: string) => {
      const currentPost = unsavedChanges.current.get(activePostId);
      if (currentPost) {
        await savePostToDatabase(currentPost);
      }
      setActivePostId(postId);

      const newExpanded = new Set(expandedPages);
      const post = findPostById(localPosts, postId);

      if (post && post.parent_id) {
        newExpanded.add(post.parent_id);
      }

      setExpandedPages(newExpanded);
    },
    [activePostId, expandedPages, localPosts, findPostById, savePostToDatabase]
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
    if (posts && localPosts.length === 0) {
      // Convert BlogPost[] to Post[] with proper type handling
      const convertedPosts: Post[] = posts.map((post) => ({
        ...post,
        content: (post.content as PartialBlock[]) || [],
        children: post.children
          ? post.children.map((child) => ({
              ...child,
              content: (child.content as PartialBlock[]) || [],
            }))
          : [],
        // Ensure cover.type is properly typed
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

      if (mapped.length > 0) {
        const currentPostExists = findPostById(mapped, activePostId);
        if (!currentPostExists) {
          const defaultPost = findFirstAvailablePost(mapped);
          if (defaultPost) {
            // Only update if the current activePostId is not the default post's ID
            if (activePostId !== defaultPost.id) {
              setActivePostId(defaultPost.id);
            }
          }
        }
      }
    }
  }, [
    posts,
    activePostId,
    findPostById,
    findFirstAvailablePost,
    mapPosts,
    localPosts.length,
    isStorybook,
  ]);

  useEffect(() => {
    if (userId && userId !== "00000000-0000-0000-0000-000000000000") {
      // Here we can call the logic to re-fetch posts, but currently we rely on the useBlogData hook to handle it
      console.log("UserId changed to:", userId);
    }
  }, [userId]);

  // Add effect to monitor localPosts changes
  useEffect(() => {
    console.log("localPosts updated:", localPosts.length, "posts");
    if (localPosts.length > 0) {
      console.log("First post ID:", localPosts[0].id);
    }
  }, [localPosts]);

  const saveAllUnsavedChanges = useCallback(async () => {
    const unsaved = Array.from(unsavedChanges.current.values());
    if (unsaved.length === 0) return;

    console.log(`Saving ${unsaved.length} unsaved posts...`);
    setIsSaving(true);

    try {
      // Skip database save operations in Storybook environment
      if (isStorybook) {
        console.log("Skipping database save in Storybook environment");
        unsavedChanges.current.clear();
        return;
      }

      if (!supabase || supabase === null) {
        console.warn(
          "Supabase client not configured. Skipping save operation."
        );
        unsavedChanges.current.clear();
        return;
      }

      // Save all posts directly to database and update localPosts
      for (const post of unsaved) {
        try {
          const { error } = await supabase.from("blog_posts").upsert({
            id: post.id,
            user_id: userId,
            title: post.title,
            content: post.content,
            icon: post.icon,
            cover: post.cover,
            parent_id: post.parent_id ?? null,
            updated_at: new Date().toISOString(),
          });

          if (error) {
            console.error(`Failed to save post ${post.id}:`, error);
            throw error;
          }

          console.log(`Successfully saved post ${post.id} to database`);

          // Update localPosts with the saved content
          setLocalPosts((prev) => {
            const updatePostRecursively = (posts: Post[]): Post[] => {
              return posts.map((p) => {
                if (p.id === post.id) {
                  return { ...post, updated_at: new Date().toISOString() };
                }
                if (p.children && p.children.length > 0) {
                  return { ...p, children: updatePostRecursively(p.children) };
                }
                return p;
              });
            };
            return updatePostRecursively(prev);
          });

          unsavedChanges.current.delete(post.id);
        } catch (error) {
          console.error(`Error saving post ${post.id}:`, error);
          throw error;
        }
      }

      console.log("All unsaved posts saved successfully");
    } catch (error) {
      console.error("Error saving all unsaved posts:", error);
    } finally {
      setIsSaving(false);
    }
  }, [userId, isStorybook]);

  const updateLocalPostContent = useCallback(
    (newContent: PartialBlock[]) => {
      setLocalPosts((prev) => {
        const post = findPostById(prev, activePostId);
        if (!post) return prev;

        const updatedPost = { ...post, content: newContent };
        const newUnsavedChanges = new Map(unsavedChanges.current);
        newUnsavedChanges.set(activePostId, updatedPost);
        unsavedChanges.current = newUnsavedChanges;

        return prev.map((p) =>
          p.id === activePostId ? updatedPost : p
        ) as Post[];
      });
    },
    [activePostId, findPostById]
  );

  const updateLocalPostTitle = useCallback(
    async (postId: string, newTitle: string) => {
      setLocalPosts((prev) => {
        const post = findPostById(prev, postId);
        if (!post) return prev;

        const updatedPost = { ...post, title: newTitle };
        const newUnsavedChanges = new Map(unsavedChanges.current);
        newUnsavedChanges.set(postId, updatedPost);
        unsavedChanges.current = newUnsavedChanges;

        return prev.map((p) => (p.id === postId ? updatedPost : p)) as Post[];
      });

      // Skip database save operations in Storybook environment
      if (isStorybook) {
        console.log("Skipping database save in Storybook environment");
        return;
      }

      try {
        await updatePostTitle(postId, newTitle);
      } catch (error) {
        console.error("Failed to update post title:", error);
      }
    },
    [updatePostTitle, isStorybook, findPostById]
  );

  const addNewSubPost = useCallback(
    async (parentPageId: string) => {
      try {
        // Use mock data in Storybook environment
        if (isStorybook) {
          console.log("Adding new sub post in Storybook environment");
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

          // Expand the parent page
          setExpandedPages((prev) => new Set(prev).add(parentPageId));

          return; // Return void to match the expected type
        }

        const newSubPostId = await addNewSubPostHook(parentPageId);
        console.log("Created new sub post with ID:", newSubPostId);

        // Expand the parent page
        setExpandedPages((prev) => new Set(prev).add(parentPageId));

        return; // Return void to match the expected type
      } catch (error) {
        console.error("Failed to create new sub post:", error);
        throw error;
      }
    },
    [addNewSubPostHook, isStorybook]
  );

  const handleDeletePost = useCallback(async () => {
    if (!activePostId) return;

    // Use mock data in Storybook environment
    if (isStorybook) {
      console.log("Deleting post in Storybook environment");
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

      // Set a new active post
      const remainingPosts = localPosts.filter((p) => p.id !== activePostId);
      if (remainingPosts.length > 0) {
        setActivePostId(remainingPosts[0].id);
      }

      setShowDeleteDropdown(false);
      return;
    }

    try {
      await deletePost(activePostId);
      console.log("Deleted post with ID:", activePostId);

      // Remove from local state
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

      // Set a new active post
      const remainingPosts = localPosts.filter((p) => p.id !== activePostId);
      if (remainingPosts.length > 0) {
        setActivePostId(remainingPosts[0].id);
      }

      setShowDeleteDropdown(false);
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  }, [activePostId, deletePost, localPosts, isStorybook]);

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

  // Add a simple save function in Storybook environment
  const handleManualSave = useCallback(async () => {
    if (isStorybook) {
      console.log("Manual save triggered in Storybook environment");
      // In Storybook, we just simulate the save operation
      setIsSaving(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsSaving(false);
      return;
    }

    // Save all unsaved changes
    await saveAllUnsavedChanges();
  }, [saveAllUnsavedChanges, isStorybook]);

  // Icon selector functions
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

  // Find active post
  const activePost = findPostById(localPosts, activePostId);

  if (isLoading && !isStorybook) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your blog posts...</p>
        </div>
      </div>
    );
  }

  if (error && !isStorybook) {
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
      {/* Sidebar */}
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

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-200 ${sidebarCollapsed ? "ml-0" : "ml-64"}`}
      >
        {/* Add a spacer to push content below the fixed header */}
        <div className="h-16"></div>
        {activePost && (
          <>
            {/* Move IconSelector and CoverOptions here to show above the title */}
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

            <DeleteDropdown
              dropdownRef={dropdownRef}
              handleDeletePost={handleDeletePost}
            />
          </>
        )}

        {/* Chatbot Panel */}
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
