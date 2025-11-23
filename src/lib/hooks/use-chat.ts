import { useState, useEffect, useCallback } from "react";
import { useChatStore, Message } from "@/lib/store/chat-store";

interface UseChatOptions {
  postId?: string;
  documentId?: string;
  userId?: string;
  enablePersistence?: boolean;
  apiEndpoint?: 'blog' | 'stories';
}

export const useChat = (options?: UseChatOptions) => {
  const { postId, documentId, userId, enablePersistence = true, apiEndpoint = 'blog' } = options || {};
  
  const { 
    contextChats, 
    setContextMessages, 
    addContextMessage, 
    clearContextMessages,
    setChatMeta,
    isCacheValid,
    setLoadingState,
    getLoadingState
  } = useChatStore();
  
  const [isLoading, setIsLoading] = useState(false);

  const entityId = postId || documentId;
  const entityParam = apiEndpoint === 'stories' ? 'documentId' : 'postId';
  const apiBase = `/api/${apiEndpoint}/chat-messages`;

  const messages = entityId ? (contextChats[entityId] || []) : [];
  const loadingState = entityId ? getLoadingState(entityId) : 'idle';
  const chatMeta = entityId ? useChatStore.getState().contextChatsMeta[entityId] : undefined;

  const loadMessages = useCallback(async (loadMore = false) => {
    if (!entityId || !enablePersistence) {
      return;
    }

    const cachedMessages = contextChats[entityId];
    const cacheIsValid = isCacheValid(entityId);
    const currentMeta = useChatStore.getState().contextChatsMeta[entityId];
    
    if (!loadMore && cacheIsValid) {
      console.log('Using cached chat messages');
      return;
    }

    if (loadingState === 'loading' || currentMeta?.isLoadingMore) {
      return;
    }

    const offset = loadMore ? (currentMeta?.currentOffset || 0) : 0;
    const limit = 50;

    if (loadMore) {
      setChatMeta(entityId, {
        ...currentMeta!,
        isLoadingMore: true,
      });
    } else {
      setLoadingState(entityId, 'loading');
      if (messages.length === 0) {
        setIsLoading(true);
      }
    }

    try {
      const response = await fetch(
        `${apiBase}?${entityParam}=${entityId}&limit=${limit}&offset=${offset}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json();
      const loadedMessages: Message[] = (data.messages || []).map((msg: any) => {
        let content = '';
        let image = undefined;

        if (typeof msg.content === 'string') {
          content = msg.content;
        } else if (typeof msg.content === 'object') {
          content = msg.content.text || '';
          image = msg.content.image;
        }

        return {
          id: msg.id,
          role: msg.role,
          content: content,
          image: image,
          timestamp: new Date(msg.timestamp),
        };
      });

      if (loadMore) {
        setContextMessages(entityId, [...loadedMessages, ...cachedMessages]);
      } else {
        setContextMessages(entityId, loadedMessages);
      }
      
      setChatMeta(entityId, {
        lastFetched: Date.now(),
        isStale: false,
        totalCount: data.total || loadedMessages.length,
        hasMore: data.hasMore || false,
        currentOffset: offset + loadedMessages.length,
        isLoadingMore: false,
      });
      
      if (!loadMore) {
        setLoadingState(entityId, 'success');
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
      setLoadingState(entityId, 'error');
      if (loadMore && currentMeta) {
        setChatMeta(entityId, {
          ...currentMeta,
          isLoadingMore: false,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    entityId, 
    enablePersistence, 
    apiBase, 
    entityParam, 
    setContextMessages, 
    contextChats, 
    isCacheValid,
    setChatMeta,
    setLoadingState,
    loadingState,
    messages.length
  ]);

  const loadMoreMessages = useCallback(async () => {
    await loadMessages(true);
  }, [loadMessages]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const saveMessage = useCallback(async (message: Message) => {
    if (!entityId || !userId || !enablePersistence) {
      return;
    }

    try {
      const body: any = {
        userId,
        role: message.role,
        content: message.content, // Send as string
        timestamp: message.timestamp,
      };
      
      // If image exists, we might need to send it. 
      // Adapting to what the API likely expects based on previous code
      if (message.image) {
        body.content = {
          text: message.content,
          image: message.image
        };
      }

      if (apiEndpoint === 'stories') {
        body.documentId = entityId;
      } else {
        body.postId = entityId;
      }

      await fetch(apiBase, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      console.error('Error saving chat message:', error);
    }
  }, [entityId, userId, enablePersistence, apiBase, apiEndpoint]);

  const appendMessage = useCallback((message: Message) => {
    if (entityId) {
      addContextMessage(entityId, message);
      saveMessage(message);
    }
  }, [entityId, addContextMessage, saveMessage]);

  const clearMessages = useCallback(async () => {
    if (!entityId || !enablePersistence) {
      return;
    }

    try {
      await fetch(`${apiBase}?${entityParam}=${entityId}`, {
        method: 'DELETE',
      });
      clearContextMessages(entityId);
    } catch (error) {
      console.error('Error clearing chat messages:', error);
    }
  }, [entityId, enablePersistence, apiBase, entityParam, clearContextMessages]);

  const updateLastMessage = useCallback((content: string) => {
    if (entityId) {
      useChatStore.getState().updateContextLastMessage(entityId, content);
    }
  }, [entityId]);

  return {
    messages,
    appendMessage,
    updateLastMessage,
    clearMessages,
    isLoading,
    loadMessages,
    loadingState,
    loadMoreMessages,
    hasMore: chatMeta?.hasMore || false,
    isLoadingMore: chatMeta?.isLoadingMore || false,
    saveMessage,
  };
};
