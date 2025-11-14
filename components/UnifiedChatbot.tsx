"use client";
import React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "@/lib/hooks/use-chat";
import { v4 as uuidv4 } from "uuid";
import { useAISettings } from "@/lib/useAISettings";
import Image from "next/image";
import { X, ArrowUp, Paperclip } from "lucide-react";

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
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getCurrentModel, getApiKey, settings } = useAISettings();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      const minHeight = 44;
      const maxHeight = 120;
      const newHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight));
      textarea.style.height = `${newHeight}px`;
    }
  }, []);

  const handleImageUpload = useCallback((file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    const handlePaste = (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items || []);

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          e.stopPropagation(); // Prevent event propagation
          const file = item.getAsFile();
          if (file) {
            handleImageUpload(file);
            console.log(
              "Chatbot handlePaste: Image pasted and handled",
              file.name || "pasted image"
            );
          }
          return;
        }
      }

      if (e.clipboardData?.files.length) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith("image/")) {
          e.preventDefault();
          e.stopPropagation(); // Prevent event bubbling
          handleImageUpload(file);
          console.log(
            "Chatbot handlePaste: Image pasted and handled",
            file.name || "pasted image"
          );
        }
      }
    };
    textarea?.addEventListener("paste", handlePaste as EventListener);
    return () => {
      textarea?.removeEventListener("paste", handlePaste as EventListener);
    };
  }, [handleImageUpload]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  const handleSubmit = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

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
      setInput("");
      setPreviewImage(null);
      setIsLoading(true);

      try {
        const currentModel = getCurrentModel();
        if (!currentModel) {
          throw new Error("Please select a model in settings");
        }

        const apiKey = getApiKey(currentModel.provider);
        if (currentModel.provider !== "google" && !apiKey) {
          throw new Error(
            `Please set your ${currentModel.provider} API key in settings`
          );
        }

        const chatMessages = [
          { role: "system" as const, content: settings.systemPrompt },
          {
            role: "user" as const,
            content: text,
          },
        ];

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: chatMessages,
            provider: currentModel.provider,
            model: currentModel.id,
            temperature: settings.temperature,
            maxTokens: settings.maxTokens,
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
        let isFirstChunk = true;

        const assistantMessageId = uuidv4();
        let assistantMessage: Message = {
          id: assistantMessageId,
          content: "",
          role: "assistant",
          timestamp: new Date().toISOString(),
        };

        let currentDisplayText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            setIsLoading(false);
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");

          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim();
            if (line.startsWith("0:")) {
              try {
                // Parse format: 0:"text content"
                const jsonStr = line.substring(2);
                const text = JSON.parse(jsonStr);

                if (isFirstChunk) {
                  setIsLoading(false);
                  isFirstChunk = false;
                  appendMessage(assistantMessage);
                }

                currentDisplayText += text;
                assistantMessage = {
                  ...assistantMessage,
                  content: currentDisplayText,
                };
                appendMessage(assistantMessage);
              } catch (error) {
                console.log("Parsing error:", error, "Line:", line);
              }
            }
          }

          buffer = lines[lines.length - 1];
        }

        if (!currentDisplayText) {
          assistantMessage = {
            ...assistantMessage,
            content: "No response received",
          };
          appendMessage(assistantMessage);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error:", error);
        setIsLoading(false);

        const assistantMessage: Message = {
          id: uuidv4(),
          content: "Sorry, something went wrong. Please try again.",
          role: "assistant",
          timestamp: new Date().toISOString(),
        };
        appendMessage(assistantMessage);
      }
    },
    [appendMessage, getCurrentModel, getApiKey, settings, previewImage, mode, onPageModification]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter") {
        if (e.ctrlKey) {
          e.preventDefault();
          const textarea = e.currentTarget;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          setInput(
            (prev) => prev.substring(0, start) + "\n" + prev.substring(end)
          );
          setTimeout(() => {
            textarea.setSelectionRange(start + 1, start + 1);
            textarea.focus();
          }, 0);
        } else {
          e.preventDefault();
          if (input.trim()) {
            handleSubmit(input);
          }
        }
      }
    },
    [input, handleSubmit]
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
          className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10 transition-all duration-200 ${sidebarCollapsed ? "ml-0 md:ml-12" : "ml-0 md:ml-64"
            }`}
        >
          <div className="p-4">
            <div className="w-full max-w-[900px] mx-auto">
              {previewImage && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Image Preview
                    </span>
                    <button
                      onClick={() => setPreviewImage(null)}
                      className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-200"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="relative max-w-xs">
                    <Image
                      src={previewImage}
                      alt="Preview"
                      width={200}
                      height={128}
                      className="max-h-32 rounded-lg"
                    />
                  </div>
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (input.trim()) {
                    handleSubmit(input);
                  }
                }}
                className="relative"
              >
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 z-10"
                  >
                    <Paperclip size={18} />
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
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    className="w-full resize-none border border-gray-300 rounded-lg pl-12 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32"
                    rows={3}
                    style={{ minHeight: "80px" }}
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-blue-500 disabled:opacity-50 z-10"
                    disabled={!input.trim() && !previewImage}
                  >
                    <ArrowUp size={18} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4">
          <div className="w-full">
            {previewImage && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Image Preview
                  </span>
                  <button
                    onClick={() => setPreviewImage(null)}
                    className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-200"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="relative max-w-xs">
                  <Image
                    src={previewImage}
                    alt="Preview"
                    width={200}
                    height={128}
                    className="max-h-32 rounded-lg"
                  />
                </div>
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (input.trim()) {
                  handleSubmit(input);
                }
              }}
              className="relative"
            >
              <div className="relative">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 z-10"
                >
                  <Paperclip size={18} />
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
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="w-full resize-none border border-gray-300 rounded-lg pl-12 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32 overflow-y-auto"
                  rows={3}
                  style={{ minHeight: "80px" }}
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-blue-500 disabled:opacity-50 z-10"
                  disabled={!input.trim() && !previewImage}
                >
                  <ArrowUp size={18} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
