import { useState, useEffect, useCallback } from "react";
import { useBlogStore, BlogPost as StoreBlogPost } from "@/lib/stores/blog-store";
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
    userId,
    setUserId,
    isLoading: storeLoading,
    error: storeError,
  } = useBlogStore();

  // Helper to convert store posts to component format
  const convertPost = useCallback((post: StoreBlogPost): BlogPost => {
    let content: PartialBlock[] = [];
    
    // Handle content conversion safely
    if (post.content) {
      if (typeof post.content === "object" && Array.isArray(post.content)) {
        content = post.content as unknown as PartialBlock[];
      } else if (typeof post.content === "string") {
        try {
          const parsed = JSON.parse(post.content);
          if (Array.isArray(parsed)) {
            content = parsed as PartialBlock[];
          } else {
            content = [parsed] as PartialBlock[];
          }
        } catch {
          content = [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: post.content,
                  styles: {},
                },
              ],
            },
          ] as PartialBlock[];
        }
      }
    }

    let cover: PostCover | undefined = undefined;
    if (post.cover && typeof post.cover === "object") {
      const coverType = (post.cover as any).type;
      if (coverType === "color" || coverType === "image") {
        cover = {
          type: coverType,
          value: (post.cover as any).value || "",
        };
      }
    }

    return {
      ...post,
      content,
      cover,
      children: post.children ? post.children.map((child: StoreBlogPost) => convertPost(child)) : [],
    } as BlogPost;
  }, []);

  // Memoize converted posts to prevent unnecessary re-renders
  // We use the store's posts directly, but apply the safety conversion
  const posts = blogPosts.map(convertPost);

  // SWR Pattern:
  // 1. If we have posts, show them immediately (isLoading = false)
  // 2. Fetch in background to update
  // 3. If no posts and fetching, isLoading = true
  
  const isLoading = posts.length === 0 && storeLoading;

  useEffect(() => {
    const init = async () => {
      if (userId === "00000000-0000-0000-0000-000000000000") return;
      
      // Fetch posts (store handles caching logic)
      await fetchPosts(userId);
    };
    
    init();
  }, [userId, fetchPosts]);

  // Wrapper functions to maintain API compatibility
  const addNewPost = useCallback(async () => {
    return await createPost({
      user_id: userId,
      title: `Post ${posts.length + 1}`,
      content: null,
      published: false,
      parent_id: null,
      position: null,
      icon: null,
      cover: null,
    });
  }, [posts.length, createPost, userId]);

  const addNewSubPost = useCallback(async (parentId: string) => {
    const parentPost = posts.find((p) => p.id === parentId);
    const subPostCount = parentPost?.children?.length || 0;
    
    return await createPost({
      user_id: userId,
      title: `Sub post ${subPostCount + 1}`,
      content: null,
      published: false,
      parent_id: parentId,
      position: null,
      icon: null,
      cover: null,
    });
  }, [posts, createPost, userId]);

  const updatePostTitle = useCallback(async (postId: string, newTitle: string) => {
    // Optimistic update is handled by the store
    await updatePostContent(postId, {
      title: newTitle,
      updated_at: new Date().toISOString(),
    });
  }, [updatePostContent]);

  const updatePostContentLocal = useCallback(async (postId: string, newContent: PartialBlock[]) => {
    await updatePostContent(postId, {
      content: newContent,
      updated_at: new Date().toISOString(),
    });
  }, [updatePostContent]);

  const setPostIcon = useCallback(async (postId: string, icon: string) => {
    await updatePostContent(postId, {
      icon,
      updated_at: new Date().toISOString(),
    });
  }, [updatePostContent]);

  const removePostIcon = useCallback(async (postId: string) => {
    await updatePostContent(postId, {
      icon: null,
      updated_at: new Date().toISOString(),
    });
  }, [updatePostContent]);

  const setPostCover = useCallback(async (postId: string, cover: PostCover) => {
    await updatePostContent(postId, {
      cover,
      updated_at: new Date().toISOString(),
    });
  }, [updatePostContent]);

  const removePostCover = useCallback(async (postId: string) => {
    await updatePostContent(postId, {
      cover: null,
      updated_at: new Date().toISOString(),
    });
  }, [updatePostContent]);

  const deletePost = useCallback(async (postId: string) => {
    await deletePostContent(postId);
  }, [deletePostContent]);

  return {
    posts,
    isLoading,
    error: storeError,
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
    fetchPosts,
    userId,
    setUserId,
  };
};
