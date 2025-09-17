"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { PartialBlock } from "@blocknote/core";
import {
  FaPlus as Plus,
  FaImage as ImageIcon,
  FaTrashAlt as Trash2,
  FaBars as Menu,
  FaEllipsisH as MoreHorizontal,
  FaBook as Book,
  FaTimes as X,
  FaComments as MessageCircle,
} from "react-icons/fa";
import Sidebar from "./Sidebar";
import UnifiedChatbot from "./UnifiedChatbot";
import { useBlogData } from "@/hooks/use-blog-data";
import { supabase } from "@/lib/supabase/supabase-client";
import { getTaskySupabaseConfig } from "@/lib/environment";

const Editor = dynamic(() => import("./Editor"), {
  ssr: false,
  loading: () => <div className="p-4 text-gray-500">Loading editor...</div>,
});

const DEFAULT_POST_ID = "11111111-1111-4111-8111-111111111111";

interface PostCover {
  type: "color" | "image";
  value: string;
}

interface BlogPost {
  id: string;
  title: string;
  content: PartialBlock[] | null;
  icon?: string;
  cover?: PostCover;
  parent_id?: string | null;
  children?: BlogPost[];
  [key: string]: unknown;
}

export interface Post {
  id: string;
  title: string;
  content: PartialBlock[];
  icon?: string;
  cover?: PostCover;
  parent_id?: string | null;
  children?: Post[];
  [key: string]: unknown;
}

