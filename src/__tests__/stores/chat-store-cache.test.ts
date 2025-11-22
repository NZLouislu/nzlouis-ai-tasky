import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from '@/lib/store/chat-store';

describe('Chat Store Cache Optimization', () => {
  beforeEach(() => {
    const store = useChatStore.getState();
    store.clearContextMessages('test-post-1');
  });

  it('should mark cache as valid when recently fetched', () => {
    const store = useChatStore.getState();
    
    store.setChatMeta('test-post-1', {
      lastFetched: Date.now(),
      isStale: false,
      totalCount: 10,
      hasMore: false,
    });

    expect(store.isCacheValid('test-post-1')).toBe(true);
  });

  it('should mark cache as invalid after 5 minutes', () => {
    const store = useChatStore.getState();
    
    const sixMinutesAgo = Date.now() - (6 * 60 * 1000);
    store.setChatMeta('test-post-1', {
      lastFetched: sixMinutesAgo,
      isStale: false,
      totalCount: 10,
      hasMore: false,
    });

    expect(store.isCacheValid('test-post-1')).toBe(false);
  });

  it('should mark cache as invalid when stale flag is set', () => {
    const store = useChatStore.getState();
    
    store.setChatMeta('test-post-1', {
      lastFetched: Date.now(),
      isStale: true,
      totalCount: 10,
      hasMore: false,
    });

    expect(store.isCacheValid('test-post-1')).toBe(false);
  });

  it('should return false for non-existent cache', () => {
    const store = useChatStore.getState();
    expect(store.isCacheValid('non-existent-id')).toBe(false);
  });

  it('should track loading states correctly', () => {
    const store = useChatStore.getState();
    
    expect(store.getLoadingState('test-post-1')).toBe('idle');
    
    store.setLoadingState('test-post-1', 'loading');
    expect(store.getLoadingState('test-post-1')).toBe('loading');
    
    store.setLoadingState('test-post-1', 'success');
    expect(store.getLoadingState('test-post-1')).toBe('success');
  });

  it('should persist cache metadata to localStorage', () => {
    const store = useChatStore.getState();
    
    const testMessages = [
      {
        id: '1',
        role: 'user' as const,
        content: 'Hello',
        timestamp: new Date(),
      },
    ];

    store.setContextMessages('test-post-1', testMessages);
    store.setChatMeta('test-post-1', {
      lastFetched: Date.now(),
      isStale: false,
      totalCount: 1,
      hasMore: false,
    });

    const persistedData = localStorage.getItem('chat-storage');
    expect(persistedData).toBeTruthy();
    
    if (persistedData) {
      const parsed = JSON.parse(persistedData);
      expect(parsed.state.contextChats['test-post-1']).toBeDefined();
      expect(parsed.state.contextChatsMeta['test-post-1']).toBeDefined();
    }
  });
});
