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
  
  const { contextChats, setContextMessages, addContextMessage, clearContextMessages } = useChatStore();
  const [isLoading, setIsLoading] = useState(false);

  const entityId = postId || documentId;
  const entityParam = apiEndpoint === 'stories' ? 'documentId' : 'postId';
  const apiBase = `/api/${apiEndpoint}/chat-messages`;

  // Get messages from store, default to empty array
  const messages = entityId ? (contextChats[entityId] || []) : [];

  const loadMessages = useCallback(async () => {
    if (!entityId || !enablePersistence) {
      return;
    }

    // Only show loading if we don't have messages yet
    if (messages.length === 0) {
      setIsLoading(true);
    }

    try {
      const response = await fetch(`${apiBase}?${entityParam}=${entityId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json();
      const loadedMessages: Message[] = (data.messages || []).map((msg: any) => {
        // Handle both string and object content formats
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

      setContextMessages(entityId, loadedMessages);
    } catch (error) {
      console.error('Error loading chat messages:', error);
      // Don't clear messages on error to allow offline viewing of cached data
    } finally {
      setIsLoading(false);
    }
  }, [entityId, enablePersistence, apiBase, entityParam, setContextMessages, messages.length]);

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

  return {
    messages,
    appendMessage,
    clearMessages,
    isLoading,
    loadMessages,
  };
};
