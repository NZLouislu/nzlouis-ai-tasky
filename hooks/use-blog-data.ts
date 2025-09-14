import { useState, useEffect, useCallback } from "react";
import { useBlogStore } from "@/lib/stores/blog-store";
import type { PartialBlock } from "@blocknote/core";

interface BlogPost {
  id: string;
  user_id: string;
  title: string;
  content: PartialBlock[];
  icon?: string;
  cover?: {
    type: "color" | "image";
    value: string;
  };
  published?: boolean;
  created_at?: string;
  updated_at?: string;
  children?: BlogPost[];
}

export const useBlogData = () => {
  const {
    posts: blogPosts,
    fetchPosts,
    createPost,
    updatePostContent,
    deletePostContent,
  } = useBlogStore();
  const [localPosts, setLocalPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

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
        await fetchPosts("00000000-0000-0000-0000-000000000000");
        if (isMounted) {
          setIsInitialized(true);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to load blog data:", err);
          setError(
            err instanceof Error ? err.message : "Failed to load blog data"
          );
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
  }, [fetchPosts, isInitialized]);

  useEffect(() => {
    let isMounted = true;

    if (isInitialized && blogPosts.length > 0) {
      const convertedPosts = blogPosts.map((post) => ({
        id: post.id,
        user_id: post.user_id,
        title: post.title,
        content: (post.content as unknown as PartialBlock[]) || [],
        icon: post.icon || undefined,
        cover:
          (post.cover as unknown as {
            type: "color" | "image";
            value: string;
          }) || undefined,
        published: post.published,
        created_at: post.created_at,
        updated_at: post.updated_at,
        children: [],
      }));

      if (isMounted) {
        setLocalPosts(convertedPosts);
      }
    } else if (isInitialized && !isLoading && localPosts.length === 0) {
      const defaultPosts: BlogPost[] = [
        {
          id: "11111111-1111-1111-1111-111111111111",
          user_id: "user-1",
          title: "My first blog post",
          content: [
            {
              type: "paragraph",
              content: "Welcome to your new blog post!",
            },
          ],
          published: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          children: [
            {
              id: "22222222-2222-2222-2222-222222222222",
              user_id: "user-1",
              title: "Introduction",
              content: [],
              published: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: "33333333-3333-3333-3333-333333333333",
              user_id: "user-1",
              title: "Conclusion",
              content: [],
              published: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        },
      ];

      if (isMounted) {
        setLocalPosts(defaultPosts);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [blogPosts, isLoading, localPosts.length, isInitialized]);

  const addNewPost = useCallback(async () => {
    const newPostId = generateUUID();
    const newPostData = {
      id: newPostId,
      user_id: "00000000-0000-0000-0000-000000000000",
      title: `Post ${localPosts.length + 1}`,
      content: [],
      published: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await createPost({
        user_id: "00000000-0000-0000-0000-000000000000",
        title: newPostData.title,
        content: null,
        published: false,
        parent_id: null,
        position: null,
        icon: null,
        cover: null,
      });

      setLocalPosts((prev) => [...prev, { ...newPostData, children: [] }]);
      return newPostId;
    } catch (error) {
      console.error("Failed to create post:", error);
      setLocalPosts((prev) => [...prev, { ...newPostData, children: [] }]);
      return newPostId;
    }
  }, [localPosts.length, createPost]);

  const addNewSubPost = useCallback(
    (parentId: string) => {
      const parentPost = localPosts.find((p) => p.id === parentId);
      const subPostCount = parentPost?.children?.length || 0;
      const newSubPostId = generateUUID();

      const newSubPost: BlogPost = {
        id: newSubPostId,
        user_id: "00000000-0000-0000-0000-000000000000",
        title: `Sub post ${subPostCount + 1}`,
        content: [],
        published: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setLocalPosts((prev) =>
        prev.map((post) => {
          if (post.id === parentId) {
            return {
              ...post,
              children: [...(post.children || []), newSubPost],
            };
          }
          return post;
        })
      );

      return newSubPostId;
    },
    [localPosts]
  );

  const updatePostTitle = useCallback(
    async (postId: string, newTitle: string) => {
      try {
        await updatePostContent(postId, { title: newTitle });

        setLocalPosts((prev) =>
          prev.map((post) => {
            if (post.id === postId) {
              return { ...post, title: newTitle };
            }
            if (post.children) {
              const updatedChildren = post.children.map((child) => {
                if (child.id === postId) {
                  return { ...child, title: newTitle };
                }
                return child;
              });
              return { ...post, children: updatedChildren };
            }
            return post;
          })
        );
      } catch (error) {
        console.error("Failed to update post title:", error);
        setLocalPosts((prev) =>
          prev.map((post) => {
            if (post.id === postId) {
              return { ...post, title: newTitle };
            }
            if (post.children) {
              const updatedChildren = post.children.map((child) => {
                if (child.id === postId) {
                  return { ...child, title: newTitle };
                }
                return child;
              });
              return { ...post, children: updatedChildren };
            }
            return post;
          })
        );
      }
    },
    [updatePostContent]
  );

  const updatePostContentLocal = useCallback(
    async (postId: string, newContent: PartialBlock[]) => {
      const contentCopy = JSON.parse(JSON.stringify(newContent));

      try {
        await updatePostContent(postId, {
          content: contentCopy,
          updated_at: new Date().toISOString(),
        });

        setLocalPosts((prev) =>
          prev.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                content: contentCopy,
                updated_at: new Date().toISOString(),
              };
            }
            if (post.children) {
              const updatedChildren = post.children.map((child) => {
                if (child.id === postId) {
                  return {
                    ...child,
                    content: contentCopy,
                    updated_at: new Date().toISOString(),
                  };
                }
                return child;
              });
              return { ...post, children: updatedChildren };
            }
            return post;
          })
        );
      } catch (error) {
        console.error("Failed to update post content:", error);
        setLocalPosts((prev) =>
          prev.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                content: contentCopy,
                updated_at: new Date().toISOString(),
              };
            }
            if (post.children) {
              const updatedChildren = post.children.map((child) => {
                if (child.id === postId) {
                  return {
                    ...child,
                    content: contentCopy,
                    updated_at: new Date().toISOString(),
                  };
                }
                return child;
              });
              return { ...post, children: updatedChildren };
            }
            return post;
          })
        );
      }
    },
    [updatePostContent]
  );

  const setPostIcon = useCallback(
    async (postId: string, icon: string) => {
      try {
        await updatePostContent(postId, { icon });

        setLocalPosts((prev) =>
          prev.map((post) => {
            if (post.id === postId) {
              return { ...post, icon };
            }
            if (post.children) {
              const updatedChildren = post.children.map((child) => {
                if (child.id === postId) {
                  return { ...child, icon };
                }
                return child;
              });
              return { ...post, children: updatedChildren };
            }
            return post;
          })
        );
      } catch (error) {
        console.error("Failed to set post icon:", error);
        setLocalPosts((prev) =>
          prev.map((post) => {
            if (post.id === postId) {
              return { ...post, icon };
            }
            if (post.children) {
              const updatedChildren = post.children.map((child) => {
                if (child.id === postId) {
                  return { ...child, icon };
                }
                return child;
              });
              return { ...post, children: updatedChildren };
            }
            return post;
          })
        );
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
    async (
      postId: string,
      cover: { type: "color" | "image"; value: string }
    ) => {
      try {
        await updatePostContent(postId, { cover: cover as unknown as JSON });

        setLocalPosts((prev) =>
          prev.map((post) => {
            if (post.id === postId) {
              return { ...post, cover };
            }
            if (post.children) {
              const updatedChildren = post.children.map((child) => {
                if (child.id === postId) {
                  return { ...child, cover };
                }
                return child;
              });
              return { ...post, children: updatedChildren };
            }
            return post;
          })
        );
      } catch (error) {
        console.error("Failed to set post cover:", error);
        setLocalPosts((prev) =>
          prev.map((post) => {
            if (post.id === postId) {
              return { ...post, cover };
            }
            if (post.children) {
              const updatedChildren = post.children.map((child) => {
                if (child.id === postId) {
                  return { ...child, cover };
                }
                return child;
              });
              return { ...post, children: updatedChildren };
            }
            return post;
          })
        );
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
      // First update local state optimistically
      setLocalPosts((prev) => {
        // First, try to find and remove from top level
        const topLevelIndex = prev.findIndex((post) => post.id === postId);
        if (topLevelIndex !== -1) {
          return [
            ...prev.slice(0, topLevelIndex),
            ...prev.slice(topLevelIndex + 1),
          ];
        }

        // If not found at top level, search in children
        return prev.map((post) => ({
          ...post,
          children: post.children?.filter((child) => child.id !== postId) || [],
        }));
      });

      // Then try to delete from the server
      try {
        // First check if we need to delete children
        const postToDelete =
          localPosts.find((p) => p.id === postId) ||
          localPosts
            .flatMap((p) => p.children || [])
            .find((c) => c.id === postId);

        // If the post has children, delete them first
        if (postToDelete?.children?.length) {
          await Promise.all(
            postToDelete.children.map((child) =>
              deletePostContent(child.id).catch(console.error)
            )
          );
        }

        // Then delete the post itself
        await deletePostContent(postId);
      } catch (error) {
        console.error("Failed to delete post:", error);
        // The error is already logged, but we don't revert the UI
        // since we're doing optimistic updates
      }
    },
    [localPosts, deletePostContent]
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
  };
};
