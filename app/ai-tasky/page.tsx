'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import { Send, Plus, MessageSquare, Settings, Paperclip } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';

interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  timestamp: Date;
}

export default function AITaskyPage() {
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarOpen] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle paste event for screenshots
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // Check if the item is an image
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            console.log('Screenshot pasted:', file.type, file.size);
            handleImageUpload(file);
          }
          break;
        }
      }
    };

    // Add paste event listener to document
    document.addEventListener('paste', handlePaste);
    
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !previewImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      image: previewImage || undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    const currentImage = previewImage;
    setInput('');
    setPreviewImage(null);
    setIsLoading(true);

    try {
      const chatMessages = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        ...(msg.image && { image: msg.image }),
      }));

      chatMessages.push({
        role: 'user',
        content: currentInput,
        ...(currentImage && { image: currentImage }),
      });

      // Use vision API if any message has an image
      const hasImages = chatMessages.some(m => m.image);
      const apiEndpoint = hasImages ? '/api/chat-vision' : '/api/chat';
      
      console.log('Using API:', apiEndpoint, 'Has images:', hasImages);
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: chatMessages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          setIsLoading(false);
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (line.startsWith('0:')) {
            try {
              const jsonStr = line.substring(2);
              const text = JSON.parse(jsonStr);
              assistantMessage.content += text;
              setMessages((prev) => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.role === 'assistant') {
                  lastMessage.content = assistantMessage.content;
                }
                return newMessages;
              });
            } catch (error) {
              console.log('Parsing error:', error);
            }
          }
        }

        buffer = lines[lines.length - 1];
      }
    } catch (error) {
      console.error('Error:', error);
      setIsLoading(false);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  // Load sessions
  useEffect(() => {
    if (session?.user) {
      loadSessions();
    }
  }, [session]);

  const loadSessions = async () => {
    try {
      const res = await fetch('/api/chat-sessions');
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const createNewSession = async () => {
    try {
      const res = await fetch('/api/chat-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Chat',
          provider: 'google',
          model: 'gemini-2.5-flash',
        }),
      });
      const data = await res.json();
      setCurrentSessionId(data.session.id);
      await loadSessions();
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden pt-16">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <button
              onClick={createNewSession}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-2"
            >
              <Plus size={20} />
              New Chat
            </button>
            <Link
              href="/ai-tasky/settings"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <Settings size={20} />
              Settings
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {sessions.map((sess) => (
              <button
                key={sess.id}
                onClick={() => setCurrentSessionId(sess.id)}
                className={`w-full text-left px-3 py-2 rounded-lg mb-1 flex items-center gap-2 ${
                  currentSessionId === sess.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'hover:bg-gray-100'
                }`}
              >
                <MessageSquare size={16} />
                <span className="truncate">{sess.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header - Fixed at top */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <h1 className="text-2xl font-bold text-gray-800">AI Tasky</h1>
        </div>

        {/* Messages - Scrollable area */}
        <div className="flex-1 overflow-y-auto chatbot-scrollbar">
          <div className="max-w-[900px] mx-auto p-6">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-20">
                <h2 className="text-xl font-semibold mb-2">Welcome to AI Tasky</h2>
                <p>Start a conversation by typing a message below.</p>
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex mb-4 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white max-w-[85%]'
                      : 'bg-white border border-gray-200 w-full'
                  }`}
                >
                  {message.image && (
                    <div className="mb-2">
                      <Image
                        src={message.image}
                        alt="Uploaded image"
                        width={300}
                        height={200}
                        className="rounded-lg max-w-full h-auto"
                      />
                    </div>
                  )}
                  {message.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 w-full">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                    </div>
                    <span className="text-sm text-blue-600">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input - Fixed at bottom */}
        <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
          <div className="max-w-[900px] mx-auto">
            {previewImage && (
              <div className="mb-3 relative inline-block">
                <Image
                  src={previewImage}
                  alt="Preview"
                  width={120}
                  height={120}
                  className="rounded-lg"
                />
                <button
                  onClick={() => setPreviewImage(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="relative border-2 border-blue-500 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                >
                  <Paperclip size={20} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      handleImageUpload(e.target.files[0]);
                    }
                  }}
                  accept="image/*"
                  className="hidden"
                />
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message... (Ctrl+V to paste screenshot)"
                  className="w-full resize-none border-0 pl-12 pr-16 py-3 focus:outline-none focus:ring-0"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (input.trim() || previewImage) {
                        handleSubmit(e);
                      }
                    }
                  }}
                  style={{ minHeight: '52px', maxHeight: '200px' }}
                />
                <button
                  type="submit"
                  disabled={!input.trim() && !previewImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-teal-500 text-white rounded-full p-2 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
