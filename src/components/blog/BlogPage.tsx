"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { PartialBlock } from "@blocknote/core";
import Sidebar from "../Sidebar";
import { useBlogData } from "@/hooks/use-blog-data";
import { useBlogStore } from "@/lib/stores/blog-store";
import { supabase } from "@/lib/supabase/supabase-client";
import BlogHeader from "./BlogHeader";
import BlogContent from "./BlogContent";
import BlogCover from "./BlogCover";
import BlogSkeleton from "./BlogSkeleton";
import IconSelector from "./IconSelector";
import { CoverPicker } from "./CoverPicker";
import CoverOptions from "./CoverOptions";
import ChatbotPanel from "./ChatbotPanel";
import { useSession } from "next-auth/react";

interface PageModification {
  type: string;
  target?: string;
  content?: string;
  title?: string;
  position?: number;
  paragraphIndex?: number;
}

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

  // Use store directly to get latest data - subscribe to entire store to ensure nested updates are detected
  const blogStore = useBlogStore();
  const storePosts = blogStore.posts;

  // Still use useBlogData to get helper functions
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
    fetchPosts: () => Promise.resolve(),
    userId: "storybook-user",
    setUserId: () => { },
  };

  // Use mock data in Storybook, otherwise use real hook
  // Use store posts to ensure real-time updates
  const blogData = isStorybook ? mockBlogData : {
    ...realBlogData,
    posts: storePosts, // Use store posts directly (subscribed via selector)
  };

  const {
    posts,
    isLoading,
    error,
    addNewPost,
    addNewSubPost: addNewSubPostHook,
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
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const unsavedChanges = useRef<Map<string, Post>>(new Map());
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCreatingPost = useRef<boolean>(false);

  const createNewPost = useCallback(async () => {
    try {
      console.log("Creating new post");
      isCreatingPost.current = true;

      // Optimistic update: create temporary post and add to UI first
      const tempPostId = crypto.randomUUID();
      const tempPost: Post = {
        id: tempPostId,
        title: `Post ${localPosts.length + 1}`,
        content: [],
        icon: undefined,
        cover: undefined,
        parent_id: null,
        children: [],
      };

      // Add to localPosts immediately
      setLocalPosts(prev => [...prev, tempPost]);
      setActivePostId(tempPostId);

      // Create real post in background
      const newPostId = await addNewPost();
      console.log("Created new post with ID:", newPostId);

      // Replace temporary ID with real ID
      setLocalPosts(prev => prev.map(p =>
        p.id === tempPostId ? { ...p, id: newPostId } : p
      ));
      setActivePostId(newPostId);

      isCreatingPost.current = false;
      return newPostId;
    } catch (error) {
      console.error("Failed to create new post:", error);
      isCreatingPost.current = false;
      // If failed, remove temporary post
      setLocalPosts(prev => prev.filter(p => p.id.length === 36)); // Keep only valid UUIDs
      throw error;
    }
  }, [addNewPost, localPosts.length]);

  // Get NextAuth session to get real user ID
  const { data: session, status: sessionStatus } = useSession();
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  // Check for admin session first
  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        const response = await fetch('/api/admin/verify', {
          credentials: 'include'
        });
        
        if (response.ok) {
          console.log("✅ Admin session detected, using admin-user-id");
          setUserId('admin-user-id');
          setIsCheckingAdmin(false);
          return;
        }
      } catch (error) {
        console.log("No admin session found");
      }
      setIsCheckingAdmin(false);
    };

    checkAdminSession();
  }, [setUserId]);

  useEffect(() => {
    // Skip if still checking admin session
    if (isCheckingAdmin) return;

    console.log("Session status:", sessionStatus);
    console.log("Session data:", session);
    console.log("Current userId:", userId);

    // Use NextAuth session user ID if available and not admin
    if (session?.user?.id && userId !== session.user.id && userId !== 'admin-user-id') {
      console.log("✅ Setting userId from NextAuth session:", session.user.id);
      setUserId(session.user.id);
    } else if (userId === "00000000-0000-0000-0000-000000000000") {
      console.warn("⚠️ No valid user ID available. User may need to log in.");
      console.warn("Session status:", sessionStatus);
    } else {
      console.log("✅ Using existing userId:", userId);
    }
  }, [session, userId, setUserId, sessionStatus, isCheckingAdmin]);

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

      try {
        console.log(`Saving post ${post.id} via API`);

        const response = await fetch('/api/blog/posts', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: post.id,
            title: post.title,
            content: post.content,
            icon: post.icon,
            cover: post.cover,
            parent_id: post.parent_id ?? null,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error(`Failed to save post ${post.id}:`, errorData.error);
          throw new Error(errorData.error || 'Failed to save post');
        }

        console.log(`Successfully saved post ${post.id} to database`);
        unsavedChanges.current.delete(post.id);
      } catch (error) {
        console.error(`Error saving post ${post.id}:`, error);
        throw error;
      }
    },
    [isStorybook]
  );

  const handleSetActivePostId = useCallback(
    async (postId: string) => {
      console.log("🔄 Switching to post:", postId);
      console.log("Current activePostId:", activePostId);

      const currentPost = unsavedChanges.current.get(activePostId);
      if (currentPost) {
        console.log("💾 Saving current post before switching");
        await savePostToDatabase(currentPost);
      }

      console.log("✅ Setting new activePostId:", postId);
      setActivePostId(postId);

      const newExpanded = new Set(expandedPages);
      const post = findPostById(localPosts, postId);

      console.log("📄 Found post:", post ? post.title : "null");

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
    console.log("📊 Posts sync effect:", {
      postsFromStore: posts?.length || 0,
      localPostsCount: localPosts.length,
      userId,
      isLoading,
      isCreating: isCreatingPost.current,
      postsIds: posts?.map(p => p.id.substring(0, 8)),
      localPostsIds: localPosts.map(p => p.id.substring(0, 8)),
    });

    // Skip sync if creating post
    if (isCreatingPost.current) {
      console.log("⏸️ Skipping sync while creating post");
      return;
    }

    // Sync when:
    // 1. localPosts is empty (initial load)
    // 2. posts count different from localPosts (create/delete)
    if (posts && !isLoading) {
      const postsLength = posts.length;
      const needsSync = localPosts.length === 0 ||
        postsLength !== localPosts.length;

      console.log("Sync check:", { needsSync, postsLength, localPostsLength: localPosts.length });

      if (needsSync) {
        console.log("🔄 Converting and setting posts from store:", postsLength);

        // Convert BlogPost[] to Post[] with proper type handling
        const convertedPosts: Post[] = posts.map((post) => ({
          ...post,
          content: (post.content as PartialBlock[]) || [],
          icon: post.icon ?? undefined,
          children: post.children ? mapPosts(post.children as unknown as Post[]) : [],
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
        console.log("✅ Mapped posts:", mapped.length);
        setLocalPosts(mapped);

        if (mapped.length > 0) {
          const currentPostExists = findPostById(mapped, activePostId);
          if (!currentPostExists) {
            const defaultPost = findFirstAvailablePost(mapped);
            if (defaultPost) {
              // Only update if the current activePostId is not the default post's ID
              if (activePostId !== defaultPost.id) {
                console.log("📌 Setting active post to:", defaultPost.id);
                setActivePostId(defaultPost.id);
              }
            }
          }
        }
      } else {
        console.log("ℹ️ Posts count matches, skipping sync");
      }
    }
  }, [
    posts,
    activePostId,
    findPostById,
    findFirstAvailablePost,
    mapPosts,
    localPosts,
    isStorybook,
    userId,
    isLoading,
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
      const activePost = findPostById(localPosts, activePostId);
      console.log("Active post cover:", activePost?.cover);
    }
  }, [localPosts, activePostId, findPostById]);

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

      // Save all posts via API
      for (const post of unsaved) {
        try {
          console.log(`💾 Saving post ${post.id}:`, {
            title: post.title,
            user_id: userId,
            content_length: post.content?.length || 0,
            parent_id: post.parent_id,
            has_children: post.children && post.children.length > 0,
          });

          const response = await fetch('/api/blog/posts', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: post.id,
              title: post.title,
              content: post.content,
              icon: post.icon,
              cover: post.cover,
              parent_id: post.parent_id ?? null,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error(`❌ Failed to save post ${post.id}:`, errorData.error);
            throw new Error(errorData.error || 'Failed to save post');
          }

          const result = await response.json();
          console.log(`✅ Successfully saved post ${post.id} to database:`, {
            title: result.data?.title,
            parent_id: result.data?.parent_id,
          });

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

  const triggerAutoSave = useCallback(() => {
    if (!isStorybook) {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set status to saving immediately for better UX
      setSaveStatus('saving');

      // Debounce save for 1 second (faster than before)
      autoSaveTimeoutRef.current = setTimeout(async () => {
        try {
          console.log('Auto-saving changes...');
          await saveAllUnsavedChanges();
          setSaveStatus('saved');
          console.log('Auto-save completed');

          // Reset to neutral state after 2 seconds
          setTimeout(() => {
            setSaveStatus('saved');
          }, 2000);
        } catch (error) {
          console.error('Auto-save failed:', error);
          setSaveStatus('error');

          // Reset error state after 5 seconds
          setTimeout(() => {
            setSaveStatus('saved');
          }, 5000);
        }
      }, 1000); // Reduced from 2000ms to 1000ms for faster saves
    }
  }, [isStorybook, saveAllUnsavedChanges]);

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

      triggerAutoSave();
    },
    [activePostId, findPostById, triggerAutoSave]
  );

  const updateLocalPostTitle = useCallback(
    async (postId: string, newTitle: string) => {
      setLocalPosts((prev) => {
        const updatePostRecursively = (posts: Post[]): Post[] => {
          return posts.map((p) => {
            if (p.id === postId) {
              const updatedPost = { ...p, title: newTitle };
              const newUnsavedChanges = new Map(unsavedChanges.current);
              newUnsavedChanges.set(postId, updatedPost);
              unsavedChanges.current = newUnsavedChanges;
              return updatedPost;
            }
            if (p.children && p.children.length > 0) {
              return { ...p, children: updatePostRecursively(p.children) };
            }
            return p;
          });
        };
        return updatePostRecursively(prev);
      });

      // Trigger auto-save for title changes
      triggerAutoSave();
    },
    [triggerAutoSave]
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

  const handleCoverSelect = useCallback(async (cover: { type: "color" | "image"; value: string }) => {
    if (!activePostId) return;

    console.log("🎨 Setting cover:", { activePostId, cover });

    try {
      // Update local state immediately for instant feedback
      setLocalPosts((prev) => {
        const updatePostRecursively = (posts: Post[]): Post[] => {
          return posts.map((post) => {
            if (post.id === activePostId) {
              console.log("✅ Found post to update:", post.id);
              return { ...post, cover };
            }
            if (post.children && post.children.length > 0) {
              return { ...post, children: updatePostRecursively(post.children) };
            }
            return post;
          });
        };
        return updatePostRecursively(prev);
      });

      // Then save to database
      await setPostCover(activePostId, cover);
      console.log("💾 Cover saved to database");
    } catch (error) {
      console.error("Failed to set cover:", error);
    }
  }, [activePostId, setPostCover]);

  const handleCoverRemove = useCallback(async () => {
    if (!activePostId) return;

    try {
      await removePostCover(activePostId);
      setLocalPosts((prev) =>
        prev.map((post) =>
          post.id === activePostId ? { ...post, cover: undefined } : post
        )
      );
    } catch (error) {
      console.error("Failed to remove cover:", error);
    }
  }, [activePostId, removePostCover]);

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

  const handlePageModification = useCallback(
    async (mod: PageModification): Promise<string> => {
      // Extract instruction from PageModification object
      const instruction = typeof mod === 'string' ? mod : mod.content || mod.title || '';
      try {
        const currentPost = findPostById(localPosts, activePostId);
        if (!currentPost) {
          return "❌ Error: No active post found";
        }

        console.log("Requesting AI modification for post:", activePostId);
        console.log("Instruction:", instruction);
        console.log("Current content blocks:", currentPost.content?.length || 0);

        // Validate instruction
        if (!instruction || instruction.trim().length < 5) {
          return "⚠️ Please provide a more detailed instruction (at least 5 characters).";
        }

        // Call AI modification API with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        try {
          console.log("Sending request to /api/blog/ai-modify");
          console.log("Request body:", {
            postId: activePostId,
            currentContent: currentPost.content || [],
            currentTitle: currentPost.title || 'Untitled',
            instruction: instruction.trim(),
          });

          const response = await fetch('/api/blog/ai-modify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              postId: activePostId,
              currentContent: currentPost.content || [],
              currentTitle: currentPost.title || 'Untitled',
              instruction: instruction.trim(),
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          console.log("Response status:", response.status);
          console.log("Response headers:", response.headers);

          // 检查响应类型
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error("Non-JSON response:", text);
            throw new Error(`Expected JSON but got ${contentType}. Response: ${text.substring(0, 200)}`);
          }

          const data = await response.json();
          console.log("AI response data:", data);

          if (!response.ok) {
            const errorMsg = data.error || 'Failed to get AI modifications';
            const details = data.details || '';
            return `❌ Error: ${errorMsg}${details ? '\n' + details : ''}\n\nTips:\n- Try a simpler request\n- Check your API quota\n- Wait a moment and try again`;
          }

          // Check if modifications were generated
          if (!data.modifications || data.modifications.length === 0) {
            const message = data.message || 'No modifications were generated.';
            return `⚠️ ${message}\n\nSuggestions:\n- Be more specific (e.g., "Add a paragraph about...")\n- Try shorter instructions\n- Simplify your request\n- Make sure the article has some content`;
          }

          // Apply modifications
          console.log("Applying modifications:", data.modifications);
          let appliedCount = 0;

          for (const mod of data.modifications) {
            try {
              await applyModification(mod, data.explanation);
              appliedCount++;
            } catch (modError) {
              console.error("Failed to apply modification:", modError);
            }
          }

          if (appliedCount === 0) {
            return "⚠️ Modifications were generated but failed to apply. Please try again.";
          }

          // Show success message with option to view history
          return `✅ Successfully applied ${appliedCount} modification(s)!\n\n${data.explanation || ''}\n\n💡 AI-modified content is highlighted in yellow.`;
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            return "⏱️ Request timed out. The AI is taking too long to respond.\n\nTry:\n- Simplifying your request\n- Breaking it into smaller parts\n- Waiting a moment and trying again";
          }
          throw fetchError;
        }
      } catch (error) {
        console.error("Error applying AI modification:", error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        return `❌ Error: ${errorMsg}\n\nPlease try again with a simpler request.`;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activePostId, localPosts, findPostById]
  );

  // Track AI modifications for highlighting
  const [aiModifications, setAiModifications] = useState<{
    timestamp: number;
    type: string;
    blockIds: string[];
    explanation?: string;
  }[]>([]);
  const [showAIHistory, setShowAIHistory] = useState(false);

  // Note: AI-modified content will keep yellow background permanently
  // Only new AI modifications will clear old highlights

  const applyModification = useCallback(
    async (mod: PageModification, explanation?: string) => {
      const currentPost = findPostById(localPosts, activePostId);
      if (!currentPost) return;

      const timestamp = Date.now();
      const newBlockIds: string[] = [];

      // First, remove highlighting from all previous AI modifications
      const removeOldHighlights = (blocks: PartialBlock[]) => {
        return blocks.map(block => {
          const props = block.props as Record<string, unknown>;
          // Check for both data-ai-modified AND backgroundColor: 'yellow'
          // (backgroundColor might persist from database even if data-ai-modified is lost)
          if (props?.['data-ai-modified'] || props?.backgroundColor === 'yellow') {
            console.log('⚪ Removing old highlight from block:', {
              blockId: props['data-block-id'],
              hadBackgroundColor: props.backgroundColor,
              hadAIModified: props['data-ai-modified'],
            });
            // Remove AI highlighting from old modifications
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { 'data-ai-modified': _aiModified, 'data-block-id': _blockId, backgroundColor: _backgroundColor, ...restProps } = props;
            return {
              ...block,
              props: restProps,
            };
          }
          return block;
        });
      };

      // Helper to convert string content to PartialBlock array
      const stringToBlocks = (content: string): PartialBlock[] => {
        // Split content by lines and create paragraph blocks
        const lines = content.split('\n').filter(line => line.trim());
        return lines.map(line => ({
          type: 'paragraph',
          content: [{ type: 'text', text: line, styles: {} }],
          props: {}
        } as PartialBlock));
      };

      // Helper to mark blocks as AI-modified (only for new modifications)
      const markBlocksAsAIModified = (blocks: PartialBlock[]): PartialBlock[] => {
        return blocks.map(block => {
          const blockId = `ai-${timestamp}-${Math.random().toString(36).substring(2, 11)}`;
          newBlockIds.push(blockId);
          console.log('🟡 Marking block as AI-modified:', {
            blockId,
            backgroundColor: 'yellow',
            timestamp,
          });
          return {
            ...block,
            props: {
              ...block.props,
              backgroundColor: 'yellow', // 黄色高亮 AI 新添加的内容
              'data-ai-modified': timestamp,
              'data-block-id': blockId,
            }
          } as unknown as PartialBlock;
        });
      };

      switch (mod.type) {
        case 'replace':
          // Replace entire content
          if (mod.content) {
            const blocks = stringToBlocks(mod.content);
            const markedContent = markBlocksAsAIModified(blocks);
            updateLocalPostContent(markedContent);
          }
          break;

        case 'insert':
          // Insert content at specific position
          if (mod.content && typeof mod.position === 'number') {
            // Remove old highlights first
            const cleanedContent = removeOldHighlights(currentPost.content);
            const blocks = stringToBlocks(mod.content);
            const markedContent = markBlocksAsAIModified(blocks);
            cleanedContent.splice(mod.position, 0, ...markedContent);
            updateLocalPostContent(cleanedContent);
          }
          break;

        case 'append':
          // Append content to the end
          if (mod.content) {
            console.log('📝 Before removing old highlights, content blocks:', currentPost.content.length);
            console.log('📝 Blocks with AI highlights:', currentPost.content.filter(b => {
              const props = b.props as Record<string, unknown>;
              return props?.['data-ai-modified'];
            }).length);

            // Remove old highlights first
            const cleanedContent = removeOldHighlights(currentPost.content);

            console.log('✨ After removing old highlights, content blocks:', cleanedContent.length);
            console.log('✨ Blocks with AI highlights:', cleanedContent.filter(b => {
              const props = b.props as Record<string, unknown>;
              return props?.['data-ai-modified'];
            }).length);

            const blocks = stringToBlocks(mod.content);
            const markedContent = markBlocksAsAIModified(blocks);
            const newContent = [...cleanedContent, ...markedContent];

            console.log('🎯 Final content blocks:', newContent.length);
            console.log('🎯 Blocks with AI highlights:', newContent.filter(b => {
              const props = b.props as Record<string, unknown>;
              return props?.['data-ai-modified'];
            }).length);

            updateLocalPostContent(newContent);
          }
          break;

        case 'update_title':
          // Update post title
          if (mod.title) {
            await updateLocalPostTitle(activePostId, mod.title);
          }
          break;

        case 'add_section':
          // Add a new section (heading + content)
          if (mod.content) {
            // Remove old highlights first
            const cleanedContent = removeOldHighlights(currentPost.content);
            const blocks = stringToBlocks(mod.content);
            const markedContent = markBlocksAsAIModified(blocks);
            const newContent = [...cleanedContent, ...markedContent];
            updateLocalPostContent(newContent);
          }
          break;

        case 'delete':
          // Delete a specific paragraph
          if (typeof mod.paragraphIndex === 'number') {
            const cleanedContent = removeOldHighlights(currentPost.content);
            if (mod.paragraphIndex >= 0 && mod.paragraphIndex < cleanedContent.length) {
              cleanedContent.splice(mod.paragraphIndex, 1);
              updateLocalPostContent(cleanedContent);
              console.log('🗑️ Deleted paragraph at index:', mod.paragraphIndex);
            } else {
              console.warn('Invalid paragraph index:', mod.paragraphIndex);
            }
          }
          break;

        case 'replace_paragraph':
          // Replace a specific paragraph
          if (typeof mod.paragraphIndex === 'number' && mod.content) {
            const cleanedContent = removeOldHighlights(currentPost.content);
            if (mod.paragraphIndex >= 0 && mod.paragraphIndex < cleanedContent.length) {
              const blocks = stringToBlocks(mod.content);
              const markedContent = markBlocksAsAIModified(blocks);
              cleanedContent.splice(mod.paragraphIndex, 1, ...markedContent);
              updateLocalPostContent(cleanedContent);
              console.log('✏️ Replaced paragraph at index:', mod.paragraphIndex);
            } else {
              console.warn('Invalid paragraph index:', mod.paragraphIndex);
            }
          }
          break;

        default:
          console.warn('Unknown modification type:', mod.type);
      }

      // Track this modification (replace old history with new one)
      if (newBlockIds.length > 0) {
        // Keep the new modification in history (no auto-removal)
        setAiModifications([{
          timestamp,
          type: mod.type,
          blockIds: newBlockIds,
          explanation: explanation || `AI ${mod.type} modification`,
        }]);
      }
    },
    [activePostId, localPosts, findPostById, updateLocalPostContent, updateLocalPostTitle]
  );

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
      // 移动端：< 768px（包括手机和小平板）
      // 桌面端：>= 768px（iPad 横屏、笔记本、台式机）
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Auto-save on page unload (like Copilot Pages)
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (unsavedChanges.current.size > 0) {
        // Show warning if there are unsaved changes
        e.preventDefault();
        e.returnValue = '';

        // Try to save before leaving
        try {
          await saveAllUnsavedChanges();
        } catch (error) {
          console.error('Failed to save before unload:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveAllUnsavedChanges]);

  // Auto-save when switching posts
  useEffect(() => {
    return () => {
      // Save current post when component unmounts or activePostId changes
      if (unsavedChanges.current.size > 0) {
        saveAllUnsavedChanges().catch(error => {
          console.error('Failed to save on unmount:', error);
        });
      }
    };
  }, [activePostId, saveAllUnsavedChanges]);

  // Add a simple save function in Storybook environment
  const handleManualSave = useCallback(async () => {
    if (isStorybook) {
      console.log("Manual save triggered in Storybook environment");
      setIsSaving(true);
      setSaveStatus('saving');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsSaving(false);
      setSaveStatus('saved');
      return;
    }

    try {
      setIsSaving(true);
      setSaveStatus('saving');
      await saveAllUnsavedChanges();
      setSaveStatus('saved');
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
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

  const handleCoverFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityType", "blog_cover");
      formData.append("entityId", activePostId);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json();
      setPostCover(activePostId, {
        type: "image",
        value: data.publicUrl,
      });
    } catch (error) {
      console.error("Cover upload failed:", error);
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
    return <BlogSkeleton />;
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
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden w-full">
      {/* Sidebar Toggle Button - Shows when sidebar is collapsed or on mobile */}
      {(sidebarCollapsed || isMobile) && !sidebarOpen && (
        <button
          onClick={() => {
            setSidebarCollapsed(false);
            setSidebarOpen(true);
          }}
          className="fixed left-4 top-20 z-30 bg-white p-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors border border-gray-200"
          title="Show Articles"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      )}

      {/* Sidebar - Hidden on mobile and tablet when chatbot is open, visible on desktop */}
      <div
        className={`${sidebarCollapsed ? "w-0 overflow-hidden" : "w-64"
          } flex-shrink-0 transition-all duration-300 ${isChatbotVisible && !isMobile ? "hidden lg:block" : "hidden md:block"
          }`}
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
          onCollapse={() => {
            setSidebarCollapsed(true);
            setSidebarOpen(false);
          }}
          className="fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-40"
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && !sidebarCollapsed && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => {
            setSidebarOpen(false);
            setSidebarCollapsed(true);
          }}
        >
          <div
            className="w-64 h-full bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar
              title="Blog"
              icon="📘"
              pages={localPosts}
              activePageId={activePostId}
              onAddPage={createNewPost}
              onAddSubPage={addNewSubPost}
              onUpdatePageTitle={updateLocalPostTitle}
              onSelectPage={(postId) => {
                handleSetActivePostId(postId);
                // 移动端选择文章后自动关闭侧边栏
                if (isMobile) {
                  setSidebarOpen(false);
                  setSidebarCollapsed(true);
                }
              }}
              sidebarOpen={sidebarOpen}
              expandedPages={expandedPages}
              onToggleExpand={togglePageExpansion}
              onCollapse={() => {
                setSidebarCollapsed(true);
                setSidebarOpen(false);
              }}
              className="h-full"
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col h-screen transition-all duration-300 overflow-x-hidden ${isMobile
          ? "ml-0 w-full"  // 移动端：无左边距，全宽
          : sidebarCollapsed
            ? "ml-0"  // 侧边栏折叠：无左边距
            : isChatbotVisible
              ? "ml-0 lg:ml-64"  // Chatbot 打开：只在大屏显示侧边栏
              : "ml-0 md:ml-64"  // 正常：中屏以上显示侧边栏
          }`}
        style={{
          marginRight: isChatbotVisible && !isMobile ? `${chatbotWidth}px` : '0',
        }}
      >
        {/* Fixed Header Spacer */}
        <div className="h-16 flex-shrink-0"></div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto">
          {activePost && (
            <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                saveStatus={saveStatus}
              />

              {/* AI Modification History Panel */}
              {aiModifications.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <svg
                        className="h-5 w-5 text-yellow-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      <span className="text-sm font-medium text-yellow-800">
                        AI Modified Content
                      </span>
                    </div>
                    <button
                      onClick={() => setShowAIHistory(!showAIHistory)}
                      className="text-xs text-yellow-700 hover:text-yellow-900 underline"
                    >
                      {showAIHistory ? 'Hide' : 'Show'} History ({aiModifications.length})
                    </button>
                  </div>

                  {showAIHistory && (
                    <div className="mt-2 space-y-2">
                      {aiModifications.map((mod) => (
                        <div
                          key={mod.timestamp}
                          className="text-xs bg-white p-2 rounded border border-yellow-100"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-700">
                              {mod.type.toUpperCase()}
                            </span>
                            <span className="text-gray-500">
                              {new Date(mod.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          {mod.explanation && (
                            <p className="mt-1 text-gray-600">{mod.explanation}</p>
                          )}
                          <p className="mt-1 text-gray-500">
                            {mod.blockIds.length} block(s) modified
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="mt-2 text-xs text-yellow-700">
                    💡 Modified content is highlighted in yellow. New AI modifications will clear old highlights.
                  </p>
                </div>
              )}

              <BlogCover
                key={`cover-${activePostId}-${activePost?.cover ? 'has' : 'no'}`}
                activePost={activePost}
                showCoverActions={showCoverActions}
                setShowCoverActions={setShowCoverActions}
                setShowCoverOptions={setShowCoverPicker}
                removePostCover={handleCoverRemove}
                activePostId={activePostId}
              />

              <BlogContent
                activePost={activePost}
                activePostId={activePostId}
                updatePostTitle={updateLocalPostTitle}
                updatePostContent={updateLocalPostContent}
                Editor={Editor}
                isSaving={isSaving}
                handleManualSave={handleManualSave}
              />

              {/* Cover Picker Modal */}
              {showCoverPicker && (
                <CoverPicker
                  currentCover={activePost.cover}
                  onSelect={handleCoverSelect}
                  onRemove={handleCoverRemove}
                  onClose={() => setShowCoverPicker(false)}
                />
              )}
            </div>
          )}
        </div>

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
          postId={activePostId}
          userId={userId}
          articleContext={activePost ? {
            title: activePost.title || 'Untitled',
            content: activePost.content ? activePost.content.map(block => {
              if (typeof block.content === 'string') return block.content;
              if (Array.isArray(block.content)) {
                return block.content.map(item => {
                  if (typeof item === 'string') return item;
                  if (typeof item === 'object' && 'text' in item) return item.text;
                  return '';
                }).join('');
              }
              return '';
            }).filter(text => text.trim()).join('\n\n') : '',
            icon: activePost.icon,
            coverType: activePost.cover?.type,
            coverValue: activePost.cover?.value,
          } : undefined}
        />
      </div>
    </div>
  );
}
