import { useState, useEffect, useCallback } from "react";
import { useBlogStore } from "@/lib/stores/blog-store";
import type { PartialBlock } from "@blocknote/core";

interface PostCover {
  type: "color" | "image";
  value: string;
}

export interface BlogPost {
  id: string;
  user_id: string;
  title: string;
  content: PartialBlock[];
  icon?: string;
  cover?: PostCover;
  published?: boolean;
  created_at?: string;
  updated_at?: string;
  parent_id?: string | null;
  children?: BlogPost[];
  [key: string]: unknown;
}

export const useBlogData = () => {
  const {
    posts: blogPosts,
    fetchPosts,
    createPost,
    updatePostContent,
    deletePostContent,
    userId, // Get userId from store
    setUserId, // Get setUserId from store
  } = useBlogStore();
  const [localPosts, setLocalPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Position convertPost function at the beginning to ensure it can be accessed in useEffect
  const convertPost = useCallback((post: BlogPost): BlogPost => {
    let content: PartialBlock[] = [];
    if (
      post.content &&
      typeof post.content === "object" &&
      Array.isArray(post.content)
    ) {
      content = post.content as PartialBlock[];
    } else if (post.content && typeof post.content === "string") {
      try {
        const parsed = JSON.parse(post.content);
        if (Array.isArray(parsed)) {
          content = parsed as PartialBlock[];
        } else {
          // Handle case where content is a stringified object
          content = [parsed] as PartialBlock[];
        }
      } catch {
        content = [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: post.content as string,
                styles: {},
              },
            ],
          },
        ] as PartialBlock[];
      }
    } else if (post.content === null || post.content === undefined) {
      // Handle null or undefined content
      content = [];
    }

    // Validate and convert cover object
    let cover: PostCover | undefined = undefined;
    if (post.cover && typeof post.cover === "object") {
      const coverType = post.cover.type;
      if (coverType === "color" || coverType === "image") {
        cover = {
          type: coverType,
          value: post.cover.value || "",
        };
      }
    }

    return {
      id: post.id,
      user_id: post.user_id,
      title: post.title,
      content,
      icon: post.icon || undefined,
      cover,
      published: post.published,
      created_at: post.created_at,
      updated_at: post.updated_at,
      parent_id: post.parent_id,
      children: post.children ? post.children.map(convertPost) : [],
    };
  }, []);





  useEffect(() => {
    let isMounted = true;

    const initializeBlogData = async () => {
      // Only initialize if we have a valid userId (not the default one)
      if (userId === "00000000-0000-0000-0000-000000000000") {
        return;
      }

      try {
        setIsLoading(true);
        setIsInitialized(false); // Reset initialization when userId changes
        
        // 获取用户的文章
        await fetchPosts(userId);
        
        // 如果用户没有文章，初始化默认欢迎文章
        if (isMounted && blogPosts.length === 0) {
          console.log("No posts found, initializing welcome posts...");
          try {
            const response = await fetch('/api/blog/initialize-user', {
              method: 'POST',
            });
            
            if (response.ok) {
              const result = await response.json();
              if (result.created) {
                console.log(`Created ${result.count} welcome posts`);
                // 重新获取文章
                await fetchPosts(userId);
              }
            }
          } catch (initError) {
            console.error("Failed to initialize welcome posts:", initError);
            // 继续，即使初始化失败
          }
        }
        
        if (isMounted) {
          setIsInitialized(true);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to load blog data:", err);
          setError(
            err instanceof Error ? err.message : "Failed to load blog data"
          );
          setIsInitialized(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeBlogData();

    return () => {
      isMounted = false;
    };
  }, [fetchPosts, userId]); // 只在 userId 变化时重新初始化

  useEffect(() => {
    let isMounted = true;

    if (isInitialized && localPosts.length === 0) {
      // Only set localPosts if it's empty (initial load)
      // Don't overwrite existing localPosts to preserve user modifications
      if (blogPosts.length > 0) {
        const convertedPosts = (blogPosts as unknown as BlogPost[]).map(
          convertPost
        );
        if (isMounted) {
          setLocalPosts(convertedPosts);
        }
      } else {
        // If no posts found, just set empty array
        if (isMounted) {
          setLocalPosts([]);
        }
      }
    }

    return () => {
      isMounted = false;
    };
  }, [blogPosts, isInitialized, convertPost, localPosts.length]);

  const addNewPost = useCallback(async () => {
    const newPostId = await createPost({
      user_id: userId, // Use dynamic userId
      title: `Post ${localPosts.length + 1}`,
      content: null,
      published: false,
      parent_id: null,
      position: null,
      icon: null,
      cover: null,
    });

    return newPostId;
  }, [localPosts.length, createPost, userId]); // Include userId in dependency array

  const addNewSubPost = useCallback(
    async (parentId: string) => {
      const parentPost = localPosts.find((p) => p.id === parentId);
      if (!parentPost) return;

      const subPostCount = parentPost?.children?.length || 0;

      // Create the new sub post and return its ID
      const newSubPostId = await createPost({
        user_id: userId, // Use dynamic userId
        title: `Sub post ${subPostCount + 1}`,
        content: null,
        published: false,
        parent_id: parentId,
        position: null,
        icon: null,
        cover: null,
      });

      return newSubPostId;
    },
    [localPosts, createPost, userId] // Include userId in dependency array
  );

  const updatePostTitle = useCallback(
    async (postId: string, newTitle: string) => {
      const updatePostRecursively = (posts: BlogPost[]): BlogPost[] => {
        return posts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              title: newTitle,
              updated_at: new Date().toISOString(),
            };
          }
          if (post.children && post.children.length > 0) {
            const updatedChildren = updatePostRecursively(post.children);
            const hasUpdatedChild = updatedChildren.some(
              (child, index) => child !== post.children![index]
            );
            if (hasUpdatedChild) {
              return {
                ...post,
                children: updatedChildren,
                updated_at: new Date().toISOString(),
              };
            }
            return { ...post, children: updatedChildren };
          }
          return post;
        });
      };

      setLocalPosts((prev) => updatePostRecursively(prev));

      try {
        await updatePostContent(postId, {
          title: newTitle,
          updated_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Failed to update post title:", error);
      }
    },
    [updatePostContent]
  );

  const updatePostContentLocal = useCallback(
    async (postId: string, newContent: PartialBlock[]) => {
      const contentCopy = JSON.parse(JSON.stringify(newContent));

      const updatePostRecursively = (posts: BlogPost[]): BlogPost[] => {
        return posts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              content: contentCopy,
              updated_at: new Date().toISOString(),
            };
          }
          if (post.children && post.children.length > 0) {
            const updatedChildren = updatePostRecursively(post.children);
            const hasUpdatedChild = updatedChildren.some(
              (child, index) => child !== post.children![index]
            );
            if (hasUpdatedChild) {
              return {
                ...post,
                children: updatedChildren,
                updated_at: new Date().toISOString(),
              };
            }
            return { ...post, children: updatedChildren };
          }
          return post;
        });
      };

      setLocalPosts((prev) => updatePostRecursively(prev));

      try {
        await updatePostContent(postId, {
          content: contentCopy,
          updated_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Failed to update post content:", error);
      }
    },
    [updatePostContent]
  );

  const setPostIcon = useCallback(
    async (postId: string, icon: string) => {
      const updatePostRecursively = (posts: BlogPost[]): BlogPost[] => {
        return posts.map((post) => {
          if (post.id === postId) {
            return { ...post, icon, updated_at: new Date().toISOString() };
          }
          if (post.children && post.children.length > 0) {
            const updatedChildren = updatePostRecursively(post.children);
            const hasUpdatedChild = updatedChildren.some(
              (child, index) => child !== post.children![index]
            );
            if (hasUpdatedChild) {
              return {
                ...post,
                children: updatedChildren,
                updated_at: new Date().toISOString(),
              };
            }
            return { ...post, children: updatedChildren };
          }
          return post;
        });
      };

      setLocalPosts((prev) => updatePostRecursively(prev));

      try {
        await updatePostContent(postId, {
          icon,
          updated_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Failed to set post icon:", error);
      }
    },
    [updatePostContent]
  );

  const removePostIcon = useCallback(
    async (postId: string) => {
      const updatePostRecursively = (posts: BlogPost[]): BlogPost[] => {
        return posts.map((post) => {
          if (post.id === postId) {
            return { ...post, icon: undefined, updated_at: new Date().toISOString() };
          }
          if (post.children && post.children.length > 0) {
            const updatedChildren = updatePostRecursively(post.children);
            const hasUpdatedChild = updatedChildren.some(
              (child, index) => child !== post.children![index]
            );
            if (hasUpdatedChild) {
              return {
                ...post,
                children: updatedChildren,
                updated_at: new Date().toISOString(),
              };
            }
            return { ...post, children: updatedChildren };
          }
          return post;
        });
      };

      setLocalPosts((prev) => updatePostRecursively(prev));

      try {
        await updatePostContent(postId, {
          icon: null,
          updated_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Failed to remove post icon:", error);
      }
    },
    [updatePostContent]
  );

  const setPostCover = useCallback(
    async (postId: string, cover: PostCover) => {
      const updatePostRecursively = (posts: BlogPost[]): BlogPost[] => {
        return posts.map((post) => {
          if (post.id === postId) {
            return { ...post, cover, updated_at: new Date().toISOString() };
          }
          if (post.children && post.children.length > 0) {
            const updatedChildren = updatePostRecursively(post.children);
            const hasUpdatedChild = updatedChildren.some(
              (child, index) => child !== post.children![index]
            );
            if (hasUpdatedChild) {
              return {
                ...post,
                children: updatedChildren,
                updated_at: new Date().toISOString(),
              };
            }
            return { ...post, children: updatedChildren };
          }
          return post;
        });
      };

      setLocalPosts((prev) => updatePostRecursively(prev));

      try {
        await updatePostContent(postId, {
          cover,
          updated_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Failed to set post cover:", error);
      }
    },
    [updatePostContent]
  );

  const removePostCover = useCallback(
    async (postId: string) => {
      const updatePostRecursively = (posts: BlogPost[]): BlogPost[] => {
        return posts.map((post) => {
          if (post.id === postId) {
            return { ...post, cover: undefined, updated_at: new Date().toISOString() };
          }
          if (post.children && post.children.length > 0) {
            const updatedChildren = updatePostRecursively(post.children);
            const hasUpdatedChild = updatedChildren.some(
              (child, index) => child !== post.children![index]
            );
            if (hasUpdatedChild) {
              return {
                ...post,
                children: updatedChildren,
                updated_at: new Date().toISOString(),
              };
            }
            return { ...post, children: updatedChildren };
          }
          return post;
        });
      };

      setLocalPosts((prev) => updatePostRecursively(prev));

      try {
        await updatePostContent(postId, {
          cover: null,
          updated_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Failed to remove post cover:", error);
      }
    },
    [updatePostContent]
  );

  const deletePost = useCallback(
    async (postId: string) => {
      console.log("Hook deletePost called with ID:", postId);
      console.log("Current userId:", userId);

      // Use flexible UUID validation to support various test data formats
      const uuidRegex =
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      if (!uuidRegex.test(postId)) {
        const error = new Error("Invalid UUID for post id");
        console.error("Invalid UUID for post id:", postId);
        throw error;
      }

      try {
        console.log("Optimistically removing post from local state:", postId);
        // Optimistically remove from current local state
        setLocalPosts((prev) => {
          const removeRecursive = (posts: BlogPost[]) =>
            posts.filter((post: BlogPost) => {
              if (post.id === postId) return false;
              if (post.children) post.children = removeRecursive(post.children);
              return true;
            });
          return removeRecursive(prev);
        });

        console.log("Calling deletePostContent with ID:", postId);
        await deletePostContent(postId);
        console.log("Successfully deleted post from database:", postId);

        // 不需要重新获取，store 的 deletePostContent 已经更新了状态
      } catch (error) {
        console.error("Failed to delete post:", error);
        console.error("Error details:", {
          postId: postId,
          errorName: (error as Error)?.name,
          errorMessage: (error as Error)?.message,
          errorStack: (error as Error)?.stack,
        });
        throw error;
      }
    },
    [deletePostContent, userId]
  );

  return {
    posts: localPosts,
    isLoading,
    error,
    addNewPost,
    addNewSubPost,
    updatePostTitle,
    updatePostContent: updatePostContentLocal,
    setPostIcon,
    removePostIcon,
    setPostCover,
    removePostCover,
    deletePost,
    createPost,
    deletePostContent,
    fetchPosts, // Export fetchPosts
    userId, // Export userId
    setUserId, // Export function to set userId
  };
};
