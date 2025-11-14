import { useBlogStore } from '@/lib/stores/blog-store';
import { supabase } from '@/lib/supabase/supabase-client';

// Mock fetch for API calls
global.fetch = jest.fn();

jest.mock('@/lib/supabase/supabase-client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Blog Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useBlogStore.setState({
      posts: [],
      currentPostId: null,
      isLoading: false,
      error: null,
    });
  });

  describe('fetchPosts', () => {
    it('should fetch and organize posts hierarchically', async () => {
      const mockPosts = [
        { id: 'post-1', title: 'Parent', parent_id: null, user_id: 'user-1' },
        { id: 'post-2', title: 'Child', parent_id: 'post-1', user_id: 'user-1' },
      ];

      // Mock fetch for API call
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockPosts }),
      });

      await useBlogStore.getState().fetchPosts('user-1');

      const state = useBlogStore.getState();
      expect(state.posts).toHaveLength(1);
      expect(state.posts[0].id).toBe('post-1');
      expect(state.posts[0].children).toHaveLength(1);
      expect(state.posts[0].children?.[0].id).toBe('post-2');
    });

    it('should handle empty posts', async () => {
      // Mock fetch for API call
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await useBlogStore.getState().fetchPosts('user-1');

      const state = useBlogStore.getState();
      expect(state.posts).toHaveLength(0);
    });
  });

  describe('createPost', () => {
    it('should create a new post', async () => {
      const newPost = {
        id: 'new-post',
        user_id: 'user-1',
        title: 'New Post',
        content: null,
        published: false,
      };

      // Mock fetch for API call
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: newPost }),
      });

      const postId = await useBlogStore.getState().createPost({
        user_id: 'user-1',
        title: 'New Post',
      });

      expect(postId).toBeDefined();
      const state = useBlogStore.getState();
      expect(state.posts).toHaveLength(1);
    });

    it('should create a child post', async () => {
      useBlogStore.setState({
        posts: [{
          id: 'parent-post',
          user_id: 'user-1',
          title: 'Parent',
          parent_id: null,
          content: null,
          published: false,
          position: null,
          icon: null,
          cover: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          children: [],
        }],
      });

      const childPost = {
        id: 'child-post',
        user_id: 'user-1',
        parent_id: 'parent-post',
        title: 'Child',
        content: null,
        published: false,
      };

      // Mock fetch for API call
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: childPost }),
      });

      await useBlogStore.getState().createPost({
        user_id: 'user-1',
        parent_id: 'parent-post',
        title: 'Child',
      });

      const state = useBlogStore.getState();
      expect(state.posts[0].children).toHaveLength(1);
      expect(state.posts[0].children?.[0].title).toBe('Child');
    });
  });

  describe('updatePostContent', () => {
    it('should update post content', async () => {
      useBlogStore.setState({
        posts: [{
          id: 'post-1',
          user_id: 'user-1',
          title: 'Original',
          parent_id: null,
          content: null,
          published: false,
          position: null,
          icon: null,
          cover: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          children: [],
        }],
      });

      const updatedPost = {
        id: 'post-1',
        user_id: 'user-1',
        title: 'Updated',
        content: { blocks: [] },
        updated_at: new Date().toISOString(),
      };

      (mockSupabase as any).from = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
              data: [updatedPost],
              error: null,
            }),
          }),
        }),
      });

      // Mock fetch for API call
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: updatedPost }),
      });

      await useBlogStore.getState().updatePostContent('post-1', {
        title: 'Updated',
        content: { blocks: [] } as any,
      });

      const state = useBlogStore.getState();
      expect(state.posts[0].title).toBe('Updated');
    });
  });

  describe('deletePostContent', () => {
    it('should delete a post', async () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      useBlogStore.setState({
        posts: [{
          id: validUuid,
          user_id: 'user-1',
          title: 'To Delete',
          parent_id: null,
          content: null,
          published: false,
          position: null,
          icon: null,
          cover: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          children: [],
        }],
      });

      // Mock fetch for API call
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: validUuid } }),
      });

      await useBlogStore.getState().deletePostContent(validUuid);

      const state = useBlogStore.getState();
      expect(state.posts).toHaveLength(0);
    });

    it('should reject invalid UUID', async () => {
      await expect(
        useBlogStore.getState().deletePostContent('invalid-id')
      ).rejects.toThrow('Invalid UUID');
    });
  });
});
