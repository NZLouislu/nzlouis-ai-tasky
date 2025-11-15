"use client";
import React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "@/lib/hooks/use-chat";
import { v4 as uuidv4 } from "uuid";
import { useAISettings } from "@/lib/useAISettings";
import Image from "next/image";
import ChatInput from "./ChatInput";

interface Message {
  id: string;
  content: string | { text: string; image?: string };
  role: string;
  timestamp: string;
}

interface PageModification {
  type: string;
  target?: string;
  content?: string;
  title?: string;
}

interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  tested?: boolean;
  working?: boolean;
}

interface UnifiedChatbotProps {
  mode: "standalone" | "workspace";
  onPageModification?: (mod: PageModification) => Promise<string>;
  sidebarCollapsed?: boolean;
}

export default function UnifiedChatbot({
  mode,
  onPageModification,
  sidebarCollapsed = false,
}: UnifiedChatbotProps) {
  const { messages, appendMessage } = useChat() as {
    messages: Message[];
    appendMessage: (message: Message) => void;
  };
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load available models
  useEffect(() => {
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
          
          // Set default provider and model
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

    loadAvailableModels();
  }, []);

  // Detect mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleImageUpload = useCallback(async (file: File) => {
    if (file && file.type.startsWith("image/")) {
      try {
        setIsLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('entityType', 'chat_message');
        formData.append('entityId', 'temp');

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

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() && !previewImage) return;
      if (!selectedModel) return;

      const text = input;

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
            timestamp: new Date().toISOString(),
          };
          appendMessage(userMessage);
          setInput("");
          setPreviewImage(null);
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
              timestamp: new Date().toISOString(),
            };
            appendMessage(assistantMessage);
          } catch (error) {
            console.error('🔧 Modification error:', error);
            const errorMessage: Message = {
              id: uuidv4(),
              content: `❌ Failed to apply modification: ${error instanceof Error ? error.message : 'Unknown error'}`,
              role: "assistant",
              timestamp: new Date().toISOString(),
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
        content: previewImage ? { text, image: previewImage } : text,
        role: "user",
        timestamp: new Date().toISOString(),
      };

      appendMessage(userMessage);
      const currentInput = input;
      const currentImage = previewImage;
      setInput("");
      setPreviewImage(null);
      setIsLoading(true);

      try {
        const chatMessages = messages.map((msg) => ({
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content : msg.content.text,
          ...(typeof msg.content !== 'string' && msg.content.image && { image: msg.content.image }),
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
          content: '',
          role: 'assistant',
          timestamp: new Date().toISOString(),
        };

        appendMessage(assistantMessage);

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
                appendMessage({ ...assistantMessage });
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
          timestamp: new Date().toISOString(),
        };
        appendMessage(errorMessage);
      }
    },
    [input, previewImage, selectedModel, messages, appendMessage, mode, onPageModification]
  );

  const renderMessageContent = useCallback(
    (content: string | { text: string; image?: string }) => {
      if (typeof content === "string") {
        return <div className="whitespace-pre-wrap">{content}</div>;
      }
      return (
        <div>
          <div className="whitespace-pre-wrap mb-2">{content.text}</div>
          {content.image && (
            <div className="mt-2">
              <Image
                src={content.image}
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

  return (
    <div
      className={`unified-chatbot flex flex-col bg-white ${mode === "standalone" ? "h-full" : "h-full"
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
          className={`w-full space-y-6 ${mode === "standalone" ? "max-w-[900px] mx-auto" : ""
            }`}
        >
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
              className={`flex ${message.role === "user" ? "justify-end" : "justify-end"
                }`}
            >
              <div
                className={`px-4 py-3 rounded-2xl ${message.role === "user"
                    ? mode === "standalone"
                      ? "bg-blue-600 text-white max-w-[85%]"
                      : "bg-blue-600 text-white max-w-[80%] lg:max-w-[70%]"
                    : mode === "standalone"
                      ? "bg-gray-100 text-gray-900 w-full"
                      : "bg-gray-100 text-gray-900 w-full"
                  }`}
              >
                {renderMessageContent(message.content)}
                <div
                  className={`text-xs mt-2 opacity-70 ${message.role === "user" ? "text-blue-100" : "text-gray-500"
                    }`}
                >
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
                {message.role === "assistant" && mode === "workspace" && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={async () => {
                        if (onPageModification) {
                          await onPageModification({
                            type: "add",
                            content:
                              typeof message.content === "string"
                                ? message.content
                                : message.content.text,
                          });
                        }
                      }}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Add to Page
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
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
          <div ref={messagesEndRef} />
        </div>
      </div>
      {mode === "standalone" ? (
        <div
          className={`fixed bottom-0 left-0 right-0 z-10 transition-all duration-200 ${sidebarCollapsed ? "ml-0 md:ml-12" : "ml-0 md:ml-64"
            }`}
        >
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
      ) : (
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
      )}
    </div>
  );
}
