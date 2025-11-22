import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useChatStore } from '@/lib/store/chat-store';

describe('Chat Store Pagination Support', () => {
  beforeEach(() => {
    const store = useChatStore.getState();
    store.clearContextMessages('test-post-1');
  });

  it('should initialize pagination metadata correctly', () => {
    useChatStore.getState().setChatMeta('test-post-1', {
      lastFetched: Date.now(),
      isStale: false,
      totalCount: 100,
      hasMore: true,
      currentOffset: 50,
      isLoadingMore: false,
    });

    const meta = useChatStore.getState().contextChatsMeta['test-post-1'];
    expect(meta.totalCount).toBe(100);
    expect(meta.hasMore).toBe(true);
    expect(meta.currentOffset).toBe(50);
    expect(meta.isLoadingMore).toBe(false);
  });

  it('should track loading more state', () => {
    useChatStore.getState().setChatMeta('test-post-1', {
      lastFetched: Date.now(),
      isStale: false,
      totalCount: 100,
      hasMore: true,
      currentOffset: 50,
      isLoadingMore: false,
    });

    expect(useChatStore.getState().contextChatsMeta['test-post-1'].isLoadingMore).toBe(false);

    useChatStore.getState().setChatMeta('test-post-1', {
      ...useChatStore.getState().contextChatsMeta['test-post-1'],
      isLoadingMore: true,
    });

    expect(useChatStore.getState().contextChatsMeta['test-post-1'].isLoadingMore).toBe(true);
  });

  it('should update offset after loading more messages', () => {
    useChatStore.getState().setChatMeta('test-post-1', {
      lastFetched: Date.now(),
      isStale: false,
      totalCount: 150,
      hasMore: true,
      currentOffset: 50,
      isLoadingMore: false,
    });

    const newOffset = 100;
    useChatStore.getState().setChatMeta('test-post-1', {
      ...useChatStore.getState().contextChatsMeta['test-post-1'],
      currentOffset: newOffset,
      hasMore: newOffset < 150,
    });

    const meta = useChatStore.getState().contextChatsMeta['test-post-1'];
    expect(meta.currentOffset).toBe(100);
    expect(meta.hasMore).toBe(true);
  });

  it('should mark hasMore as false when all messages loaded', () => {
    useChatStore.getState().setChatMeta('test-post-1', {
      lastFetched: Date.now(),
      isStale: false,
      totalCount: 100,
      hasMore: true,
      currentOffset: 50,
      isLoadingMore: false,
    });

    useChatStore.getState().setChatMeta('test-post-1', {
      ...useChatStore.getState().contextChatsMeta['test-post-1'],
      currentOffset: 100,
      hasMore: false,
    });

    const meta = useChatStore.getState().contextChatsMeta['test-post-1'];
    expect(meta.hasMore).toBe(false);
    expect(meta.currentOffset).toBe(100);
  });

  it('should persist pagination metadata to localStorage', () => {
    const testMessages = [
      {
        id: '1',
        role: 'user' as const,
        content: 'Hello',
        timestamp: new Date(),
      },
    ];

    useChatStore.getState().setContextMessages('test-post-1', testMessages);
    useChatStore.getState().setChatMeta('test-post-1', {
      lastFetched: Date.now(),
      isStale: false,
      totalCount: 100,
      hasMore: true,
      currentOffset: 50,
      isLoadingMore: false,
    });

    const persistedData = localStorage.getItem('chat-storage');
    expect(persistedData).toBeTruthy();
    
    if (persistedData) {
      const parsed = JSON.parse(persistedData);
      expect(parsed.state.contextChatsMeta['test-post-1']).toBeDefined();
      expect(parsed.state.contextChatsMeta['test-post-1'].currentOffset).toBe(50);
      expect(parsed.state.contextChatsMeta['test-post-1'].hasMore).toBe(true);
    }
  });
});
