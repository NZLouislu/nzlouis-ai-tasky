import { useState, useEffect } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const MAX_HISTORY = 10;
const STORAGE_KEY = 'blog-ai-chat-history';

export function useChatHistory() {
  const [history, setHistory] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    }
  }, []);

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    setHistory(prev => {
      const newHistory = [
        ...prev,
        { role, content, timestamp: Date.now() }
      ].slice(-MAX_HISTORY);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const getContextPrompt = (): string => {
    if (history.length === 0) return '';
    
    return `\n\n**Previous Conversation Context:**\n${history.map(msg => 
      `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`
    ).join('\n')}\n`;
  };

  return {
    history,
    addMessage,
    clearHistory,
    getContextPrompt,
  };
}
