import { useState } from 'react';

interface Message {
  id: string;
  content: string;
  role: string;
  timestamp: string;
}

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  
  const appendMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };
  
  return {
    messages,
    appendMessage
  };
};