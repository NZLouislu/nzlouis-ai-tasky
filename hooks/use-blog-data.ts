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
  const convertPost = (post: BlogPost): BlogPost => {
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
        }
      } catch (e) {
        content = [];
      }
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
  };

  // Define function to create default post
  const createDefaultPost = useCallback(
    async (userId: string) => {
      try {
        console.log("Creating default post for userId:", userId);
        const newPostId = await createPost({
          user_id: userId,
          title: "Welcome to your blog",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "This is your first blog post. You can edit this content or create new posts.",
                  styles: {},
                },
              ],
            },
          ] as any,
          published: true,
          parent_id: null,
          position: 0,
          icon: "📝",
        });

        console.log("Created default post with ID:", newPostId);
        return newPostId;
      } catch (error) {
        console.error("Failed to create default post:", error);
        throw error;
      }
    },
    [createPost]
  );

  function generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0,
          v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  useEffect(() => {
    let isMounted = true;

    const initializeBlogData = async () => {
      if (isInitialized) return;

      try {
        setIsLoading(true);
        // Use dynamic userId instead of fixed "00000000-0000-0000-0000-000000000000"
        await fetchPosts(userId);
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
  }, [fetchPosts, isInitialized, userId]); // Add userId to dependency array

  useEffect(() => {
    let isMounted = true;

    if (isInitialized) {
      // Only use default post when there are no articles
      // If blogPosts is an empty array, it means the database query has completed but no articles were found
      // In this case, we need to create a default post for new users
      if (blogPosts.length > 0) {
        const convertedPosts = (blogPosts as unknown as BlogPost[]).map(
          convertPost
        );
        if (isMounted) {
          setLocalPosts(convertedPosts);
        }
      } else {
        // Database query completed but no posts found, create default post for new user
        console.log(
          "No posts found for user, creating default post for userId:",
          userId
        );
        createDefaultPost(userId)
          .then(() => {
            if (isMounted) {
              // Re-fetch post list
              fetchPosts(userId);
            }
          })
          .catch((error) => {
            console.error("Failed to create default post:", error);
            if (isMounted) {
              setLocalPosts([]);
            }
          });
      }
    }

    return () => {
      isMounted = false;
    };
  }, [blogPosts, isInitialized, userId, createDefaultPost, fetchPosts]);

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

  const removePostIcon = useCallback((postId: string) => {
    setLocalPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          return { ...post, icon: undefined };
        }
        if (post.children) {
          const updatedChildren = post.children.map((child) => {
            if (child.id === postId) {
              return { ...child, icon: undefined };
            }
            return child;
          });
          return { ...post, children: updatedChildren };
        }
        return post;
      })
    );
  }, []);

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

  const removePostCover = useCallback((postId: string) => {
    setLocalPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          return { ...post, cover: undefined };
        }
        if (post.children) {
          const updatedChildren = post.children.map((child) => {
            if (child.id === postId) {
              return { ...child, cover: undefined };
            }
            return child;
          });
          return { ...post, children: updatedChildren };
        }
        return post;
      })
    );
  }, []);

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

        console.log("Refreshing posts after deletion for userId:", userId);
        // Use dynamic userId instead of fixed "00000000-0000-0000-0000-000000000000"
        await fetchPosts(userId);
        console.log("Finished refreshing posts");
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
    [deletePostContent, userId] // Add userId to dependency array
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
    userId, // Export userId
    setUserId, // Export function to set userId
  };
};
