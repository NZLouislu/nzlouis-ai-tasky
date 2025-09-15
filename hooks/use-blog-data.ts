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

      return {
        id: post.id,
        user_id: post.user_id,
        title: post.title,
        content,
        icon: post.icon || undefined,
        cover: (post.cover as unknown as PostCover) || undefined,
        published: post.published,
        created_at: post.created_at,
        updated_at: post.updated_at,
        parent_id: post.parent_id,
        children: post.children ? post.children.map(convertPost) : [],
      };
    };

    if (isInitialized && blogPosts.length > 0) {
      const convertedPosts = (blogPosts as unknown as BlogPost[]).map(
        convertPost
      );

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
  }, [blogPosts, isLoading, isInitialized]);

  const addNewPost = useCallback(async () => {
    const newPostId = await createPost({
      user_id: "00000000-0000-0000-0000-000000000000",
      title: `Post ${localPosts.length + 1}`,
      content: null,
      published: false,
      parent_id: null,
      position: null,
      icon: null,
      cover: null,
    });

    return newPostId;
  }, [localPosts.length, createPost]);

  const addNewSubPost = useCallback(
    async (parentId: string) => {
      const parentPost = localPosts.find((p) => p.id === parentId);
      if (!parentPost) return;

      const subPostCount = parentPost?.children?.length || 0;

      const newSubPostIdResult = await createPost({
        user_id: "00000000-0000-0000-0000-000000000000",
        title: `Sub post ${subPostCount + 1}`,
        content: null,
        published: false,
        parent_id: parentId,
        position: null,
        icon: null,
        cover: null,
      });
    },
    [localPosts, createPost]
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
    async (postId: string, cover: PostCover) => {
      try {
        await updatePostContent(postId, { cover });

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
      setLocalPosts((prev) => {
        const topLevelIndex = prev.findIndex((post) => post.id === postId);
        if (topLevelIndex !== -1) {
          return [
            ...prev.slice(0, topLevelIndex),
            ...prev.slice(topLevelIndex + 1),
          ];
        }

        return prev.map((post) => ({
          ...post,
          children: post.children?.filter((child) => child.id !== postId) || [],
        }));
      });

      try {
        const postToDelete =
          localPosts.find((p) => p.id === postId) ||
          localPosts
            .flatMap((p) => p.children || [])
            .find((c) => c.id === postId);

        if (postToDelete?.children?.length) {
          await Promise.all(
            postToDelete.children.map((child) =>
              deletePostContent(child.id).catch(console.error)
            )
          );
        }

        await deletePostContent(postId);
      } catch (error) {
        console.error("Failed to delete post:", error);
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
