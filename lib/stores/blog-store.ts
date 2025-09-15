import { create } from "zustand";
import { supabase } from "@/lib/supabase/supabase-client";
import type { Database as TaskyDatabase } from "@/lib/supabase/supabase-client";
import { blogDb } from "@/lib/supabase/blog-client";
import type { Database as BlogDatabase } from "@/lib/supabase/blog-client";

interface PostCover {
  type: "color" | "image";
  value: string;
}

type BlogPost = Omit<
  TaskyDatabase["public"]["Tables"]["blog_posts"]["Row"],
  "cover"
> & {
  cover?: PostCover | null;
  children?: BlogPost[];
  [key: string]: unknown;
};
type Comment = BlogDatabase["public"]["Tables"]["comments"]["Row"];
type FeatureToggles =
  BlogDatabase["public"]["Tables"]["feature_toggles"]["Row"];

interface AnalyticsData {
  posts: Array<{
    post_id: string;
    title: string;
    views: number;
    likes: number;
    ai_questions: number;
    ai_summaries: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalAIQuestions: number;
    totalAISummaries: number;
    dailyData: Array<{
      date: string;
      views: number;
      likes: number;
      ai_questions: number;
      ai_summaries: number;
    }>;
  }>;
  dailyStats: Array<{
    date: string;
    views: number;
    likes: number;
    comments: number;
    aiQuestions: number;
    aiSummaries: number;
  }>;
}

interface BlogState {
  posts: BlogPost[];
  currentPostId: string | null;
  comments: Record<string, Comment[]>;
  featureToggles: FeatureToggles | null;
  analytics: AnalyticsData | null;
  isLoading: boolean;
  error: string | null;

