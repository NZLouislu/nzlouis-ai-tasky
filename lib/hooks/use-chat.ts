import { useState } from "react";

interface Message {
  id: string;
  content: string | { text: string; image?: string };
  role: string;
  timestamp: string;
}

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  const appendMessage = (message: Message) => {
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
  };

  return {
    messages,
    appendMessage,
  };
};
