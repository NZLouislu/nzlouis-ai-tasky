"use client";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { useAISettings } from "@/lib/useAISettings";

interface MentionItem {
  id: string;
  type: "page" | "heading" | "paragraph";
  title: string;
  content?: string;
}

interface ChatbotInputProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  previewImage: string | null;
  setPreviewImage: (image: string | null) => void;
  onSubmit: (e: React.FormEvent) => void;
  mentionItems?: MentionItem[];
}

export default function ChatbotInput({
  inputValue,
  setInputValue,
  previewImage,
  setPreviewImage,
  onSubmit,
  mentionItems = [],
}: ChatbotInputProps) {
  const { getCurrentModel } = useAISettings();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputAreaRef = useRef<HTMLDivElement | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  const currentModel = getCurrentModel();

  const handleImageUpload = useCallback(
    (file: File) => {
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [setPreviewImage]
  );

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

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      const minHeight = 24;
      const maxHeight = 200;
      const newHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight));
      textarea.style.height = `${newHeight}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue, adjustTextareaHeight]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleImageUpload(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const filteredMentions = useMemo(() => {
    if (!mentionQuery) return mentionItems.slice(0, 5);
    return mentionItems
      .filter(
        (item) =>
          item.title.toLowerCase().includes(mentionQuery.toLowerCase()) ||
          item.content?.toLowerCase().includes(mentionQuery.toLowerCase())
      )
      .slice(0, 5);
  }, [mentionItems, mentionQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf("@");

    if (atIndex !== -1 && atIndex === textBeforeCursor.length - 1) {
      setShowMentions(true);
      setMentionQuery("");
      setSelectedMentionIndex(0);
    } else if (atIndex !== -1) {
      const query = textBeforeCursor.substring(atIndex + 1);
      if (query.includes(" ")) {
        setShowMentions(false);
      } else {
        setShowMentions(true);
        setMentionQuery(query);
        setSelectedMentionIndex(0);
      }
    } else {
      setShowMentions(false);
    }

    adjustTextareaHeight();
  };

  const handleMentionSelect = (mention: MentionItem) => {
    const cursorPosition = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = inputValue.substring(0, cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf("@");
    const textAfterCursor = inputValue.substring(cursorPosition);

    const newText =
      textBeforeCursor.substring(0, atIndex) +
      `@${mention.title}` +
      textAfterCursor;
    setInputValue(newText);
    setShowMentions(false);

    setTimeout(() => {
      const newCursorPosition = atIndex + mention.title.length + 1;
      textareaRef.current?.setSelectionRange(
        newCursorPosition,
        newCursorPosition
      );
      textareaRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedMentionIndex((prev) =>
          Math.min(prev + 1, filteredMentions.length - 1)
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedMentionIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (filteredMentions[selectedMentionIndex]) {
          handleMentionSelect(filteredMentions[selectedMentionIndex]);
        }
      } else if (e.key === "Escape") {
        setShowMentions(false);
      }
      return;
    }

    if (e.key === "Enter") {
      if (e.ctrlKey || e.shiftKey) {
        setTimeout(() => adjustTextareaHeight(), 0);
        return;
      } else {
        e.preventDefault();
        const formEvent = new Event("submit", {
          bubbles: true,
          cancelable: true,
        }) as unknown as React.FormEvent;
        onSubmit(formEvent);
      }
    }
  };

  return (
    <div ref={inputAreaRef} className="w-full">
      <div className="bg-white rounded-t-xl">
        {previewImage && (
          <div className="px-4 py-2 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Image Preview
              </span>
              <button
                onClick={() => setPreviewImage(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
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

        <form onSubmit={onSubmit} className="p-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />

          {currentModel?.supportsVision && (
            <div className="mb-2 text-xs text-gray-600 flex items-center">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium mr-2">
                👁️ Vision Enabled
              </span>
              <span>Upload images or paste screenshots to analyze</span>
            </div>
          )}

          <div
            className="flex items-end rounded-2xl border-2 border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white shadow-lg"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                currentModel?.supportsVision
                  ? "Type your message or upload an image..."
                  : "Type your message..."
              }
              className="flex-1 px-4 py-3 focus:outline-none resize-none overflow-y-auto leading-5"
              rows={1}
              style={{
                minHeight: "24px",
                maxHeight: "200px",
              }}
            />

            {currentModel?.supportsImages && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg mx-1"
                title="Upload image"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}

            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 mx-1"
              disabled={!inputValue.trim() && !previewImage}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V15a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {showMentions && filteredMentions.length > 0 && (
            <div className="absolute bottom-full left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
              {filteredMentions.map((mention, index) => (
                <button
                  key={mention.id}
                  onClick={() => handleMentionSelect(mention)}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-3 ${
                    index === selectedMentionIndex ? "bg-blue-50" : ""
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full ${
                      mention.type === "page"
                        ? "bg-blue-500"
                        : mention.type === "heading"
                        ? "bg-green-500"
                        : "bg-gray-500"
                    }`}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {mention.title}
                    </div>
                    {mention.content && (
                      <div className="text-xs text-gray-500 truncate">
                        {mention.content}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 capitalize">
                    {mention.type}
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500">
              Ctrl+Enter or Shift+Enter for newline • Enter to send •{" "}
              {currentModel ? `${currentModel.name} • ` : ""}
              {currentModel?.isFree
                ? "Free model"
                : `~$${currentModel?.pricing.input}/1K tokens`}
            </p>
            <a
              href="/chatbot/settings"
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Settings
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
