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

export const useBlogDataReadonly = () => {
  const {
    posts: blogPosts,
    fetchPosts,
    userId,
    setUserId,
  } = useBlogStore();
  
  const [localPosts, setLocalPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

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
          content = [parsed] as PartialBlock[];
        }
      } catch (e) {
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
      content = [];
    }

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
  }, [fetchPosts, isInitialized, userId]);

  useEffect(() => {
    let isMounted = true;

    if (isInitialized) {
      if (blogPosts.length > 0) {
        const convertedPosts = (blogPosts as unknown as BlogPost[]).map(
          convertPost
        );
        if (isMounted) {
          setLocalPosts(convertedPosts);
        }
      } else {
        if (isMounted) {
          setLocalPosts([]);
        }
      }
    }

    return () => {
      isMounted = false;
    };
  }, [blogPosts, isInitialized]);

  return {
    posts: localPosts,
    isLoading,
    error,
    userId,
    setUserId,
  };
};