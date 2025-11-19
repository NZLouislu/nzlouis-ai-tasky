import { useState, useEffect, useCallback } from "react";

interface Message {
  id: string;
  content: string | { text: string; image?: string };
  role: string;
  timestamp: string;
}

interface UseChatOptions {
  postId?: string;
  documentId?: string;
  userId?: string;
  enablePersistence?: boolean;
  apiEndpoint?: 'blog' | 'stories';
}

export const useChat = (options?: UseChatOptions) => {
  const { postId, documentId, userId, enablePersistence = true, apiEndpoint = 'blog' } = options || {};
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const entityId = postId || documentId;
  const entityParam = apiEndpoint === 'stories' ? 'documentId' : 'postId';
  const apiBase = `/api/${apiEndpoint}/chat-messages`;

  const loadMessages = useCallback(async () => {
    if (!entityId || !enablePersistence) {
      setMessages([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${apiBase}?${entityParam}=${entityId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json();
      const loadedMessages: Message[] = (data.messages || []).map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        timestamp: msg.timestamp,
      }));

      setMessages(loadedMessages);
    } catch (error) {
      console.error('Error loading chat messages:', error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [entityId, enablePersistence, apiBase, entityParam]);

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
        content: message.content,
        timestamp: message.timestamp,
      };

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
    setMessages((prev) => {
      const existingIndex = prev.findIndex((m) => m.id === message.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = message;
        return updated;
      } else {
        return [...prev, message];
      }
    });

    saveMessage(message);
  }, [saveMessage]);

  const clearMessages = useCallback(async () => {
    if (!entityId || !enablePersistence) {
      setMessages([]);
      return;
    }

    try {
      await fetch(`${apiBase}?${entityParam}=${entityId}`, {
        method: 'DELETE',
      });
      setMessages([]);
    } catch (error) {
      console.error('Error clearing chat messages:', error);
    }
  }, [entityId, enablePersistence, apiBase, entityParam]);

  return {
    messages,
    appendMessage,
    clearMessages,
    isLoading,
    loadMessages,
  };
};