  setPosts: (posts: BlogPost[]) => void;
  setCurrentPost: (postId: string) => void;
  addPost: (post: BlogPost) => void;
  updatePost: (postId: string, updates: Partial<BlogPost>) => void;
  deletePost: (postId: string) => void;
  setComments: (postId: string, comments: Comment[]) => void;
  addComment: (postId: string, comment: Comment) => void;
  deleteComment: (commentId: string) => void;
  setFeatureToggles: (toggles: FeatureToggles) => void;
  updateFeatureToggle: (key: keyof FeatureToggles, value: boolean) => void;
  setAnalytics: (analytics: AnalyticsData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  fetchPosts: (userId: string) => Promise<void>;
  createPost: (
    postData: Omit<BlogPost, "id" | "created_at" | "updated_at"> & {
      parent_id?: string | null;
    }
  ) => Promise<string>;
  updatePostContent: (
    id: string,
    updates: Partial<BlogPost> & { parent_id?: string | null }
  ) => Promise<void>;
  deletePostContent: (id: string) => Promise<void>;

  fetchComments: (postId: string) => Promise<void>;
  addNewComment: (comment: Omit<Comment, "id" | "created_at">) => Promise<void>;
  removeComment: (id: string) => Promise<void>;
}

export const useBlogStore = create<BlogState>((set) => ({
  posts: [],
  currentPostId: null,
  comments: {},
  featureToggles: null,
  analytics: null,
  isLoading: false,
  error: null,

  setPosts: (posts) => set({ posts }),
  setCurrentPost: (postId) => set({ currentPostId: postId }),
  addPost: (post) => set((state) => ({ posts: [...state.posts, post] })),
  updatePost: (postId, updates) =>
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId ? { ...post, ...updates } : post
      ),
    })),
  deletePost: (postId) =>
    set((state) => ({
      posts: state.posts.filter((post) => post.id !== postId),
    })),
  setComments: (postId, comments) =>
    set((state) => ({
      comments: { ...state.comments, [postId]: comments },
    })),
  addComment: (postId, comment) =>
    set((state) => ({
      comments: {
        ...state.comments,
        [postId]: [...(state.comments[postId] || []), comment],
      },
    })),
  deleteComment: (commentId) =>
    set((state) => {
      const newComments = { ...state.comments };
      Object.keys(newComments).forEach((postId) => {
        newComments[postId] = newComments[postId].filter(
          (comment) => comment.id !== commentId
        );
      });
      return { comments: newComments };
    }),
  setFeatureToggles: (toggles) => set({ featureToggles: toggles }),
  updateFeatureToggle: (key, value) =>
    set((state) => ({
      featureToggles: state.featureToggles
        ? {
            ...state.featureToggles,
            [key]: value,
          }
        : null,
    })),
  setAnalytics: (analytics) => set({ analytics }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  fetchPosts: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      if (!supabase) {
        console.warn(
          "Supabase client not initialized. Running in offline mode."
        );
        set({ posts: [] });
        return;
      }

      const { data: rootPosts, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("user_id", userId)
        .is("parent_id", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const postsWithChildren = await Promise.all(
        (rootPosts || []).map(async (post) => {
          if (!supabase) return post as BlogPost;
          const { data: children } = await supabase
            .from("blog_posts")
            .select("*")
            .eq("user_id", userId)
            .eq("parent_id", post.id)
            .order("created_at", { ascending: false });

          const postWithChildren = {
            ...post,
            children: children || [],
          } as BlogPost;

          // Recursively load grandchildren if needed
          postWithChildren.children = await Promise.all(
            (postWithChildren.children || []).map(async (child) => {
              if (!supabase) return child as BlogPost;
              const { data: grandchildren } = await supabase
                .from("blog_posts")
                .select("*")
                .eq("user_id", userId)
                .eq("parent_id", child.id)
                .order("created_at", { ascending: false });
              return { ...child, children: grandchildren || [] } as BlogPost;
            })
          );

          return postWithChildren;
        })
      );

      set({ posts: postsWithChildren });
    } catch (error) {
      console.error("Error fetching posts:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to fetch posts",
      });
    } finally {
      set({ isLoading: false });
    }
  },

  createPost: async (
    postData: Omit<BlogPost, "id" | "created_at" | "updated_at"> & {
      parent_id?: string | null;
    }
  ): Promise<string> => {
    set({ isLoading: true, error: null });

    // Generate a new ID
    const postId = generateUUID();
    const postWithId = {
      ...postData,
      id: postId,
      parent_id: postData.parent_id ?? null,
    };

    try {
      if (!supabase) {
        console.warn(
          "Supabase client not initialized. Running in offline mode."
        );
        const tempPost = {
          ...postWithId,
          user_id: "offline-user",
          title: "title" in postWithId ? postWithId.title : "Untitled",
          content: null,
          published: false,
          position: null,
          icon: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          children: [],
        } as BlogPost;
        const updatePosts = (posts: BlogPost[]): BlogPost[] => {
          return posts.map((post) => {
            if (post.id === postWithId.parent_id) {
              return {
                ...post,
                children: [
                  ...(post.children || []),
                  { ...tempPost, children: [] },
                ],
              };
            }
            if (post.children) {
              return {
                ...post,
                children: updatePosts(post.children),
              };
            }
            return post;
          });
        };
        set((state) => ({ posts: updatePosts(state.posts) }));
        return postId;
      }

      const { data, error } = await supabase
        .from("blog_posts")
        .insert(
          postWithId as TaskyDatabase["public"]["Tables"]["blog_posts"]["Insert"]
        )
        .select();

      if (error) throw error;

      // Check if any rows were inserted
      if (!data || data.length === 0) {
        throw new Error("Failed to create post.");
      }

      // Use the first item since we're inserting one post
      const createdPost = data[0] as BlogPost;

      const updatePosts = (posts: BlogPost[]): BlogPost[] => {
        return posts.map((post) => {
          if (post.id === postWithId.parent_id) {
            return {
              ...post,
              children: [
                ...(post.children || []),
                { ...createdPost, children: [] },
              ],
            };
          }
          if (post.children) {
            return {
              ...post,
              children: updatePosts(post.children),
            };
          }
          return post;
        });
      };

      if (postWithId.parent_id) {
        set((state) => ({ posts: updatePosts(state.posts) }));
      } else {
        set((state) => ({
          posts: [...state.posts, { ...createdPost, children: [] }],
        }));
      }
      return postId; // Return the generated ID
    } catch (error) {
      console.error("Error creating post:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to create post",
      });
      // Fallback to local addition in case of error
      const tempPost = {
        ...postWithId,
        user_id: "offline-user",
        title: "title" in postWithId ? postWithId.title : "Untitled",
        content: null,
        published: false,
        position: null,
        icon: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        children: [],
      } as BlogPost;
      const updatePosts = (posts: BlogPost[]): BlogPost[] => {
        return posts.map((post) => {
          if (post.id === postWithId.parent_id) {
            return {
              ...post,
              children: [
                ...(post.children || []),
                { ...tempPost, children: [] },
              ],
            };
          }
          if (post.children) {
            return {
              ...post,
              children: updatePosts(post.children),
            };
          }
          return post;
        });
      };
      if (postWithId.parent_id) {
        set((state) => ({ posts: updatePosts(state.posts) }));
      } else {
        set((state) => ({ posts: [...state.posts, tempPost] }));
      }
      return postId; // Return the generated ID even in error case
    } finally {
      set({ isLoading: false });
    }
  },

  updatePostContent: async (
    id,
    updates: Partial<BlogPost> & { parent_id?: string | null }
  ) => {
    set({ isLoading: true, error: null });
    try {
      if (!supabase) {
        console.warn(
          "Supabase client not initialized. Running in offline mode."
        );
        set((state) => ({
          posts: state.posts.map((post) =>
            post.id === id
              ? {
                  ...post,
                  ...updates,
                  updated_at: new Date().toISOString(),
                  children: post.children,
                }
              : post
          ),
        }));
        return;
      }

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
        parent_id: updates.parent_id ?? null,
      };

      const { data, error } = await supabase
        .from("blog_posts")
        .update(
          updateData as TaskyDatabase["public"]["Tables"]["blog_posts"]["Update"]
        )
        .eq("id", id)
        .select();

      if (error) throw error;

      // Check if any rows were updated
      if (!data || data.length === 0) {
        throw new Error("No rows were updated. The post may not exist.");
      }

      // Use the first item since we're updating by ID which should be unique
      const updatedPost = data[0] as BlogPost;

      set((state) => ({
        posts: state.posts.map((post) =>
          post.id === id
            ? { ...updatedPost, children: post.children || [] }
            : post
        ),
      }));
    } catch (error) {
      console.error("Error updating post:", error);
      set((state) => ({
        posts: state.posts.map((post) =>
          post.id === id
            ? {
                ...post,
                ...updates,
                updated_at: new Date().toISOString(),
                children: post.children || [],
              }
            : post
        ),
      }));
      set({
        error: error instanceof Error ? error.message : "Failed to update post",
      });
    } finally {
      set({ isLoading: false });
    }
  },

  deletePostContent: async (id) => {
    set({ isLoading: true, error: null });
    try {
      if (!supabase) {
        console.warn(
          "Supabase client not initialized. Running in offline mode."
        );
        set((state) => ({
          posts: state.posts.filter((post) => post.id !== id),
        }));
        return;
      }

      const { error } = await supabase.from("blog_posts").delete().eq("id", id);

      if (error) throw error;

      set((state) => ({
        posts: state.posts.filter((post) => post.id !== id),
      }));
    } catch (error) {
      console.error("Error deleting post:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to delete post",
      });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchComments: async (postId) => {
    set({ isLoading: true, error: null });
    try {
      if (!blogDb) {
        console.warn(
          "Blog database client not initialized. Cannot fetch comments."
        );
        return;
      }

      const { data, error } = await blogDb
        .from("comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      set((state) => ({
        comments: {
          ...state.comments,
          [postId]: data || [],
        },
      }));
    } catch (error) {
      console.error("Error fetching comments:", error);
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch comments",
      });
    } finally {
      set({ isLoading: false });
    }
  },

  addNewComment: async (comment) => {
    set({ isLoading: true, error: null });
    try {
      if (!blogDb) {
        console.warn(
          "Blog database client not initialized. Cannot add comment."
        );
        return;
      }

      const newComment = {
        ...comment,
        id: generateUUID(),
        created_at: new Date().toISOString(),
      };

      const { data, error } = await blogDb
        .from("comments")
        .insert(newComment)
        .select();

      if (error) throw error;

      // Check if any rows were inserted
      if (!data || data.length === 0) {
        throw new Error("Failed to insert comment.");
      }

      // Use the first item since we're inserting one comment
      const insertedComment = data[0];

      set((state) => ({
        comments: {
          ...state.comments,
          [comment.post_id]: [
            insertedComment as Comment,
            ...(state.comments[comment.post_id] || []),
          ],
        },
      }));
    } catch (error) {
      console.error("Error adding comment:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to add comment",
      });
    } finally {
      set({ isLoading: false });
    }
  },

  removeComment: async (id) => {
    set({ isLoading: true, error: null });
    try {
      if (!blogDb) {
        console.warn(
          "Blog database client not initialized. Cannot delete comment."
        );
        return;
      }

      const { error } = await blogDb.from("comments").delete().eq("id", id);

      if (error) throw error;

      set((state) => {
        const updatedComments = { ...state.comments };
        for (const postId in updatedComments) {
          updatedComments[postId] = updatedComments[postId].filter(
            (comment) => comment.id !== id
          );
        }
        return { comments: updatedComments };
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      set({
        error:
          error instanceof Error ? error.message : "Failed to delete comment",
      });
    } finally {
      set({ isLoading: false });
    }
  },
}));

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
