import { create } from "zustand";
import { supabase } from "@/lib/supabase/supabase-client";
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
  userId: string; // Add userId state

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
  setUserId: (userId: string) => void; // Add function to set userId

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
  userId: "00000000-0000-0000-0000-000000000000", // Initialize userId

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
  setUserId: (userId) => set({ userId }), // Implement function to set userId

  fetchPosts: async (userId) => {
    console.log("fetchPosts called with userId:", userId);
    set({ isLoading: true, error: null });
    try {
      if (!supabase) {
        console.warn(
          "Supabase client not initialized. Running in offline mode."
        );
        set({ posts: [], isLoading: false });
        return;
      }

      // Fetch all posts for the current user only
      const { data: userPosts, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Database error, falling back to offline mode:", error);
        set({ posts: [], isLoading: false });
        return;
      }

      console.log(`Found ${userPosts?.length || 0} posts for user ${userId}`);

      // If no posts exist, create a default post
      if (!userPosts || userPosts.length === 0) {
        console.log("No posts found in database for user:", userId);
        // Create default post
        const defaultPost = {
          user_id: userId,
          title: "Welcome to your blog",
          content: JSON.stringify([
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
          ]),
          published: true,
          parent_id: null,
          position: 0,
          icon: "📝",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        try {
          const { data: createdPost, error: createError } = await supabase
            .from("blog_posts")
            .insert(defaultPost)
            .select();

          if (createError) {
            console.error("Error creating default post:", createError);
            set({ posts: [], isLoading: false });
            return;
          }

          console.log("Created default post:", createdPost);
          set({ posts: [{ ...createdPost[0], children: [] }] });
          return;
        } catch (createError) {
          console.error("Error creating default post:", createError);
          set({ posts: [], isLoading: false });
          return;
        }
      }

      // Build hierarchical structure for posts
      const rootPosts = userPosts.filter((post) => post.parent_id === null);
      const childPosts = userPosts.filter((post) => post.parent_id !== null);

      // Group child posts by parent_id
      const childrenByParentId: Record<string, typeof userPosts> = {};
      childPosts.forEach((child) => {
        const parentId = child.parent_id as string;
        if (!childrenByParentId[parentId]) {
          childrenByParentId[parentId] = [];
        }
        childrenByParentId[parentId].push(child);
      });

      // Build hierarchical structure
      const postsWithChildren = rootPosts.map((post) => {
        const children = childrenByParentId[post.id] || [];

        // Recursively build children structure
        const buildChildrenStructure = (
          childPosts: typeof userPosts
        ): BlogPost[] => {
          return childPosts.map((child) => {
            const grandchildren = childrenByParentId[child.id] || [];
            return {
              ...child,
              children: buildChildrenStructure(grandchildren),
            } as BlogPost;
          });
        };

        return {
          ...post,
          children: buildChildrenStructure(children),
        } as BlogPost;
      });

      console.log("Setting posts in store:", postsWithChildren.length);
      set({ posts: postsWithChildren });
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

    // Generate a new ID
    const postId = generateUuid();
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
          user_id:
            ("user_id" in postWithId && postWithId.user_id) || "offline-user",
          title: "title" in postWithId ? postWithId.title : "Untitled",
          content: null,
          published: false,
          position: null,
          icon: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          children: [],
        } as unknown as BlogPost;
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
        user_id:
          ("user_id" in postWithId && postWithId.user_id) || "offline-user",
        title: "title" in postWithId ? postWithId.title : "Untitled",
        content: null,
        published: false,
        position: null,
        icon: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        children: [],
      } as unknown as BlogPost;
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

      const updateData: Partial<BlogPost> & { updated_at: string } = {
        ...updates,
        updated_at: new Date().toISOString(),
      };
      if (Object.prototype.hasOwnProperty.call(updates, "parent_id")) {
        updateData.parent_id = updates.parent_id ?? null;
      }

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
    console.log("Store deletePostContent called with ID:", id);
    set({ isLoading: true, error: null });
    try {
      // Use flexible UUID validation to support various test data formats
      const uuidRegex =
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      if (!uuidRegex.test(id)) {
        const error = new Error(`Invalid UUID for post id: ${id}`);
        console.error("Invalid UUID for post id:", id);
        throw error;
      }

      if (!supabase) {
        console.warn(
          "Supabase client not initialized. Running in offline mode."
        );
        set((state) => ({
          posts: state.posts.filter((post) => post.id !== id),
        }));
        return;
      }

      console.log("Checking if post exists in database:", id);
      // First check if the post exists
      const { data: existingPost, error: fetchError } = await supabase
        .from("blog_posts")
        .select("id")
        .eq("id", id)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116 means no rows returned, which is fine
        console.warn("Error checking if post exists:", fetchError);
        // Continue with deletion attempt for other errors
      } else if (fetchError && fetchError.code === "PGRST116") {
        console.log(
          "Post does not exist in database, but continuing with deletion"
        );
      } else {
        console.log("Post exists in database:", existingPost);
      }

      console.log("Attempting to delete post from database:", id);
      // Delete the post (CASCADE will handle children)
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);

      if (error) {
        console.error("Error deleting post from database:", error);
        throw error;
      }

      console.log("Successfully deleted post from database:", id);
      // If we got here, the deletion was successful
      set((state) => {
        const updatedPosts = state.posts.filter((post) => post.id !== id);
        console.log("Updated posts after deletion:", updatedPosts);
        return {
          posts: updatedPosts,
        };
      });
    } catch (error) {
      console.error("Error deleting post:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to delete post",
      });
      // Re-throw the error so the calling function knows it failed
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
