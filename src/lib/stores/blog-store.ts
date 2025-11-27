import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Database as TaskyDatabase } from "@/lib/supabase/supabase-client";
import { blogDb } from "@/lib/supabase/blog-client";
import type { Database as BlogDatabase } from "@/lib/supabase/blog-client";
import { generateUuid } from "@/lib/utils/uuid";

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
  userId: string;
  lastFetchTime: number | null;

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
  setUserId: (userId: string) => void;

  fetchPosts: (userId: string, forceRefresh?: boolean) => Promise<void>;
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

const CACHE_DURATION = 5 * 60 * 1000;

export const useBlogStore = create<BlogState>()(
  persist(
    (set, get) => ({
      posts: [],
      currentPostId: null,
      comments: {},
      featureToggles: null,
      analytics: null,
      isLoading: false,
      error: null,
      userId: "00000000-0000-0000-0000-000000000000",
      lastFetchTime: null,

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
      setUserId: (userId) => set({ userId }),

      fetchPosts: async (userId, forceRefresh = false) => {
        console.log("fetchPosts called with userId:", userId);
        
        const state = get();
        const now = Date.now();
        
        if (
          !forceRefresh &&
          state.posts.length > 0 &&
          state.lastFetchTime &&
          now - state.lastFetchTime < CACHE_DURATION
        ) {
          console.log("Using cached posts data");
          return;
        }

        set({ isLoading: true, error: null });
        try {
          console.log("Fetching posts via API...");
          
          const response = await fetch('/api/blog/posts');
          
          if (!response.ok) {
            const errorData = await response.json();
            console.warn("API error:", errorData.error);
            set({ posts: [], isLoading: false, error: errorData.error });
            return;
          }

          const result = await response.json();
          const userPosts = result.data;

          console.log(`Found ${userPosts?.length || 0} posts for user ${userId}`);

          const rootPosts = userPosts?.filter((post: BlogPost) => post.parent_id === null) || [];
          const childPosts = userPosts?.filter((post: BlogPost) => post.parent_id !== null) || [];

          const childrenByParentId: Record<string, BlogPost[]> = {};
          childPosts.forEach((child: BlogPost) => {
            const parentId = child.parent_id as string;
            if (!childrenByParentId[parentId]) {
              childrenByParentId[parentId] = [];
            }
            childrenByParentId[parentId].push(child);
          });

          const buildChildrenStructure = (
            childPosts: BlogPost[]
          ): BlogPost[] => {
            return childPosts.map((child: BlogPost) => {
              const grandchildren = childrenByParentId[child.id] || [];
              return {
                ...child,
                children: buildChildrenStructure(grandchildren),
              } as BlogPost;
            });
          };

          const postsWithChildren = rootPosts.map((post: BlogPost) => {
            const children = childrenByParentId[post.id] || [];
            return {
              ...post,
              children: buildChildrenStructure(children),
            } as BlogPost;
          });

          console.log("Setting posts in store:", postsWithChildren.length);
          set({ posts: postsWithChildren, lastFetchTime: now });
        } catch (error) {
          console.error("Error fetching posts:", error);
          set({
            posts: [],
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

        try {
          console.log("Creating post via API...");
          
          const response = await fetch('/api/blog/posts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(postData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create post');
          }

          const result = await response.json();
          const createdPost = result.data as BlogPost;

          if (!createdPost) {
            throw new Error('No post data returned from server');
          }

          console.log("Post created successfully:", createdPost.id);

          const updatePostsRecursive = (posts: BlogPost[]): BlogPost[] => {
            return posts.map((post) => {
              if (post.id === postData.parent_id) {
                console.log(`✅ Found parent ${postData.parent_id}, adding child ${createdPost.id}`);
                return {
                  ...post,
                  children: [
                    ...(post.children || []),
                    { ...createdPost, children: [] },
                  ],
                };
              }
              if (post.children && post.children.length > 0) {
                return {
                  ...post,
                  children: updatePostsRecursive(post.children),
                };
              }
              return post;
            });
          };

          if (postData.parent_id) {
            console.log("🔄 Updating posts with new child post");
            set((state) => ({
              posts: updatePostsRecursive(state.posts),
              lastFetchTime: Date.now(),
            }));
          } else {
            set((state) => {
              const updatedPosts = [...state.posts, { ...createdPost, children: [] }];
              console.log("Updated posts in store (root):", updatedPosts.length);
              return { posts: updatedPosts, lastFetchTime: Date.now() };
            });
          }
          
          return createdPost.id;
        } catch (error) {
          console.error("Error creating post:", error);
          set({
            error: error instanceof Error ? error.message : "Failed to create post",
          });
          throw error;
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
          console.log("Updating post via API:", id);
          
          const response = await fetch('/api/blog/posts', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id, ...updates }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update post');
          }

          const result = await response.json();
          const updatedPost = result.data as BlogPost;

          if (!updatedPost) {
            throw new Error('No post data returned from server');
          }

          console.log("Post updated successfully:", updatedPost.id);

          set((state) => ({
            posts: state.posts.map((post) =>
              post.id === id
                ? { ...updatedPost, children: post.children || [] }
                : post
            ),
            lastFetchTime: Date.now(),
          }));
        } catch (error) {
          console.error("Error updating post:", error);
          set({
            error: error instanceof Error ? error.message : "Failed to update post",
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      deletePostContent: async (id) => {
        console.log("Store deletePostContent called with ID:", id);
        set({ isLoading: true, error: null });
        try {
          const uuidRegex =
            /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
          if (!uuidRegex.test(id)) {
            const error = new Error(`Invalid UUID for post id: ${id}`);
            console.error("Invalid UUID for post id:", id);
            throw error;
          }

          console.log("Deleting post via API:", id);
          
          const response = await fetch(`/api/blog/posts?id=${id}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete post');
          }

          console.log("Successfully deleted post from database:", id);
          
          set((state) => {
            const removePostRecursive = (posts: BlogPost[]): BlogPost[] => {
              return posts
                .filter((post) => post.id !== id)
                .map((post) => ({
                  ...post,
                  children: post.children ? removePostRecursive(post.children) : [],
                }));
            };
            
            const updatedPosts = removePostRecursive(state.posts);
            console.log("Updated posts after deletion:", updatedPosts.length);
            return {
              posts: updatedPosts,
              lastFetchTime: Date.now(),
            };
          });
        } catch (error) {
          console.error("Error deleting post:", error);
          set({
            error: error instanceof Error ? error.message : "Failed to delete post",
          });
          throw error;
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
            id: generateUuid(),
            created_at: new Date().toISOString(),
          };

          const { data, error } = await blogDb
            .from("comments")
            .insert(newComment)
            .select();

          if (error) throw error;

          if (!data || data.length === 0) {
            throw new Error("Failed to insert comment.");
          }

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
    }),
    {
      name: 'blog-store',
      partialize: (state) => ({
        posts: state.posts,
        currentPostId: state.currentPostId,
        userId: state.userId,
        lastFetchTime: state.lastFetchTime,
      }),
    }
  )
);
