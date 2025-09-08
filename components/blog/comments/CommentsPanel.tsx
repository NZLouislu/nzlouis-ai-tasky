"use client";
import { useState, useEffect } from 'react'
import { useBlogStore } from '@/lib/stores/blog-store'
import { useOptimisticList } from '@/lib/hooks/use-optimistic-update'
import { Trash2, MessageCircle, User } from 'lucide-react'

interface Comment {
  id: string
  post_id: string
  name: string | null
  email: string | null
  comment: string
  is_anonymous: boolean
  created_at: string
}

interface CommentsPanelProps {
  postId: string
}

export default function CommentsPanel({ postId }: CommentsPanelProps) {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)

  const posts = useBlogStore(state => state.posts)
  const comments = useBlogStore(state => state.comments)
  const setComments = useBlogStore(state => state.setComments)

  const currentComments = selectedPostId ? comments[selectedPostId] || [] : []

  const optimisticComments = currentComments

  useEffect(() => {
    if (postId && posts.find(p => p.post_id === postId)) {
      setSelectedPostId(postId)
    }
  }, [postId, posts])

  useEffect(() => {
    if (selectedPostId) {
      fetchComments(selectedPostId)
    }
  }, [selectedPostId])

  const fetchComments = async (postId: string) => {
    try {
      const response = await fetch(`/api/blog/comments?postId=${postId}`)
      if (response.ok) {
        const data = await response.json()
        setComments(postId, data)
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/blog/comments/${commentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const updatedComments = optimisticComments.filter(c => c.id !== commentId)
        if (selectedPostId) {
          setComments(selectedPostId, updatedComments)
        }
      }
    } catch (error) {
      console.error('Failed to delete comment:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="flex h-full bg-white">
      <div className="w-80 border-r border-gray-200 p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <MessageCircle className="h-5 w-5 mr-2" />
          Blog Posts
        </h3>
        <div className="space-y-2">
          {posts.map(post => (
            <button
              key={post.post_id}
              onClick={() => setSelectedPostId(post.post_id)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                selectedPostId === post.post_id
                  ? 'bg-blue-50 border border-blue-200'
                  : 'hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="font-medium text-sm truncate">{post.title || 'Untitled Post'}</div>
              <div className="text-xs text-gray-500 mt-1">
                {comments[post.post_id]?.length || 0} comments
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedPostId ? (
          <>
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                Comments for: {posts.find(p => p.post_id === selectedPostId)?.title || 'Untitled Post'}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {optimisticComments.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No comments yet. Be the first to comment!
                </div>
              ) : (
                optimisticComments.map(comment => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">
                          {comment.is_anonymous ? 'Anonymous' : (comment.name || 'Anonymous')}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{comment.comment}</p>
                  </div>
                ))
              )}
            </div>

          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a blog post to view comments
          </div>
        )}
      </div>
    </div>
  )
}