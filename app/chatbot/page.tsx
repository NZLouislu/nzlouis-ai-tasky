"use client";
import { useState, useRef, useEffect, useLayoutEffect } from "react";
import Image from "next/image";
import { useAISettings } from "@/lib/useAISettings";
import { getVisionModels } from "@/lib/aiConfig";
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
  const [showModelSelector, setShowModelSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputAreaRef = useRef<HTMLDivElement | null>(null);
  const [inputHeight, setInputHeight] = useState<number>(180);

  // Determine activePageId based on pathname
  const activePageId = pathname === "/chatbot/settings" ? "settings" : "chatbot";

  const pages: SidebarPage[] = [
    { id: "chatbot", title: "AI Chatbot", icon: "🤖", href: "/chatbot" },
    { id: "settings", title: "Settings", icon: "⚙️", href: "/chatbot/settings" },
  ];

  // Dynamically generate breadcrumb items
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
  }, [previewImage, showModelSelector, isLoading]);

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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) handleImageUpload(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

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
          <span className="text-sm text-gray-500">AI is thinking...</span>
        </div>
      );
    }
    return (
      <div>
        {message.image && (
          <div className="mb-2">
            <Image src={message.image} alt="Uploaded content" width={400} height={300} className="max-w-full max-h-48 rounded-lg" />
          </div>
        )}
        {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}
      </div>
    );
  };

  const currentModel = getCurrentModel();
  const visionModels = getVisionModels();

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

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-0 md:ml-64 lg:ml-64">
        <div
          className={`fixed top-16 left-0 right-0 z-40 bg-white/30 backdrop-blur-md border-b border-gray-200 md:left-64 lg:left-64 transition-all duration-300`}
        >
          <div className="p-4 md:pl-4 lg:pl-4">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        </div>

        <div className="md:hidden p-4 border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-600 hover:text-gray-900"
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
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Content area that handles its own scrolling and padding */}
        <div className="flex-1 flex flex-col overflow-hidden pt-[calc(4rem+1px)] md:pt-[calc(4rem+1px)]">
          <div className="flex flex-col h-full w-full max-w-[900px] mx-auto px-2 md:pl-8 md:pr-2 lg:pl-8 lg:pr-2 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-lg overflow-hidden relative">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-white/20 rounded-full p-2 mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="font-bold text-lg">AI Assistant</h1>
                    <p className="text-sm text-blue-100">{currentModel ? `${currentModel.name} • ${currentModel.provider}` : "Select a model"}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {currentModel?.supportsVision && <div className="bg-white/20 rounded-full px-2 py-1 text-xs">👁️ Vision</div>}
                  <button onClick={() => setShowModelSelector(!showModelSelector)} className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors" title="Change model">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              {showModelSelector && (
                <div className="mt-4 bg-white/10 rounded-lg p-3">
                  <div className="text-sm text-blue-100 mb-2">Quick Model Switch</div>
                  <div className="grid grid-cols-2 gap-2">
                    {visionModels.slice(0, 4).map(model => (
                      <button key={model.id} onClick={() => { alert(`Switch to ${model.name}? Go to Settings to change models.`); setShowModelSelector(false); }} className="bg-white/20 hover:bg-white/30 rounded px-2 py-1 text-xs transition-colors">{model.name}</button>
                    ))}
                  </div>
                  <div className="mt-2 text-center">
                    <a href="/chatbot/settings" className="text-blue-200 hover:text-white text-xs underline">More options →</a>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ paddingBottom: inputHeight + 24 }}>
              {messages.map(message => (
                <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="flex max-w-[85%] md:max-w-[75%]">
                    {message.sender === "bot" && (
                      <div className="mr-3 mt-1">
                        <div className="bg-indigo-500 w-8 h-8 rounded-full flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                    <div className={`p-4 rounded-2xl ${message.sender === "user" ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-tr-none" : "bg-white text-gray-800 rounded-tl-none shadow-sm"}`}>
                      {renderMessageContent(message)}
                      <p className={`text-xs mt-1 ${message.sender === "user" ? "text-blue-200" : "text-gray-500"}`}>{formatTime(message.timestamp)}</p>
                    </div>
                    {message.sender === "user" && (
                      <div className="ml-3 mt-1">
                        <div className="bg-blue-500 w-8 h-8 rounded-full flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div ref={inputAreaRef} className="fixed left-0 md:left-63 right-0 bottom-0 z-50 flex justify-center">
              <div className="w-full max-w-[900px] px-2 md:px-8">
                <div className="bg-white border-t border-gray-200 shadow-lg rounded-t-xl">
                  {previewImage && (
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Image Preview</span>
                        <button onClick={() => setPreviewImage(null)} className="text-gray-500 hover:text-gray-700">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      <div className="relative max-w-xs">
                        <Image src={previewImage} alt="Preview" width={200} height={128} className="max-h-32 rounded-lg" />
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="p-4">
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />

                    {currentModel?.supportsVision && (
                      <div className="mb-2 text-xs text-gray-600 flex items-center">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium mr-2">👁️ Vision Enabled</span>
                        <span>Upload images or paste screenshots to analyze</span>
                      </div>
                    )}

                    <div className="flex items-end rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500" onDrop={handleDrop} onDragOver={handleDragOver}>
                      {currentModel?.supportsImages && (
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100" title="Upload image">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}

                      <textarea ref={textareaRef} value={inputValue} onChange={(e) => { setInputValue(e.target.value); adjustTextareaHeight(); }} onKeyDown={handleKeyDown} onFocus={() => setTimeout(() => scrollToBottom(), 120)} placeholder={currentModel?.supportsVision ? "Type your message or upload an image..." : "Type your message..."} className="flex-1 px-4 py-3 focus:outline-none resize-none max-h-32" rows={3} disabled={isLoading} />

                      <button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-3 hover:opacity-90 transition-opacity disabled:opacity-50 self-stretch" disabled={(!inputValue.trim() && !previewImage) || isLoading}>
                        {isLoading ? (
                          <div className="flex items-center">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            <span className="text-sm">Sending</span>
                          </div>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </div>

                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-gray-500">Press Shift+Enter for newline • {currentModel ? `${currentModel.name} • ` : ""}{currentModel?.isFree ? "Free model" : `~$${currentModel?.pricing.input}/1K tokens`}</p>
                      <a href="/chatbot/settings" className="text-xs text-blue-600 hover:text-blue-800 underline">Settings</a>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
