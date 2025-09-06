"use client";
import { useState, useRef, useEffect, useLayoutEffect } from "react";
import Image from "next/image";
import { useAISettings } from "@/lib/useAISettings";
import Sidebar from "@/components/Sidebar";
import Breadcrumb from "@/components/Breadcrumb";
import { useRouter, usePathname } from "next/navigation";

interface SidebarPage {
  id: string;
  title: string;
  icon?: string;
  href?: string;
}

type Message = {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  image?: string;
  isLoading?: boolean;
};

export default function Page() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const { settings, getCurrentModel, getApiKey } = useAISettings();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputAreaRef = useRef<HTMLDivElement | null>(null);
  const [inputHeight, setInputHeight] = useState<number>(180);

  const activePageId = pathname === "/chatbot/settings" ? "settings" : "chatbot";

  const pages: SidebarPage[] = [
    { id: "chatbot", title: "AI Chatbot", icon: "🤖", href: "/chatbot" },
    { id: "settings", title: "Settings", icon: "⚙️", href: "/chatbot/settings" },
  ];

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Chatbot", href: "/chatbot", icon: "💬" },
  ];

  if (pathname === "/chatbot/settings") {
    breadcrumbItems.push({ label: "Settings", href: "/chatbot/settings", icon: "⚙️" });
  }

  const handleSelectPage = (pageId: string, href?: string) => {
    if (href) {
      router.push(href);
    }
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  useEffect(() => {
    const textarea = textareaRef.current;
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files.length) {
        e.preventDefault();
        const file = e.clipboardData.files[0];
        if (file.type.startsWith("image/")) {
          handleImageUpload(file);
        }
      }
    };
    textarea?.addEventListener("paste", handlePaste as EventListener);
    return () => {
      textarea?.removeEventListener("paste", handlePaste as EventListener);
    };
  }, []);

  useLayoutEffect(() => {
    const measure = () => {
      const h = inputAreaRef.current?.offsetHeight ?? 180;
      setInputHeight(Math.ceil(h));
    };
    measure();
    const ro = new ResizeObserver(() => measure());
    if (inputAreaRef.current) ro.observe(inputAreaRef.current);
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [previewImage, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  };

  const handleImageUpload = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) handleImageUpload(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) handleImageUpload(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => e.preventDefault();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const formEvent = new Event("submit", { bubbles: true, cancelable: true }) as unknown as React.FormEvent;
      handleSubmit(formEvent);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() === "" && !previewImage) return;
    if (isLoading) return;
    const currentModel = getCurrentModel();
    if (!currentModel) {
      alert("Please select a model in settings");
      return;
    }
    const apiKey = getApiKey(currentModel.provider);
    if (currentModel.provider !== "google" && !apiKey) {
      alert(`Please set your ${currentModel.provider} API key in settings`);
      return;
    }
    const newMessage: Message = {
      id: Date.now(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
      ...(previewImage && { image: previewImage })
    };
    setMessages(prev => [...prev, newMessage]);
    setInputValue("");
    setPreviewImage(null);
    setIsLoading(true);
    const loadingMessage: Message = {
      id: Date.now() + 1,
      text: "",
      sender: "bot",
      timestamp: new Date(),
      isLoading: true
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      const chatMessages = [
        { role: "system", content: settings.systemPrompt },
        ...messages.map(msg => ({ role: msg.sender === "user" ? "user" : "assistant", content: msg.text, ...(msg.image && { image: msg.image }) })),
        { role: "user", content: newMessage.text, ...(newMessage.image && { image: newMessage.image }) }
      ];

      const isGeminiModel = currentModel.provider === "google";
      const useStreaming = isGeminiModel;

      if (useStreaming) {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            modelId: settings.selectedModel,
            messages: chatMessages,
            temperature: settings.temperature,
            maxTokens: settings.maxTokens,
            apiKey,
            stream: true
          })
        });

        if (!response.ok) throw new Error("Failed to get response from AI");

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') break;

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.text) {
                    accumulatedText += parsed.text;
                    setMessages(prev => prev.map(msg =>
                      msg.isLoading ? { ...msg, text: accumulatedText } : msg
                    ));
                  }
                } catch {
                  // Ignore parsing errors
                }
              }
            }
          }
        }

        setMessages(prev => prev.map(msg =>
          msg.isLoading ? { ...msg, text: accumulatedText, isLoading: false } : msg
        ));
      } else {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            modelId: settings.selectedModel,
            messages: chatMessages,
            temperature: settings.temperature,
            maxTokens: settings.maxTokens,
            apiKey
          })
        });
        if (!response.ok) throw new Error("Failed to get response from AI");
        const data = await response.json();
        setMessages(prev => prev.map(msg => (msg.isLoading ? { ...msg, text: data.response, isLoading: false } : msg)));
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => prev.map(msg => (msg.isLoading ? { ...msg, text: "Sorry, I encountered an error. Please try again.", isLoading: false } : msg)));
    } finally {
      setIsLoading(false);
      setTimeout(() => scrollToBottom(), 120);
    }
  };

  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const renderMessageContent = (message: Message) => {
    if (message.isLoading) {
      return (
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
          </div>
          <span className="text-sm text-gray-500">
            {message.text ? "AI is typing..." : "AI is thinking..."}
          </span>
        </div>
      );
    }
    return (
      <div>
        {message.image && (
          <div className="mb-3">
            <Image src={message.image} alt="Uploaded content" width={400} height={300} className="max-w-full max-h-48 rounded-lg border border-gray-200" />
          </div>
        )}
        {message.text && <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>}
      </div>
    );
  };

  const currentModel = getCurrentModel();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        title="AI Assistant"
        icon="🤖"
        pages={pages}
        activePageId={activePageId}
        onSelectPage={handleSelectPage}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        className="top-16"
      />

      <div className="flex-1 flex flex-col ml-0 md:ml-64">
        <div className="fixed top-16 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 md:left-64">
          <div className="px-4 md:px-6 py-3">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        </div>

        <div className="md:hidden p-4 border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <div className="flex-1 flex flex-col pt-20 md:pt-20">
          <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 md:px-6">
            <div className="flex-1 overflow-y-auto py-6 space-y-6" style={{ paddingBottom: inputHeight + 24 }}>
              {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Start a conversation</h3>
                    <p className="text-gray-600">Ask me anything or upload an image to analyze</p>
                  </div>
                </div>
              ) : (
                messages.map(message => (
                  <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div className="flex max-w-[85%] md:max-w-[80%]">
                      {message.sender === "bot" && (
                        <div className="mr-3 mt-1 flex-shrink-0">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                      )}
                      <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                        message.sender === "user"
                          ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-br-md"
                          : "bg-white text-gray-800 rounded-bl-md border border-gray-100"
                      }`}>
                        {renderMessageContent(message)}
                        <p className={`text-xs mt-2 ${
                          message.sender === "user" ? "text-blue-100" : "text-gray-500"
                        }`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                      {message.sender === "user" && (
                        <div className="ml-3 mt-1 flex-shrink-0">
                          <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div ref={inputAreaRef} className="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-gray-200">
              <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
                {previewImage && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Image Preview</span>
                      <button
                        onClick={() => setPreviewImage(null)}
                        className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-200"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="relative max-w-xs">
                      <Image src={previewImage} alt="Preview" width={200} height={128} className="max-h-32 rounded-lg border border-gray-200" />
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="relative">
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />

                  <div className="flex items-end space-x-3">
                    {currentModel?.supportsVision && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                        title="Upload image"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                    )}

                    <div className="flex-1 relative">
                      <textarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={(e) => { setInputValue(e.target.value); adjustTextareaHeight(); }}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setTimeout(() => scrollToBottom(), 120)}
                        placeholder={currentModel?.supportsVision ? "Type your message or upload an image..." : "Type your message..."}
                        className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-h-32"
                        rows={1}
                        disabled={isLoading}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                      />
                      <button
                        type="submit"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={(!inputValue.trim() && !previewImage) || isLoading}
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>Press Shift+Enter for newline</span>
                      {currentModel && (
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          {currentModel.name}
                        </span>
                      )}
                    </div>
                    <a href="/chatbot/settings" className="text-blue-600 hover:text-blue-800 underline">Settings</a>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
