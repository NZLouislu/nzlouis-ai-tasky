// UnifiedChatbot with optimized UI
"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PaperPlaneIcon } from "@radix-ui/react-icons";
import { useChat } from "@/lib/hooks/use-chat";
import { v4 as uuidv4 } from "uuid";
import { sendChatMessage } from "@/lib/AssistantRuntime";
import { useAISettings } from "@/lib/useAISettings";
import Image from "next/image";
import { Upload, X } from "lucide-react";

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
  mode: "standalone" | "workspace";
  onPageModification?: (mod: PageModification) => Promise<string>;
}

export default function UnifiedChatbot({
  mode,
  onPageModification,
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
          const file = item.getAsFile();
          if (file) {
            handleImageUpload(file);
          }
          return;
        }
      }

      if (e.clipboardData?.files.length) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith("image/")) {
          e.preventDefault();
          handleImageUpload(file);
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

      const userMessage: Message = {
        id: uuidv4(),
        content: text,
        role: "user",
        timestamp: new Date().toISOString(),
      };

      appendMessage(userMessage);
      setInput("");
      setIsLoading(true);

      try {
        const reply = await sendChatMessage(
          text,
          undefined,
          {
            systemPrompt: settings.systemPrompt,
            selectedModel: settings.selectedModel,
            temperature: settings.temperature,
            maxTokens: settings.maxTokens,
          },
          getCurrentModel,
          getApiKey,
          onPageModification
        );

        appendMessage({
          id: uuidv4(),
          content: reply,
          role: "assistant",
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error:", error);
        appendMessage({
          id: uuidv4(),
          content: "Sorry, something went wrong. Please try again.",
          role: "assistant",
          timestamp: new Date().toISOString(),
        });
      } finally {
        setIsLoading(false);
      }
    },
    [appendMessage, getCurrentModel, onPageModification, getApiKey, settings]
  );

  return (
    <div
      className={`flex flex-col ${
        mode === "standalone" ? "h-full" : "h-[500px]"
      } bg-white`}
    >
      <div className="flex-1 overflow-y-auto px-6 py-4 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-12">
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
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] lg:max-w-[70%] px-4 py-3 rounded-2xl ${
                  message.role === "user"
                    ? "bg-blue-600 text-white ml-12"
                    : "bg-gray-100 text-gray-900 mr-12"
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div
                  className={`text-xs mt-2 opacity-70 ${
                    message.role === "user" ? "text-blue-100" : "text-gray-500"
                  }`}
                >
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 mr-12 px-4 py-3 rounded-2xl">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t shadow-lg">
        <div className="max-w-4xl mx-auto p-4">
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
              handleSubmit(input);
            }}
            className="flex gap-3"
          >
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
            <div className="flex-1 relative">
              <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 flex-shrink-0 h-full flex items-center justify-center"
                  title="Upload image"
                >
                  <Upload size={18} />
                </button>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (e.ctrlKey || e.shiftKey) {
                        setTimeout(() => adjustTextareaHeight(), 0);
                        return;
                      } else {
                        e.preventDefault();
                        handleSubmit(input);
                      }
                    }
                  }}
                  placeholder="Type your message... (Enter to send, Ctrl+Enter or Shift+Enter for new line)"
                  className="flex-1 border-0 focus:ring-0 focus:outline-none resize-none px-3 py-3 rounded-none bg-transparent"
                  style={{
                    minHeight: "44px",
                    maxHeight: "120px",
                    overflow: "auto",
                  }}
                />
              </div>
            </div>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px]"
              disabled={!input.trim() && !previewImage}
            >
              <PaperPlaneIcon className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
