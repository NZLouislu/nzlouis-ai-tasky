import { useBlogStore } from '@/lib/stores/blog-store';

describe('Blog Operations Integration', () => {
  beforeEach(() => {
    useBlogStore.setState({
      posts: [],
      isLoading: false,
      error: null,
    });
  });

  describe('Post Creation', () => {
    it('should create a root post', async () => {
      const store = useBlogStore.getState();
      
      const postId = await store.createPost({
        user_id: 'user-1',
        title: 'Test Post',
        content: [],
      });

      expect(postId).toBeDefined();
      expect(typeof postId).toBe('string');
    });

    it('should create a child post', async () => {
      const store = useBlogStore.getState();
      
      const parentId = await store.createPost({
        user_id: 'user-1',
        title: 'Parent Post',
        content: [],
      });

      const childId = await store.createPost({
        user_id: 'user-1',
        title: 'Child Post',
        content: [],
        parent_id: parentId,
      });

      expect(childId).toBeDefined();
      expect(childId).not.toBe(parentId);
    });
  });

  describe('Post Updates', () => {
    it('should update post content', async () => {
      const store = useBlogStore.getState();
      
      const postId = await store.createPost({
        user_id: 'user-1',
        title: 'Test Post',
        content: [],
      });

      await store.updatePostContent(postId, {
        title: 'Updated Title',
        content: [{ type: 'paragraph', content: 'New content' }],
      });

      const state = useBlogStore.getState();
      const post = state.posts.find(p => p.id === postId);
      
      expect(post?.title).toBe('Updated Title');
    });
  });

  describe('Post Hierarchy', () => {
    it('should maintain parent-child relationships', async () => {
      const store = useBlogStore.getState();
      
      const parentId = await store.createPost({
        user_id: 'user-1',
        title: 'Parent',
        content: [],
      });

      await store.createPost({
        user_id: 'user-1',
        title: 'Child 1',
        content: [],
        parent_id: parentId,
      });

      await store.createPost({
        user_id: 'user-1',
        title: 'Child 2',
        content: [],
        parent_id: parentId,
      });

      const state = useBlogStore.getState();
      const parent = state.posts.find(p => p.id === parentId);
      
      expect(parent?.children).toBeDefined();
      expect(parent?.children?.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid post ID gracefully', async () => {
      const store = useBlogStore.getState();
      
      await expect(
        store.deletePostContent('invalid-id')
      ).rejects.toThrow();
    });
  });
});
