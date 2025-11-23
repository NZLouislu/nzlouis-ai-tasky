"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  MessageSquare,
  Settings,
  Edit2,
  Trash2,
  Search,
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import ChatInput from "@/components/ChatInput";
import {
  useChatStore,
  Message,
  ChatSession,
  AIModel,
} from "@/lib/store/chat-store";

export default function ChatbotPage() {
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Zustand Store
  const {
    sessions,
    currentSessionId,
    messages,
    availableModels,
    selectedModel,
    selectedProvider,
    sidebarOpen,
    isLoading,
    input,
    previewImages = [],
    setSessions,
    setCurrentSessionId,
    setMessages,
    addMessage,
    updateLastMessage,
    setAvailableModels,
    setSelectedModel,
    setSelectedProvider,
    setSidebarOpen,
    setIsLoading,
    setInput,
    setPreviewImages,
    clearCurrentChat,
    contextChats,
    setContextMessages,
    addContextMessage,
    updateContextLastMessage,
  } = useChatStore();

  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        const response = await fetch("/api/admin/verify", {
          credentials: "include",
        });

        if (response.ok) {
          console.log("[Chatbot] Admin session detected");
          setIsAdmin(true);
        }
      } catch (error) {
        console.log("[Chatbot] No admin session");
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
      // On desktop, sidebar should be open by default
      // On mobile/tablet, it should be closed
      if (!mobile) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [setSidebarOpen]);

  useEffect(() => {
    if (!isCheckingAuth && (session?.user || isAdmin)) {
      // Only load if empty to prevent flash, or could implement a background refresh
      if (availableModels.length === 0) {
        loadAvailableModels();
      }
    }
  }, [session, isAdmin, isCheckingAuth, availableModels.length]);

  useEffect(() => {
    if (input.trim()) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [input]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && input.trim()) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, input]);

  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageUpload = useCallback(
    async (files: FileList | null | File | File[]) => {
      if (!files) return;

      const fileList = files instanceof File ? [files] : Array.from(files);
      if (fileList.length === 0) return;

      setIsUploadingImage(true);

      try {
        const newImages: string[] = [];

        for (const file of fileList) {
          if (!file.type.startsWith("image/")) continue;

          const formData = new FormData();
          formData.append("file", file);
          formData.append("entityType", "chat_message");
          formData.append("entityId", currentSessionId || "temp");

          try {
            const res = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");

            const data = await res.json();
            const imageUrl = data.url || data.publicUrl;
            newImages.push(imageUrl);
          } catch (error) {
            console.error("Upload failed for file:", file.name, error);
            // Fallback to base64
            const reader = new FileReader();
            await new Promise<void>((resolve) => {
              reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                if (dataUrl) newImages.push(dataUrl);
                resolve();
              };
              reader.readAsDataURL(file);
            });
          }
        }

        if (newImages.length > 0) {
          setPreviewImages([...previewImages, ...newImages]);
        }
      } finally {
        setIsUploadingImage(false);
      }
    },
    [currentSessionId, previewImages, setPreviewImages]
  );

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf("image") !== -1) {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }

      if (files.length > 0) {
        e.preventDefault();
        console.log("Pasted images:", files.length);
        handleImageUpload(files);
      }
    };

    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [handleImageUpload]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadAvailableModels = async () => {
    try {
      const res = await fetch("/api/ai-models");
      const data = await res.json();

      if (data.models && data.models.length > 0) {
        const sortedModels = data.models.sort((a: AIModel, b: AIModel) => {
          if (a.provider === "google" && b.provider !== "google") return -1;
          if (a.provider !== "google" && b.provider === "google") return 1;
          return 0;
        });

        setAvailableModels(sortedModels);

        if (!selectedModel && sortedModels.length > 0) {
          const firstProvider = sortedModels[0].provider;
          setSelectedProvider(firstProvider);
          setSelectedModel(sortedModels[0].id);
        }
      } else {
        setAvailableModels([]);
        if (!selectedModel) {
          setSelectedModel("");
          setSelectedProvider("");
        }
      }
    } catch (error) {
      console.error("Failed to load AI models:", error);
      // Don't clear models on error if we have cached ones
      if (availableModels.length === 0) {
        setAvailableModels([]);
      }
    }
  };

  const getAvailableProviders = () => {
    const providers = new Set(availableModels.map((m) => m.provider));
    return Array.from(providers);
  };

  const getModelsForProvider = (provider: string) => {
    return availableModels.filter((m) => m.provider === provider);
  };

  const getProviderName = (provider: string) => {
    const names: Record<string, string> = {
      google: "Google Gemini",
      openai: "OpenAI",
      anthropic: "Anthropic Claude",
      openrouter: "OpenRouter",
      kilo: "Kilo",
    };
    return names[provider] || provider;
  };

  const generateSessionTitle = (firstMessage: string) => {
    const cleanMessage = firstMessage.trim();
    if (cleanMessage.length <= 50) {
      return cleanMessage;
    }

    const words = cleanMessage.split(" ");
    let title = "";
    for (const word of words) {
      if ((title + " " + word).length <= 50) {
        title += (title ? " " : "") + word;
      } else {
        break;
      }
    }
    return title || "New Chat";
  };

  const handleSubmit = async (text: string) => {
    if (!text.trim() && previewImages.length === 0) return;
    if (!selectedModel) return;

    let sessionId = currentSessionId;

    if (!sessionId) {
      try {
        const res = await fetch("/api/chat-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: generateSessionTitle(text),
            provider: selectedProvider || "google",
            model: selectedModel,
          }),
        });
        const data = await res.json();
        sessionId = data.session.id;
        setCurrentSessionId(sessionId);
        await loadSessions();
      } catch (error) {
        console.error("Failed to create auto session:", error);
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      images: previewImages.length > 0 ? previewImages : undefined,
      timestamp: new Date(),
    };

    addMessage(userMessage);
    if (sessionId) {
      addContextMessage(sessionId, userMessage);
    }
    const currentImages = [...previewImages];
    setPreviewImages([]);
    setIsLoading(true);
    setHasUnsavedChanges(false);

    try {
      const chatMessages = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        ...(msg.images && msg.images.length > 0
          ? { images: msg.images }
          : msg.image
            ? { images: [msg.image] }
            : {}),
      }));

      chatMessages.push({
        role: "user",
        content: text,
        ...(currentImages.length > 0 ? { images: currentImages } : {}),
      });

      const hasImages = chatMessages.some(
        (m) => m.images && m.images.length > 0
      );
      // Unified API endpoint for both text and vision
      const apiEndpoint = "/api/chat";

      console.log(
        "Using API:",
        apiEndpoint,
        "Has images:",
        hasImages,
        "Model:",
        selectedModel
      );

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: chatMessages,
          modelId: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from AI");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No reader available");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      addMessage(assistantMessage);
      if (sessionId) {
        addContextMessage(sessionId, assistantMessage);
      }

      let accumulatedContent = "";
      let pendingUpdate = false;
      let animationFrameId: number | null = null;

      const updateMessage = () => {
        updateLastMessage(accumulatedContent);
        if (sessionId) {
          updateContextLastMessage(sessionId, accumulatedContent);
        }
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
        const lines = buffer.split("\n");

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (line.startsWith("0:")) {
            try {
              const jsonStr = line.substring(2);
              const text = JSON.parse(jsonStr);
              accumulatedContent += text;
              scheduleUpdate();
            } catch (error) {
              console.log("Parsing error:", error);
            }
          }
        }

        buffer = lines[lines.length - 1];
      }

      // Save messages to database
      if (sessionId) {
        // Prepare messages for saving - ensure images are handled correctly
        const messagesToSave = [
          ...messages,
          userMessage,
          { ...assistantMessage, content: accumulatedContent },
        ];

        await fetch(`/api/chat-sessions/${sessionId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: messagesToSave.map((msg) => ({
              role: msg.role,
              content: msg.content,
              images: msg.images || (msg.image ? [msg.image] : undefined),
            })),
          }),
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      setIsLoading(false);
      updateLastMessage("Sorry, I encountered an error. Please try again.");
    }
  };

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/chat-sessions");
      const data = await res.json();
      const newSessions = data.sessions || [];
      setSessions(newSessions);

      // If we have a current session ID but it's not in the new list,
      // or if we don't have a session ID but we have sessions,
      // we need to update the current session.
      if (
        currentSessionId &&
        !newSessions.find((s: ChatSession) => s.id === currentSessionId)
      ) {
        // Current session no longer exists
        if (newSessions.length > 0) {
          setCurrentSessionId(newSessions[0].id);
        } else {
          setCurrentSessionId(null);
          setMessages([]);
        }
      } else if (!currentSessionId && newSessions.length > 0) {
        // No current session selected, select the first one
        setCurrentSessionId(newSessions[0].id);
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
    }
  }, [currentSessionId, setSessions, setCurrentSessionId, setMessages]);

  useEffect(() => {
    if (!isCheckingAuth && (session?.user || isAdmin)) {
      loadSessions();
    }
  }, [session, isAdmin, isCheckingAuth, loadSessions]);

  useEffect(() => {
    if (currentSessionId) {
      // Check if we already have messages for this session in store?
      // Actually, store only keeps messages for *current* session.
      // So we should load messages when ID changes.
      // But we can check if messages are already loaded for this ID if we stored session ID with messages.
      // For now, let's just load. Optimizing this would require storing messages per session in Zustand.
      loadSessionMessages(currentSessionId);
    }
  }, [currentSessionId]);

  const loadSessionMessages = async (sessionId: string) => {
    // 1. Try Cache first for immediate display
    if (contextChats[sessionId]) {
      setMessages(contextChats[sessionId]);
    } else {
      setMessages([]); // Clear current view while loading if not in cache
    }

    try {
      const res = await fetch(`/api/chat-sessions/${sessionId}`);
      
      if (!res.ok) {
        if (res.status === 404) {
          console.log('Session not found, clearing selection');
          setCurrentSessionId(null);
          setMessages([]);
          loadSessions();
          return;
        }
        throw new Error(`Failed to load messages: ${res.status}`);
      }

      const data = await res.json();

      if (data.session && data.session.messages) {
        interface DbMessage {
          id: string;
          role: string;
          content: string;
          image_url?: string;
          image_urls?: string[]; // New field for multiple images
          created_at: string;
        }
        const loadedMessages: Message[] = data.session.messages.map(
          (msg: DbMessage) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant",
            content: msg.content,
            image: msg.image_url || undefined, // Keep for backward compatibility
            images:
              msg.image_urls || (msg.image_url ? [msg.image_url] : undefined), // Prefer images array
            timestamp: new Date(msg.created_at),
          })
        );
        
        setMessages(loadedMessages);
        setContextMessages(sessionId, loadedMessages); // Update cache
      } else {
        setMessages([]);
        setContextMessages(sessionId, []);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
      // If cache exists, we keep showing it, but maybe show an error toast?
      // For now, if fetch fails and we have cache, we are good.
      // If no cache and fetch fails, clear messages.
      if (!contextChats[sessionId]) {
        setMessages([]);
      }
    }
  };

  const saveMessages = async (sessionId: string, messagesToSave: Message[]) => {
    try {
      await fetch(`/api/chat-sessions/${sessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messagesToSave.map((msg) => ({
            role: msg.role,
            content: msg.content,
            imageUrl: msg.image,
            imageUrls: msg.images, // Save images array
          })),
        }),
      });
    } catch (error) {
      console.error("Failed to save messages:", error);
    }
  };

  const createNewSession = async () => {
    try {
      const res = await fetch("/api/chat-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "New Chat",
          provider: selectedProvider || "google",
          model: selectedModel || "gemini-2.5-flash",
        }),
      });
      const data = await res.json();
      setCurrentSessionId(data.session.id);
      setMessages([]);
      setInput("");
      setPreviewImages([]); // Changed from setPreviewImage
      setHasUnsavedChanges(false);
      await loadSessions();
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  const switchSession = (sessionId: string) => {
    if (hasUnsavedChanges && input.trim()) {
      const confirmSwitch = window.confirm(
        "You have unsaved changes. Are you sure you want to switch sessions?"
      );
      if (!confirmSwitch) return;
    }
    setCurrentSessionId(sessionId);
    setInput("");
    setPreviewImages([]); // Changed from setPreviewImage
    setHasUnsavedChanges(false);
  };

  const renameSession = async (sessionId: string, newTitle: string) => {
    // Optimistic update
    const previousSessions = [...sessions];
    setSessions(
      sessions.map((s) =>
        s.id === sessionId ? { ...s, title: newTitle } : s
      )
    );
    setEditingSessionId(null);

    try {
      await fetch(`/api/chat-sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
    } catch (error) {
      console.error("Failed to rename session:", error);
      // Revert on error
      setSessions(previousSessions);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!window.confirm("Are you sure you want to delete this chat session?")) {
      return;
    }

    // Optimistic update
    const previousSessions = [...sessions];
    const previousCurrentId = currentSessionId;
    const previousMessages = [...messages];

    setSessions(sessions.filter((s) => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setCurrentSessionId(remaining.length > 0 ? remaining[0].id : null);
      setMessages([]);
    }

    try {
      await fetch(`/api/chat-sessions/${sessionId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Failed to delete session:", error);
      // Revert on error
      setSessions(previousSessions);
      setCurrentSessionId(previousCurrentId);
      setMessages(previousMessages);
    }
  };

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#FDFBF7] overflow-hidden pt-16">
      {/* Mobile menu button - only show on mobile/tablet when sidebar is closed */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-4 top-20 z-30 bg-white p-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors border border-gray-200 lg:hidden"
          title="Show Sidebar"
        >
          <MessageSquare size={24} className="text-gray-700" />
        </button>
      )}

      {/* Mobile overlay - only on mobile/tablet when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - always visible on desktop (lg+), toggleable on mobile/tablet */}
      <div
        className={`bg-white border-r border-gray-200 flex flex-col flex-shrink-0 transition-transform duration-300 ${
          isMobile
            ? `fixed left-0 top-16 bottom-0 w-64 sm:w-72 md:w-80 z-50 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`
            : "w-64 xl:w-72"
        }`}
      >
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          {/* Close button - only show on mobile/tablet */}
          <div className="flex justify-end mb-2 lg:hidden">
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
              title="Close Sidebar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <button
            onClick={createNewSession}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-2 transition-colors"
          >
            <Plus size={20} />
            New Chat
          </button>
          <Link
            href="/chatbot/settings"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Settings size={20} />
            Settings
          </Link>
        </div>
        <div className="px-4 pb-2">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={16}
            />
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
              className={`group relative rounded-lg mb-1 ${
                currentSessionId === sess.id
                  ? "bg-blue-50"
                  : "hover:bg-gray-100"
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
                      if (e.key === "Enter") {
                        renameSession(sess.id, editingTitle);
                      } else if (e.key === "Escape") {
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
                  <MessageSquare
                    size={16}
                    className={
                      currentSessionId === sess.id ? "text-blue-600" : ""
                    }
                  />
                  <span
                    className={`truncate flex-1 ${currentSessionId === sess.id ? "text-blue-600" : ""}`}
                  >
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

      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex-shrink-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            Chatbot
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto chatbot-scrollbar">
          <div className="w-full max-w-[800px] lg:max-w-[900px] mx-auto p-4 sm:p-6">
            {availableModels.length === 0 && !isCheckingAuth && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                No AI models configured. Please configure your API keys in
                settings.
              </div>
            )}

            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-20">
                <h2 className="text-xl font-semibold mb-2">
                  Welcome to AI Tasky
                </h2>
                <p>Start a conversation by typing a message below.</p>
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex mb-4 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`rounded-2xl py-1 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white max-w-[85%] px-4 py-3"
                      : "w-full text-gray-900 px-1"
                  }`}
                >
                  {message.images && message.images.length > 0 ? (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {message.images.map((img, idx) => (
                        <Image
                          key={idx}
                          src={img}
                          alt={`Uploaded image ${idx + 1}`}
                          width={300}
                          height={200}
                          className="rounded-lg max-w-full h-auto object-cover"
                          style={{ maxHeight: "300px" }}
                        />
                      ))}
                    </div>
                  ) : message.image ? (
                    <div className="mb-2">
                      <Image
                        src={message.image}
                        alt="Uploaded image"
                        width={300}
                        height={200}
                        className="rounded-lg max-w-full h-auto"
                      />
                    </div>
                  ) : null}

                  {message.role === "assistant" ? (
                    <div className="prose prose-slate max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={
                          {
                            p: ({ ...props }) => (
                              <p className="mb-4 leading-relaxed text-gray-800 text-[16px]" {...props} />
                            ),
                            hr: ({ ...props }) => (
                              <hr
                                className="my-8 border-t border-[#E5D5C0]"
                                {...props}
                              />
                            ),
                            h1: ({ ...props }) => (
                              <h1
                                className="text-2xl font-bold mb-6 mt-2 text-gray-900 pb-2 border-b border-[#E5D5C0]/50"
                                {...props}
                              />
                            ),
                            h2: ({ ...props }) => (
                              <h2
                                className="text-xl font-bold mb-4 mt-8 text-gray-900"
                                {...props}
                              />
                            ),
                            h3: ({ ...props }) => (
                              <h3
                                className="text-lg font-semibold mb-3 mt-6 text-gray-900"
                                {...props}
                              />
                            ),
                            ul: ({ ...props }) => (
                              <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-800" {...props} />
                            ),
                            ol: ({ ...props }) => (
                              <ol className="list-decimal pl-6 mb-4 space-y-2 text-gray-800" {...props} />
                            ),
                            li: ({ ...props }) => (
                              <li className="leading-relaxed pl-1" {...props} />
                            ),
                            strong: ({ ...props }) => (
                              <strong className="font-bold text-gray-900" {...props} />
                            ),
                            blockquote: ({ ...props }) => (
                              <blockquote className="border-l-4 border-[#E5D5C0] pl-4 py-1 my-4 italic text-gray-700 bg-[#F5E6D3]/20 rounded-r" {...props} />
                            ),
                            code: ({ className, children, ...props }: any) => {
                              const match = /language-(\w+)/.exec(className || '');
                              return !match ? (
                                <code className="bg-[#F5E6D3]/50 px-1.5 py-0.5 rounded text-sm font-mono text-[#B45309]" {...props}>
                                  {children}
                                </code>
                              ) : (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              );
                            },
                            table: ({ ...props }) => (
                              <div
                                style={{
                                  margin: "2rem 0",
                                  all: "initial",
                                  display: "block",
                                  fontFamily: "inherit",
                                }}
                              >
                                <div
                                  style={{
                                    backgroundColor: "#FFF8F0",
                                    borderRadius: "1rem",
                                    padding: "0",
                                    border: "1px solid #F5E6D3",
                                    boxShadow:
                                      "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
                                    overflow: "hidden",
                                    display: "block",
                                  }}
                                >
                                  <div className="px-5 py-3 bg-[#FDFBF7] border-b border-[#F5E6D3] flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[#E5D5C0]"></div>
                                    <div className="w-3 h-3 rounded-full bg-[#E5D5C0]"></div>
                                    <div className="w-3 h-3 rounded-full bg-[#E5D5C0]"></div>
                                  </div>
                                  <div className="p-5 overflow-x-auto">
                                    <table
                                      style={{
                                        width: "100%",
                                        borderCollapse: "separate",
                                        borderSpacing: "0",
                                        margin: "0",
                                        backgroundColor: "transparent",
                                        display: "table",
                                      }}
                                      {...props}
                                    />
                                  </div>
                                </div>
                              </div>
                            ),
                            thead: ({ ...props }) => (
                              <thead
                                style={{
                                  backgroundColor: "#FFF8F0",
                                  display: "table-header-group",
                                }}
                                {...props}
                              />
                            ),
                            tbody: ({ ...props }) => (
                              <tbody
                                style={{
                                  backgroundColor: "white",
                                  display: "table-row-group",
                                }}
                                {...props}
                              />
                            ),
                            th: ({ ...props }) => (
                              <th
                                style={{
                                  padding: "1rem 1.5rem",
                                  textAlign: "left",
                                  fontSize: "0.875rem",
                                  fontWeight: "700",
                                  color: "#4B5563",
                                  backgroundColor: "#FFF8F0",
                                  borderBottom: "2px solid #F5E6D3",
                                  display: "table-cell",
                                }}
                                {...props}
                              />
                            ),
                            td: ({ ...props }) => (
                              <td
                                style={{
                                  padding: "1rem 1.5rem",
                                  fontSize: "0.875rem",
                                  color: "#374151",
                                  backgroundColor: "white",
                                  borderBottom:
                                    "1px solid rgba(245, 230, 211, 0.4)",
                                  display: "table-cell",
                                }}
                                {...props}
                              />
                            ),
                            tr: ({ ...props }) => (
                              <tr
                                style={{
                                  transition: "background-color 0.2s",
                                  display: "table-row",
                                }}
                                onMouseEnter={(e) => {
                                  const target = e.currentTarget as HTMLElement;
                                  target.style.backgroundColor =
                                    "rgba(255, 248, 240, 0.5)";
                                }}
                                onMouseLeave={(e) => {
                                  const target = e.currentTarget as HTMLElement;
                                  target.style.backgroundColor = "transparent";
                                }}
                                {...props}
                              />
                            ),
                          } as any
                        }
                      >
                        {message.content}
                      </ReactMarkdown>
                      {isLoading &&
                        messages[messages.length - 1].id === message.id && (
                          <div className="mt-4 flex items-center gap-2 text-gray-400">
                            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                          </div>
                        )}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-white text-base">{message.content}</p>
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
                      <div
                        className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                    <span className="text-sm text-blue-600">
                      AI is thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <ChatInput
          onSubmit={handleSubmit}
          isLoading={isLoading}
          previewImages={previewImages}
          setPreviewImages={setPreviewImages}
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
