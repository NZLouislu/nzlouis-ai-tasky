import { create } from 'zustand'
import { Database } from '@/lib/supabase/blog-client'

type Post = Database['public']['Tables']['post_stats']['Row'] & {
  content?: Array<{
    type: string
    content?: Array<{
      type: string
      text: string
      styles?: Record<string, string | number | boolean>
    }>
    props?: Record<string, string | number | boolean>
  }>
  icon?: string
  cover?: { type: 'color' | 'image'; value: string }
  children?: Post[]
}

type Comment = Database['public']['Tables']['comments']['Row']
type FeatureToggles = Database['public']['Tables']['feature_toggles']['Row']

interface AnalyticsData {
  posts: Array<{
    post_id: string
    title: string
    views: number
    likes: number
    ai_questions: number
    ai_summaries: number
    totalViews: number
    totalLikes: number
    totalComments: number
    totalAIQuestions: number
    totalAISummaries: number
    dailyData: Array<{
      date: string
      views: number
      likes: number
      ai_questions: number
      ai_summaries: number
    }>
  }>
  dailyStats: Array<{
    date: string
    views: number
    likes: number
    comments: number
    aiQuestions: number
    aiSummaries: number
  }>
}

interface BlogState {
  posts: Post[]
  currentPostId: string | null
  comments: Record<string, Comment[]>
  featureToggles: FeatureToggles | null
  analytics: AnalyticsData | null
  isLoading: boolean
  error: string | null

  setPosts: (posts: Post[]) => void
  setCurrentPost: (postId: string) => void
  addPost: (post: Post) => void
  updatePost: (postId: string, updates: Partial<Post>) => void
  deletePost: (postId: string) => void
  setComments: (postId: string, comments: Comment[]) => void
  addComment: (postId: string, comment: Comment) => void
  deleteComment: (commentId: string) => void
  setFeatureToggles: (toggles: FeatureToggles) => void
  updateFeatureToggle: (key: keyof FeatureToggles, value: boolean) => void
  setAnalytics: (analytics: AnalyticsData) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
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

  addPost: (post) => set((state) => ({
    posts: [...state.posts, post]
  })),

  updatePost: (postId, updates) => set((state) => ({
    posts: state.posts.map(post =>
      post.post_id === postId ? { ...post, ...updates } : post
    )
  })),

  deletePost: (postId) => set((state) => ({
    posts: state.posts.filter(post => post.post_id !== postId)
  })),

  setComments: (postId, comments) => set((state) => ({
    comments: { ...state.comments, [postId]: comments }
  })),

  addComment: (postId, comment) => set((state) => ({
    comments: {
      ...state.comments,
      [postId]: [...(state.comments[postId] || []), comment]
    }
  })),

  deleteComment: (commentId) => set((state) => {
    const newComments = { ...state.comments }
    Object.keys(newComments).forEach(postId => {
      newComments[postId] = newComments[postId].filter(
        comment => comment.id !== commentId
      )
    })
    return { comments: newComments }
  }),

  setFeatureToggles: (toggles) => set({ featureToggles: toggles }),

  updateFeatureToggle: (key, value) => set((state) => ({
    featureToggles: state.featureToggles ? {
      ...state.featureToggles,
      [key]: value
    } : null
  })),

  setAnalytics: (analytics) => set({ analytics }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error })
}))