export default function Blog() {
  const {
    posts,
    isLoading,
    error,
    addNewPost,
    addNewSubPost: addNewSubPostHook,
    updatePostTitle,
    updatePostContent: updatePostContentHook,
    setPostIcon,
    removePostIcon,
    setPostCover,
    removePostCover,
    deletePost,
    userId,
    setUserId,
  } = useBlogData();

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
      const newUserId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
          const r = (Math.random() * 16) | 0,
            v = c == "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        }
      );
      setUserId(newUserId);
      console.log("Generated new userId:", newUserId);
    } else {
      console.log("Using existing userId:", userId);
    }
  }, [userId, setUserId]);

  // Sync local UI state with data fetched by useBlogData
  const mapPosts = useCallback((posts: BlogPost[]): Post[] => {
    return posts.map((p) => ({
      ...p,
      content: (p.content as PartialBlock[]) || [],
      children: p.children ? mapPosts(p.children) : [],
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
      if (!supabase || supabase === null) {
        console.warn(
          "Supabase client not configured. Skipping save operation."
        );
        console.warn("Current Supabase config:", getTaskySupabaseConfig());
        unsavedChanges.current.delete(post.id);
        return;
      }

      setIsSaving(true);
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
      } finally {
        setIsSaving(false);
      }
    },
    [userId]
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (posts) {
      const mapped = mapPosts(posts);
      setLocalPosts(mapped);

      if (mapped.length > 0) {
        const currentPostExists = findPostById(mapped, activePostId);
        if (!currentPostExists) {
          const defaultPost = findFirstAvailablePost(mapped);
          if (defaultPost) {
            setActivePostId(defaultPost.id);
          }
        }
      } else {
        // Create a new post if none exist
        console.log("No posts found, creating new post");
        createNewPost().catch((error) => {
          console.error("Failed to create new post:", error);
        });
      }
    }
  }, [
    posts,
    activePostId,
    findPostById,
    findFirstAvailablePost,
    createNewPost,
    mapPosts,
  ]);

  useEffect(() => {
    if (userId && userId !== "00000000-0000-0000-0000-000000000000") {
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

  useEffect(() => {
    const config = getTaskySupabaseConfig();
    if (!config.url || !config.anonKey) {
      console.warn("Supabase configuration missing or incomplete");
      console.warn("URL present:", !!config.url);
      console.warn("Anon key present:", !!config.anonKey);
    }

    console.warn("Supabase client initialized:", !!supabase);
  }, []);

  const saveCurrentPostBeforeNavigation = useCallback(async () => {
    const currentPost = unsavedChanges.current.get(activePostId);
    if (currentPost) {
      await savePostToDatabase(currentPost);
    }
  }, [activePostId, savePostToDatabase]);

  const addNewSubPost = useCallback(
    async (parentId: string) => {
      try {
        // Wait for the hook to complete and get the new post ID
        await addNewSubPostHook(parentId);

        // Expand the parent page to show the new subpage
        setExpandedPages((prev) => {
          const newExpanded = new Set(prev);
          newExpanded.add(parentId);
          return newExpanded;
        });
      } catch (error) {
        console.error("Error adding new sub post:", error);
      }
    },
    [addNewSubPostHook]
  );

  // Utility: recursive flatten posts for saving
  interface FlattenedPost {
    id: string;
    title: string;
    content: PartialBlock[];
    icon?: string;
    cover?: PostCover;
    parent_id: string | null;
    user_id?: string;
    [key: string]: unknown;
  }

  const flattenPostsArr = useCallback(
    (postsArr: Post[], parent_id: string | null = null): FlattenedPost[] => {
      let all: FlattenedPost[] = [];
      for (const p of postsArr) {
        const { children, ...rest } = p;
        all.push({ ...rest, parent_id, children: undefined } as FlattenedPost);
        if (Array.isArray(children) && children.length > 0) {
          all = all.concat(flattenPostsArr(children, p.id));
        }
      }
      return all;
    },
    []
  );

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (localPosts.length > 0) {
        navigator.sendBeacon(
          "/api/blog/save",
          JSON.stringify({
            posts: flattenPostsArr(localPosts),
            userId: userId,
          })
        );
        e.preventDefault();
        e.returnValue = "";
        return "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (localPosts.length > 0) {
        Promise.resolve().then(() => {
          fetch("/api/blog/save", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              posts: flattenPostsArr(localPosts),
              userId: userId,
            }),
          }).catch((error) => {
            console.error("Error saving posts on unload:", error);
          });
        });
      }
    };
  }, [localPosts, userId, flattenPostsArr]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveCurrentPostBeforeNavigation();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [saveCurrentPostBeforeNavigation]);

  useEffect(() => {
    const handleBlur = () => {
      saveCurrentPostBeforeNavigation();
    };

    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("blur", handleBlur);
    };
  }, [saveCurrentPostBeforeNavigation]);

  useEffect(() => {
    const handleRouteChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (
        customEvent.detail &&
        customEvent.detail.pathname &&
        customEvent.detail.pathname !== "/blog"
      ) {
        saveCurrentPostBeforeNavigation();
      }
    };

    window.addEventListener("routeChange", handleRouteChange);
    return () => {
      window.removeEventListener("routeChange", handleRouteChange);
    };
  }, [saveCurrentPostBeforeNavigation]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDeleteDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDeletePost = async () => {
    console.log("Attempting to delete post with ID:", activePostId);
    console.log("Current localPosts count:", localPosts.length);

    if (!activePostId) {
      console.error("No activePostId provided for deletion");
      return;
    }

    // Use flexible UUID validation to support various test data formats
    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(activePostId)) {
      console.error("Invalid UUID for post id:", activePostId);
      return;
    }

    try {
      console.log("Calling deletePost with ID:", activePostId);
      // Delete the post from the database
      await deletePost(activePostId);
      console.log("Successfully deleted post with ID:", activePostId);

      // Update local state - no longer need manual updates as useBlogData hook handles it
      // Wait for hook to complete before setting activePostId
      setTimeout(() => {
        // Get current remaining posts
        const currentPosts = localPosts.filter(
          (post) => post.id !== activePostId
        );
        console.log("Remaining posts after deletion:", currentPosts.length);
        console.log("Remaining posts:", currentPosts);

        // Get latest posts from useBlogData hook
        const latestPosts = posts;
        console.log("Latest posts from hook:", latestPosts.length);

        if (latestPosts.length > 0) {
          console.log(
            "Setting active post to first remaining post:",
            latestPosts[0].id
          );
          setActivePostId(latestPosts[0].id);
        } else {
          console.log("No remaining posts, creating new post");
          createNewPost().catch((error) => {
            console.error("Failed to create new post:", error);
          });
        }
      }, 100);

      console.log("Delete operation completed successfully");
    } catch (error) {
      console.error("Error deleting post:", error);
      console.error("Error details:", {
        postId: activePostId,
        errorName: (error as Error)?.name,
        errorMessage: (error as Error)?.message,
        errorStack: (error as Error)?.stack,
      });
    } finally {
      console.log("Finished delete operation");
      setShowDeleteDropdown(false);
    }
  };

  useEffect(() => {
    const newExpanded = new Set<string>(expandedPages);

    const expandParents = (pages: Post[]): boolean => {
      for (const post of pages) {
        if (post.id === activePostId) {
          return true;
        }

        if (post.children) {
          if (expandParents(post.children)) {
            newExpanded.add(post.id);
            return true;
          }
        }
      }
      return false;
    };

    const activePost = findPostById(localPosts, activePostId) || localPosts[0];
    if (activePost && activePost.parent_id) {
      const parentPost = findPostById(localPosts, activePost.parent_id);
      if (parentPost) {
        newExpanded.add(parentPost.id);
      }
    }

    expandParents(localPosts);
    if (
      newExpanded.size !== expandedPages.size ||
      [...newExpanded].some((id) => !expandedPages.has(id)) ||
      [...expandedPages].some((id) => !newExpanded.has(id))
    ) {
      setExpandedPages(newExpanded);
    }
  }, [activePostId, localPosts, expandedPages, findPostById]);

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

  const activePost = useMemo(() => {
    const findPostRecursively = (posts: Post[]): Post | undefined => {
      for (const post of posts) {
        if (post.id === activePostId) {
          return post;
        }
        if (post.children && post.children.length > 0) {
          const found = findPostRecursively(post.children);
          if (found) return found;
        }
      }
      return undefined;
    };

    const found = findPostRecursively(localPosts);

    const result = found ||
      localPosts[0] || {
        id: DEFAULT_POST_ID,
        title: "Untitled",
        content: [],
        icon: undefined,
        cover: undefined,
        children: [],
      };

    return result;
  }, [activePostId, localPosts]);

  const updatePostContent = (newContent: PartialBlock[]) => {
    const contentCopy = JSON.parse(JSON.stringify(newContent));

    const updatePostRecursively = (posts: Post[]): Post[] => {
      return posts.map((post) => {
        if (post.id === activePostId) {
          const updatedPost = {
            ...post,
            content: contentCopy,
            updated_at: new Date().toISOString(),
          };
          unsavedChanges.current.set(post.id, updatedPost);
          debouncedSavePostToDatabase(updatedPost);
          return updatedPost;
        }
        if (post.children && post.children.length > 0) {
          const updatedChildren = updatePostRecursively(post.children);
          const hasUpdatedChild = updatedChildren.some(
            (child, index) => child !== post.children![index]
          );
          if (hasUpdatedChild) {
            const updatedPost = {
              ...post,
              children: updatedChildren,
              updated_at: new Date().toISOString(),
            };
            return updatedPost;
          }
          return { ...post, children: updatedChildren };
        }
        return post;
      });
    };

    setLocalPosts((prev) => updatePostRecursively(prev));
    updatePostContentHook(activePostId, newContent);
  };

  const handleManualSave = useCallback(async () => {
    const unsavedPosts = Array.from(unsavedChanges.current.values());
    if (unsavedPosts.length > 0) {
      for (const post of unsavedPosts) {
        await savePostToDatabase(post);
      }
      console.log(`Manually saved ${unsavedPosts.length} posts`);
    } else {
      console.log("No unsaved changes to save");
    }
  }, [savePostToDatabase]);

  const debouncedSaveMap = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const debouncedSavePostToDatabase = useCallback(
    (post: Post) => {
      const existingTimeout = debouncedSaveMap.current.get(post.id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const timeout = setTimeout(() => {
        savePostToDatabase(post);
        debouncedSaveMap.current.delete(post.id);
      }, 1500);

      debouncedSaveMap.current.set(post.id, timeout);
    },
    [savePostToDatabase]
  );

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
        const newContent = activePost
          ? [...activePost.content, newBlock]
          : [newBlock];
        await updatePostContent(newContent);
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
        const editContent = activePost
          ? [...activePost.content, editBlock]
          : [editBlock];
        await updatePostContent(editContent);
        return `Edited content in the blog post`;

      case "create_page":
        await addNewPost();
        return `Created new blog post: "${modification.title || "Untitled"}"`;

      case "set_title":
        if (!modification.title)
          return "Title is required for set title operation";
        await updatePostTitle(activePostId, modification.title);
        return `Set blog post title to: "${modification.title}"`;

      case "add_heading":
        if (!modification.content)
          return "Content is required for add heading operation";
        const headingBlock: PartialBlock = {
          type: "heading",
          content: [{ type: "text", text: modification.content, styles: {} }],
          props: { level: 1 },
        };
        const headingContent = activePost
          ? [...activePost.content, headingBlock]
          : [headingBlock];
        await updatePostContent(headingContent);
        return `Added heading: "${modification.content}"`;

      case "add_paragraph":
        if (!modification.content)
          return "Content is required for add paragraph operation";
        const paraBlock: PartialBlock = {
          type: "paragraph",
          content: [{ type: "text", text: modification.content, styles: {} }],
        };
        const paraContent = activePost
          ? [...activePost.content, paraBlock]
          : [paraBlock];
        await updatePostContent(paraContent);
        return `Added paragraph: "${modification.content}"`;

      default:
        return "Unknown modification type";
    }
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

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">Loading blog...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {!sidebarCollapsed && (
        <>
          <Sidebar
            title="Blog"
            icon="📖"
            pages={localPosts.map((p) => ({
              id: p.id,
              title: p.title,
              icon: p.icon,
              children: p.children,
            }))}
            activePageId={activePostId}
            onAddPage={addNewPost}
            onAddSubPage={addNewSubPost}
            onUpdatePageTitle={updatePostTitle}
            onSelectPage={handleSetActivePostId}
            sidebarOpen={sidebarOpen && !(isChatbotVisible && isMobile)}
            className="top-16"
            onCollapse={handleToggleSidebar}
            expandedPages={expandedPages}
            onToggleExpand={togglePageExpansion}
          />
          <div
            className="fixed h-full w-1 bg-gray-200 z-30"
            style={{
              left: "64px",
              top: "64px",
            }}
          ></div>
        </>
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
          sidebarCollapsed ? "ml-0 md:ml-12" : ""
        }`}
        style={{
          paddingTop: "64px",
          marginLeft: sidebarCollapsed ? "0" : "64px",
        }}
      >
        <div className="md:hidden p-4 border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden relative">
          <div
            className={`flex-1 transition-all duration-300`}
            style={{
              marginRight:
                isChatbotVisible && !isMobile ? `${chatbotWidth}px` : "0",
            }}
          >
            <div className="h-full overflow-y-auto chatbot-scrollbar">
              <div className="max-w-[900px] mx-auto px-6 py-8">
                <div className="w-full">
                  {activePost && activePost.cover && (
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
                        {activePost &&
                          !activePost.icon &&
                          !activePost.cover && (
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

                        {activePost && !activePost.cover && (
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

                      <div className="relative">
                        <button
                          onClick={() =>
                            setShowDeleteDropdown(!showDeleteDropdown)
                          }
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative"
                        >
                          <MoreHorizontal size={16} />
                        </button>

                        {showDeleteDropdown && (
                          <div
                            ref={dropdownRef}
                            className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-50 border border-gray-200"
                          >
                            <div className="py-1">
                              <button
                                onClick={handleDeletePost}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                              >
                                <Trash2 size={14} className="mr-2" />
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {showIconSelector && (
                      <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
                        <div className="grid grid-cols-8 gap-3">
                          {iconOptions.map((icon) => (
                            <button
                              key={icon}
                              onClick={() => {
                                setPostIcon(activePostId, icon);
                                setShowIconSelector(false);
                              }}
                              className="text-2xl p-3 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              {icon}
                            </button>
                          ))}
                          <button
                            onClick={() => {
                              removePostIcon(activePostId);
                              setShowIconSelector(false);
                            }}
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

                    <div className="flex items-center justify-center">
                      {activePost && activePost.icon && (
                        <div className="relative mr-4">
                          <span
                            className="text-3xl cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors"
                            onClick={() => setShowIconSelector(true)}
                          >
                            {activePost.icon}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 text-center">
                        <input
                          id={`title-input-${activePostId}`}
                          type="text"
                          value={activePost ? activePost.title : ""}
                          onChange={async (e) => {
                            const newTitle = e.target.value;
                            const updatePostRecursively = (
                              posts: Post[]
                            ): Post[] => {
                              return posts.map((post) => {
                                if (post.id === activePostId) {
                                  const updatedPost = {
                                    ...post,
                                    title: newTitle,
                                    updated_at: new Date().toISOString(),
                                  };
                                  unsavedChanges.current.set(
                                    post.id,
                                    updatedPost
                                  );
                                  debouncedSavePostToDatabase(updatedPost);
                                  return updatedPost;
                                }
                                if (post.children && post.children.length > 0) {
                                  const updatedChildren = updatePostRecursively(
                                    post.children
                                  );
                                  const hasUpdatedChild = updatedChildren.some(
                                    (child, index) =>
                                      child !== post.children![index]
                                  );
                                  if (hasUpdatedChild) {
                                    return {
                                      ...post,
                                      children: updatedChildren,
                                    };
                                  }
                                  return { ...post, children: updatedChildren };
                                }
                                return post;
                              });
                            };
                            setLocalPosts((prev) =>
                              updatePostRecursively(prev)
                            );
                            await updatePostTitle(activePostId, newTitle);
                          }}
                          placeholder="Untitled"
                          className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-4xl font-bold text-gray-800 placeholder-gray-400 text-center"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="min-h-[400px]">
                    <Editor
                      initialContent={
                        activePost?.content && activePost.content.length > 0
                          ? activePost.content
                          : [{ type: "paragraph", content: "" }]
                      }
                      onChange={(content) => updatePostContent(content)}
                      onSave={handleManualSave}
                      isSaving={isSaving}
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
          ></div>
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
        >
          <MessageCircle size={24} />
        </button>
      )}
    </div>
  );
}
