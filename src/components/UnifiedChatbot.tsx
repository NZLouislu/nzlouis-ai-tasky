"use client";
import React from "react";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useChat } from "@/lib/hooks/use-chat";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";
import ChatInput from "./ChatInput";
import { useChatStore, Message } from "@/lib/store/chat-store";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ChatSkeleton from "./ChatSkeleton";

interface PageModification {
  type: string;
  target?: string;
  content?: string;
  title?: string;
}

interface ArticleContext {
  title: string;
  content: string;
  icon?: string;
  coverType?: string;
  coverValue?: string;
}

interface UnifiedChatbotProps {
  mode: "standalone" | "workspace";
  onPageModification?: (mod: PageModification) => Promise<string>;
  sidebarCollapsed?: boolean;
  postId?: string;
  documentId?: string;
  userId?: string;
  apiEndpoint?: 'blog' | 'stories';
  articleContext?: ArticleContext;
  containerWidth?: number;
}

export default function UnifiedChatbot({
  mode,
  onPageModification,
  sidebarCollapsed = false,
  postId,
  documentId,
  userId,
  apiEndpoint = 'blog',
  articleContext,
  containerWidth,
}: UnifiedChatbotProps) {
  // Use store for models
  const { 
    availableModels, 
    selectedModel, 
    selectedProvider,
    setSelectedModel,
    setSelectedProvider,
    setAvailableModels
  } = useChatStore();

  const { 
    messages, 
    appendMessage, 
    updateLastMessage,
    clearMessages, 
    loadingState,
    loadMoreMessages,
    hasMore,
    isLoadingMore,
    saveMessage
  } = useChat({
    postId,
    documentId,
    userId,
    enablePersistence: mode === "workspace" && !!(postId || documentId) && !!userId,
    apiEndpoint,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const topSentinelRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMoreMessages();
        }
      },
      { threshold: 1.0 }
    );

    if (topSentinelRef.current) {
      observer.observe(topSentinelRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMoreMessages]);

  // Load available models if not loaded
  useEffect(() => {
    const loadAvailableModels = async () => {
      if (availableModels.length > 0) return; // Already loaded

      try {
        const res = await fetch('/api/ai-models');
        const data = await res.json();

        if (data.models && data.models.length > 0) {
          const sortedModels = data.models.sort((a: any, b: any) => {
            if (a.provider === 'google' && b.provider !== 'google') return -1;
            if (a.provider !== 'google' && b.provider === 'google') return 1;
            return 0;
          });

          setAvailableModels(sortedModels);
          
          // Set default provider and model
          if (sortedModels.length > 0) {
            const firstProvider = sortedModels[0].provider;
            setSelectedProvider(firstProvider);
            setSelectedModel(sortedModels[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to load AI models:', error);
      }
    };

    loadAvailableModels();
  }, [availableModels.length, setAvailableModels, setSelectedModel, setSelectedProvider]);

  // Detect mobile
  // Detect mobile based on window width OR container width
  useEffect(() => {
    const handleResize = () => {
      // If containerWidth is provided, use it to determine mobile layout
      if (containerWidth !== undefined) {
        setIsMobile(containerWidth < 500); // Threshold for mobile layout in panel
      } else {
        setIsMobile(window.innerWidth < 768);
      }
    };
    
    handleResize(); // Initial check
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [containerWidth]);

  const handleImageUpload = useCallback(async (files: FileList | File | null) => {
    if (!files) return;

    const fileArray = files instanceof FileList ? Array.from(files) : [files];
    const validFiles = fileArray.filter(f => f.type.startsWith("image/"));

    if (validFiles.length === 0) return;

    setIsLoading(true);

    try {
      const uploadPromises = validFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('entityType', 'chat_message');
        formData.append('entityId', 'temp');

        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!res.ok) throw new Error('Upload failed');
          const data = await res.json();
          return data.publicUrl;
        } catch (error) {
          console.error('Image upload failed, falling back to base64:', error);
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });
        }
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setPreviewImages(prev => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error('Error processing images:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle paste for image upload
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







  const renderMessageContent = useCallback(
    (message: Message) => {
      const { content, role } = message;
      const textContent = typeof content === "string" ? content : (content as any)?.text || "";
      const imageContent = typeof content !== "string" ? (content as any)?.image : undefined;

      // User Message Styling
      if (role === "user") {
        return (
          <div className="text-white text-base">
            {message.images && message.images.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {message.images.map((img, idx) => (
                  <Image
                    key={idx}
                    src={img}
                    alt={`Uploaded image ${idx + 1}`}
                    width={300}
                    height={200}
                    className="rounded-lg max-w-full h-auto object-cover"
                    style={{ maxHeight: "200px" }}
                  />
                ))}
              </div>
            )}
            {imageContent && (
              <div className="mb-2">
                <Image
                  src={imageContent}
                  alt="Attached image"
                  width={300}
                  height={200}
                  className="rounded-lg max-w-full h-auto"
                />
              </div>
            )}
            <p className="whitespace-pre-wrap leading-relaxed">{textContent}</p>
          </div>
        );
      }

      // Assistant Message Styling
      const markdownComponents = {
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
              margin: "3rem 0 0 0",
              all: "initial",
              display: "block",
              fontFamily: "inherit",
              width: "100%",
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
                marginBottom: "3rem",
              }}
            >
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
      };

      return (
        <div>
          <div className="prose prose-slate max-w-none dark:prose-invert mb-2">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={markdownComponents as any}
            >
              {textContent}
            </ReactMarkdown>
          </div>
          {imageContent && (
            <div className="mt-2">
              <Image
                src={imageContent}
                alt="Attached image"
                width={300}
                height={200}
                className="rounded-lg max-w-full h-auto"
              />
            </div>
          )}
        </div>
      );
    },
    []
  );

  // Memoize message list to prevent re-renders when input changes
  const MessageList = useMemo(() => (
    <>
      {messages.length === 0 && (
        <div className="text-center py-12 pt-16">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🤖</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Start a conversation
          </h3>
          <p className="text-gray-500">
            Ask me anything or type a command to get started.
          </p>
        </div>
      )}
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"
            }`}
        >
          <div
            className={`py-1 ${message.role === "user"
                ? mode === "standalone"
                  ? "bg-blue-600 text-white max-w-[85%] px-4 py-3 rounded-2xl"
                  : "bg-blue-600 text-white max-w-[80%] lg:max-w-[85%] px-4 py-3 rounded-2xl"
                : "w-full text-gray-900 px-1"
              }`}
          >
            {renderMessageContent(message)}
            <div
              className={`text-xs mt-2 opacity-70 ${message.role === "user" ? "text-blue-100" : "text-gray-400"
                }`}
            >
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      ))}
    </>
  ), [messages, mode, renderMessageContent]);

  const handleSubmit = useCallback(
    async (text: string, options?: { searchWeb?: boolean }) => {
      if (!text.trim() && previewImages.length === 0) return;
      if (!selectedModel) return;

      // Check if this is a Blog modification request
      if (mode === "workspace" && onPageModification) {
        // Detect if the user wants to modify the blog content
        const modificationKeywords = [
          'modify', 'change', 'replace', 'add', 'insert', 'delete', 'improve',
          'can you', 'please', 'help me', '修改', '改成', '添加', '插入', '删除'
        ];

        const isModificationRequest = modificationKeywords.some(keyword =>
          text.toLowerCase().includes(keyword.toLowerCase())
        );

        if (isModificationRequest) {
          console.log('🔧 Detected modification request:', text);

          // This is a modification request, handle it specially
          const userMessage: Message = {
            id: uuidv4(),
            content: text,
            role: "user",
            timestamp: new Date(),
          };
          appendMessage(userMessage);
          setPreviewImages([]);
          setIsLoading(true);

          try {
            console.log('🔧 Calling onPageModification with instruction:', text);

            // Pass the instruction text directly
            const result = await onPageModification({
              type: 'modify',
              content: text,  // This is the instruction
              title: text,    // Also pass as title for compatibility
            });

            console.log('🔧 Modification result:', result);

            const assistantMessage: Message = {
              id: uuidv4(),
              content: result,
              role: "assistant",
              timestamp: new Date(),
            };
            appendMessage(assistantMessage);
          } catch (error) {
            console.error('🔧 Modification error:', error);
            const errorMessage: Message = {
              id: uuidv4(),
              content: `❌ Failed to apply modification: ${error instanceof Error ? error.message : 'Unknown error'}`,
              role: "assistant",
              timestamp: new Date(),
            };
            appendMessage(errorMessage);
          } finally {
            setIsLoading(false);
          }
          return;
        }
      }

      const userMessage: Message = {
        id: uuidv4(),
        content: text,
        images: previewImages.length > 0 ? previewImages : undefined,
        role: "user",
        timestamp: new Date(),
      };

      appendMessage(userMessage);
      const currentImages = [...previewImages];
      setPreviewImages([]);
      setIsLoading(true);

      try {
        const chatMessages = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          images: msg.images || (msg.image ? [msg.image] : undefined),
        }));

        // Add article context as system message in workspace mode
        if (mode === "workspace" && articleContext) {
          const contextMessage = {
            role: 'user' as const,
            content: `[SYSTEM CONTEXT - Current Article Information]

**Title:** ${articleContext.title}
**Icon:** ${articleContext.icon || 'None'}
**Cover:** ${articleContext.coverType === 'image' ? `Image (${articleContext.coverValue})` : articleContext.coverType === 'color' ? `Color (${articleContext.coverValue})` : 'None'}

**Current Content:**
${articleContext.content || '(Article is empty)'}

---

You are an AI assistant helping to edit this blog article. You can help the user:
1. View and understand the current article content
2. Modify the article title
3. Add new content to the article
4. Update existing content
5. Delete specific paragraphs or sections
6. Reorganize the article structure

When the user asks you to modify the article, provide clear instructions on what changes should be made.

Please respond in the same language as the user's question.`,
            images: undefined
          };
          chatMessages.unshift(contextMessage);
        }

        chatMessages.push({
          role: 'user',
          content: text,
          images: currentImages.length > 0 ? currentImages : undefined,
        });

        const hasImages = chatMessages.some(m => m.images && m.images.length > 0);
        // Use chat-vision only for Google provider when images are present, 
        // as it supports env var API keys which chat/route.ts might not for Google.
        // For all other providers (like OpenRouter), use /api/chat which handles vision correctly.
        const apiEndpoint = (hasImages && selectedProvider === 'google') ? '/api/chat-vision' : '/api/chat';

        console.log('Using API:', apiEndpoint, 'Has images:', hasImages, 'Model:', selectedModel, 'Provider:', selectedProvider, 'Search:', options?.searchWeb);

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: chatMessages,
            modelId: selectedModel,
            searchWeb: options?.searchWeb,
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
          content: '',
          role: 'assistant',
          timestamp: new Date(),
        };

        appendMessage(assistantMessage);
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            setIsLoading(false);
            // Save the full message to the database
            if (mode === "workspace" && (postId || documentId) && userId) {
              const completedMessage = {
                ...assistantMessage,
                content: fullContent
              };
              saveMessage(completedMessage);
            }
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
                fullContent += text;
                updateLastMessage(fullContent);
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
          content: 'Sorry, something went wrong. Please try again.',
          role: 'assistant',
          timestamp: new Date(),
        };
        appendMessage(errorMessage);
      }
    },
    [previewImages, selectedModel, messages, appendMessage, updateLastMessage, mode, onPageModification, selectedProvider, articleContext, saveMessage, postId, documentId, userId]
  );

  return (
    <div
      className={`unified-chatbot flex flex-col bg-[#FDFBF7] ${mode === "standalone" ? "h-full" : "h-full"
        }`}
    >
      <div
        className={`flex-1 chatbot-scrollbar ${mode === "standalone"
            ? "px-4 py-4 overflow-y-auto"
            : "px-6 py-4 overflow-y-auto"
          }`}
        style={{
          paddingBottom: mode === "standalone" ? "160px" : "80px",
        }}
      >
        <div
          className={`w-full space-y-6 ${mode === "standalone" ? "max-w-[800px] lg:max-w-[900px] mx-auto" : ""
            }`}
        >
          {loadingState === 'loading' && messages.length === 0 ? (
            <ChatSkeleton />
          ) : (
            <>
              <div ref={topSentinelRef} className="h-4" />
              
              {isLoadingMore && (
                <div className="flex justify-center py-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <div
                        className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span>Loading older messages...</span>
                  </div>
                </div>
              )}

              {MessageList}

              {isLoading && (
                <div className={`flex justify-end`}>
                  <div
                    className={`bg-gray-100 text-gray-900 px-4 py-3 rounded-2xl w-full`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <div
                          className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                      <span className="text-sm text-blue-600">
                        AI is thinking...
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      {mode === "standalone" ? (
        <div
          className={`fixed bottom-0 left-0 right-0 z-10 transition-all duration-200 ${sidebarCollapsed ? "ml-0 md:ml-12" : "ml-0 md:ml-64"
            }`}
        >
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
      ) : (
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
      )}
    </div>
  );
}
