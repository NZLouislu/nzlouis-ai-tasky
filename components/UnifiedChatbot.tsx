// UnifiedChatbot with optimized UI
'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PaperPlaneIcon } from '@radix-ui/react-icons';
import { useChat } from '@/lib/hooks/use-chat';
import { v4 as uuidv4 } from 'uuid';
import { sendChatMessage } from '@/lib/AssistantRuntime';
import { useAISettings } from '@/lib/useAISettings';
import { getApiKey } from '@/lib/apiKeyStorage';

interface Message {
  id: string;
  content: string;
  role: string;
  timestamp: string;
}

interface PageModification {
  type: string;
  target?: string;
  content?: string;
  title?: string;
}

interface UnifiedChatbotProps {
  mode: 'standalone' | 'workspace';
  onPageModification?: (mod: PageModification) => Promise<string>;
}

export default function UnifiedChatbot({ mode, onPageModification }: UnifiedChatbotProps) {
  const { messages, appendMessage } = useChat() as {
    messages: Message[];
    appendMessage: (message: Message) => void;
  };
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const { getCurrentModel } = useAISettings();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    const userMessage: Message = {
      id: uuidv4(),
      content: text,
      role: 'user',
      timestamp: new Date().toISOString(),
    };

    appendMessage(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      const currentModel = getCurrentModel();
      const reply = await sendChatMessage(
        text,
        undefined, // No image support in this version
        {
          systemPrompt: 'You are a helpful assistant',
          selectedModel: currentModel?.id || '',
          temperature: 0.7,
          maxTokens: 1000
        },
        getCurrentModel,
        getApiKey,
        onPageModification
      );

      appendMessage({
        id: uuidv4(),
        content: reply,
        role: 'assistant',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error:', error);
      appendMessage({
        id: uuidv4(),
        content: 'Sorry, something went wrong. Please try again.',
        role: 'assistant',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  }, [appendMessage, getCurrentModel, onPageModification]);

  return (
    <div className={`flex flex-col ${mode === 'standalone' ? 'h-full' : 'h-[500px]'} border rounded-lg overflow-hidden`}>
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 ${message.role === 'user' ? 'text-right' : ''}`}
          >
            <div
              className={`inline-block px-4 py-2 rounded-lg max-w-[80%] ${
                message.role === 'user'
                  ? 'bg-blue-100 text-blue-900'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t p-2 bg-white">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(input); }} className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
          <Button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            disabled={isLoading || !input.trim()}
          >
            <PaperPlaneIcon className="w-4 h-4 mr-1" />
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}