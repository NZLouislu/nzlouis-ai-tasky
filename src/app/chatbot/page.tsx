'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, MessageSquare, Settings, Edit2, Trash2, Search } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';
import ChatInput from '@/components/ChatInput';

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

interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  tested?: boolean;
  working?: boolean;
}

export default function ChatbotPage() {
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [draftMessage, setDraftMessage] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        const response = await fetch('/api/admin/verify', {
          credentials: 'include'
        });
        
        if (response.ok) {
          console.log('[Chatbot] Admin session detected');
          setIsAdmin(true);
        }
      } catch (error) {
        console.log('[Chatbot] No admin session');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAdminSession();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!isCheckingAuth && (session?.user || isAdmin)) {
      loadAvailableModels();
    }
  }, [session, isAdmin, isCheckingAuth]);

  useEffect(() => {
    const savedDraft = localStorage.getItem('chatbot-draft');
    if (savedDraft) {
      setDraftMessage(savedDraft);
      setInput(savedDraft);
    }
  }, []);

  useEffect(() => {
    if (input.trim()) {
      localStorage.setItem('chatbot-draft', input);
      setDraftMessage(input);
      setHasUnsavedChanges(true);
    } else {
      localStorage.removeItem('chatbot-draft');
      setDraftMessage('');
      setHasUnsavedChanges(false);
    }
  }, [input]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && input.trim()) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, input]);

  const handleImageUpload = useCallback(async (file: File) => {
    if (file && file.type.startsWith('image/')) {
      try {
        setIsLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('entityType', 'chat_message');
        formData.append('entityId', currentSessionId || 'temp');

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          throw new Error('Upload failed');
        }

        const data = await res.json();
        setPreviewImage(data.publicUrl);
      } catch (error) {
        console.error('Image upload failed:', error);
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } finally {
        setIsLoading(false);
      }
    }
  }, [currentSessionId]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

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

    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handleImageUpload]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadAvailableModels = async () => {
    try {
      const res = await fetch('/api/ai-models');
      const data = await res.json();

      if (data.models && data.models.length > 0) {
        const sortedModels = data.models.sort((a: AIModel, b: AIModel) => {
          if (a.provider === 'google' && b.provider !== 'google') return -1;
          if (a.provider !== 'google' && b.provider === 'google') return 1;
          return 0;
        });

        setAvailableModels(sortedModels);
        
        if (sortedModels.length > 0) {
          const firstProvider = sortedModels[0].provider;
          setSelectedProvider(firstProvider);
          setSelectedModel(sortedModels[0].id);
        }
      } else {
        setAvailableModels([]);
        setSelectedModel('');
        setSelectedProvider('');
      }
    } catch (error) {
      console.error('Failed to load AI models:', error);
      setAvailableModels([]);
    }
  };

  const getAvailableProviders = () => {
    const providers = new Set(availableModels.map(m => m.provider));
    return Array.from(providers);
  };

  const getModelsForProvider = (provider: string) => {
    return availableModels.filter(m => m.provider === provider);
  };

  const getProviderName = (provider: string) => {
    const names: Record<string, string> = {
      'google': 'Google Gemini',
      'openai': 'OpenAI',
      'anthropic': 'Anthropic Claude',
      'openrouter': 'OpenRouter',
      'kilo': 'Kilo'
    };
    return names[provider] || provider;
  };

  const generateSessionTitle = (firstMessage: string) => {
    const cleanMessage = firstMessage.trim();
    if (cleanMessage.length <= 50) {
      return cleanMessage;
    }
    
    const words = cleanMessage.split(' ');
    let title = '';
    for (const word of words) {
      if ((title + ' ' + word).length <= 50) {
        title += (title ? ' ' : '') + word;
      } else {
        break;
      }
    }
    return title || 'New Chat';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !previewImage) return;
    if (!selectedModel) return;

    let sessionId = currentSessionId;

    if (!sessionId) {
      try {
        const res = await fetch('/api/chat-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: generateSessionTitle(input),
            provider: selectedProvider || 'google',
            model: selectedModel,
          }),
        });
        const data = await res.json();
        sessionId = data.session.id;
        setCurrentSessionId(sessionId);
        await loadSessions();
      } catch (error) {
        console.error('Failed to create auto session:', error);
      }
    }

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
    setHasUnsavedChanges(false);
    localStorage.removeItem('chatbot-draft');

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

      const hasImages = chatMessages.some(m => m.image);
      const apiEndpoint = hasImages ? '/api/chat-vision' : '/api/chat';

      console.log('Using API:', apiEndpoint, 'Has images:', hasImages, 'Model:', selectedModel);

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: chatMessages,
          modelId: selectedModel,
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

      let accumulatedContent = '';
      let pendingUpdate = false;
      let animationFrameId: number | null = null;

      const updateMessage = () => {
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === 'assistant') {
            lastMessage.content = accumulatedContent;
          }
          return newMessages;
        });
        pendingUpdate = false;
        animationFrameId = null;
      };

      const scheduleUpdate = () => {
        if (!pendingUpdate) {
          pendingUpdate = true;
          animationFrameId = requestAnimationFrame(updateMessage);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
          }
          updateMessage();
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
              accumulatedContent += text;
              scheduleUpdate();
            } catch (error) {
              console.log('Parsing error:', error);
            }
          }
        }

        buffer = lines[lines.length - 1];
      }

      // Check if assistant message is empty and provide fallback
      if (!assistantMessage.content.trim()) {
        console.error('Assistant message is empty, providing fallback response');
        assistantMessage.content = 'Sorry, I encountered an issue generating a response. Please try again.';
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === 'assistant') {
            lastMessage.content = assistantMessage.content;
          }
          return newMessages;
        });
      }

      if (sessionId) {
        await saveMessages(sessionId, [userMessage, assistantMessage]);
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

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/chat-sessions');
      const data = await res.json();
      setSessions(data.sessions || []);

      if (data.sessions && data.sessions.length > 0 && !currentSessionId) {
        setCurrentSessionId(data.sessions[0].id);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  }, [currentSessionId]);

  useEffect(() => {
    if (!isCheckingAuth && (session?.user || isAdmin)) {
      loadSessions();
    }
  }, [session, isAdmin, isCheckingAuth, loadSessions]);

  useEffect(() => {
    if (currentSessionId) {
      loadSessionMessages(currentSessionId);
    }
  }, [currentSessionId]);

  const loadSessionMessages = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/chat-sessions/${sessionId}`);
      const data = await res.json();

      if (data.session && data.session.messages) {
        interface DbMessage {
          id: string;
          role: string;
          content: string;
          image_url?: string;
          created_at: string;
        }
        const loadedMessages: Message[] = data.session.messages.map((msg: DbMessage) => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          image: msg.image_url || undefined,
          timestamp: new Date(msg.created_at),
        }));
        setMessages(loadedMessages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    }
  };

  const saveMessages = async (sessionId: string, messagesToSave: Message[]) => {
    try {
      await fetch(`/api/chat-sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesToSave.map(msg => ({
            role: msg.role,
            content: msg.content,
            imageUrl: msg.image,
          })),
        }),
      });
    } catch (error) {
      console.error('Failed to save messages:', error);
    }
  };

  const createNewSession = async () => {
    try {
      const res = await fetch('/api/chat-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Chat',
          provider: selectedProvider || 'google',
          model: selectedModel || 'gemini-2.5-flash',
        }),
      });
      const data = await res.json();
      setCurrentSessionId(data.session.id);
      setMessages([]);
      setInput('');
      setPreviewImage(null);
      setHasUnsavedChanges(false);
      localStorage.removeItem('chatbot-draft');
      await loadSessions();
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const switchSession = (sessionId: string) => {
    if (hasUnsavedChanges && input.trim()) {
      const confirmSwitch = window.confirm('You have unsaved changes. Are you sure you want to switch sessions?');
      if (!confirmSwitch) return;
    }
    setCurrentSessionId(sessionId);
    setInput('');
    setPreviewImage(null);
    setHasUnsavedChanges(false);
    localStorage.removeItem('chatbot-draft');
  };

  const renameSession = async (sessionId: string, newTitle: string) => {
    try {
      await fetch(`/api/chat-sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
      setSessions(sessions.map(s =>
        s.id === sessionId ? { ...s, title: newTitle } : s
      ));
      setEditingSessionId(null);
    } catch (error) {
      console.error('Failed to rename session:', error);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to delete this chat session?')) {
      return;
    }

    try {
      await fetch(`/api/chat-sessions/${sessionId}`, {
        method: 'DELETE',
      });
      setSessions(sessions.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        const remaining = sessions.filter(s => s.id !== sessionId);
        setCurrentSessionId(remaining.length > 0 ? remaining[0].id : null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const filteredSessions = sessions.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden pt-16">
      {isMobile && !sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-4 top-20 z-30 bg-white p-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors border border-gray-200"
          title="Show Sidebar"
        >
          <MessageSquare size={24} className="text-gray-700" />
        </button>
      )}

      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {sidebarOpen && (
        <div className={`bg-white border-r border-gray-200 flex flex-col flex-shrink-0 ${isMobile
          ? 'fixed left-0 top-16 bottom-0 w-64 z-50'
          : 'w-64'
          }`}>
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            {isMobile && (
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
                  title="Close Sidebar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <button
              onClick={createNewSession}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-2"
            >
              <Plus size={20} />
              New Chat
            </button>
            <Link
              href="/chatbot/settings"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <Settings size={20} />
              Settings
            </Link>
          </div>
          <div className="px-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {sessions.length === 0 && (
              <div className="text-center text-gray-500 text-sm p-4">
                No chat sessions yet. Create one to get started!
              </div>
            )}
            {filteredSessions.map((sess) => (
              <div
                key={sess.id}
                className={`group relative rounded-lg mb-1 ${currentSessionId === sess.id
                  ? 'bg-blue-50'
                  : 'hover:bg-gray-100'
                  }`}
              >
                {editingSessionId === sess.id ? (
                  <div className="px-3 py-2">
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={() => renameSession(sess.id, editingTitle)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          renameSession(sess.id, editingTitle);
                        } else if (e.key === 'Escape') {
                          setEditingSessionId(null);
                        }
                      }}
                      autoFocus
                      className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none"
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => switchSession(sess.id)}
                    className="w-full text-left px-3 py-2 flex items-center gap-2"
                  >
                    <MessageSquare size={16} className={currentSessionId === sess.id ? 'text-blue-600' : ''} />
                    <span className={`truncate flex-1 ${currentSessionId === sess.id ? 'text-blue-600' : ''}`}>
                      {sess.title}
                    </span>
                  </button>
                )}
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingSessionId(sess.id);
                      setEditingTitle(sess.title);
                    }}
                    className="p-1 hover:bg-gray-200 rounded"
                    title="Rename"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(sess.id);
                    }}
                    className="p-1 hover:bg-red-100 text-red-600 rounded"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex-shrink-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Chatbot</h1>
        </div>

        <div className="flex-1 overflow-y-auto chatbot-scrollbar">
          <div className="max-w-[900px] mx-auto p-4 sm:p-6">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-20">
                <h2 className="text-xl font-semibold mb-2">Welcome to AI Tasky</h2>
                <p>Start a conversation by typing a message below.</p>
                {draftMessage && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md mx-auto">
                    <p className="text-sm text-yellow-700 mb-2">Draft message recovered:</p>
                    <p className="text-sm text-gray-600 italic">"{draftMessage.substring(0, 100)}{draftMessage.length > 100 ? '...' : ''}"</p>
                  </div>
                )}
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex mb-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
              >
                <div
                  className={`rounded-2xl px-4 py-3 ${message.role === 'user'
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
                      {isLoading && messages[messages.length - 1].id === message.id && (
                        <span className="inline-block w-1 h-4 bg-blue-600 ml-1 animate-pulse" />
                      )}
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

        <ChatInput
          input={input}
          setInput={setInput}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          previewImage={previewImage}
          setPreviewImage={setPreviewImage}
          onImageUpload={handleImageUpload}
          availableModels={availableModels}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          selectedProvider={selectedProvider}
          setSelectedProvider={setSelectedProvider}
          isMobile={isMobile}
        />
      </div>
    </div>
  );
}