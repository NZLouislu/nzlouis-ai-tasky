"use client";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useAISettings } from "@/lib/useAISettings";
import { ArrowUp, Paperclip } from "lucide-react";

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
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  const currentModel = getCurrentModel();
  const supportsVision = currentModel?.supportsVision;

  const handleImageUpload = useCallback(
    (file: File) => {
      if (file && file.type.startsWith("image/") && supportsVision) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [setPreviewImage, supportsVision]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items || []);
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          e.stopPropagation();
          const file = item.getAsFile();
          if (file) handleImageUpload(file);
          return;
        }
      }
    };
    textarea.addEventListener("paste", handlePaste);
    return () => textarea.removeEventListener("paste", handlePaste);
  }, [handleImageUpload]);

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 40), 200);
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

    const atIndex = value.lastIndexOf("@");
    if (atIndex !== -1 && !value.substring(atIndex + 1).includes(" ")) {
      setShowMentions(true);
      setMentionQuery(value.substring(atIndex + 1));
      setSelectedMentionIndex(0);
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (mention: MentionItem) => {
    const atIndex = inputValue.lastIndexOf("@");
    if (atIndex === -1) return;
    const newText = `${inputValue.substring(0, atIndex)}@${mention.title} `;
    setInputValue(newText);
    setShowMentions(false);
    textareaRef.current?.focus();
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
        handleMentionSelect(filteredMentions[selectedMentionIndex]);
      } else if (e.key === "Escape") {
        setShowMentions(false);
      }
      return;
    }

    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      onSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={onSubmit} className="relative">
        <div className="relative flex items-center">
          {supportsVision && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <Paperclip size={20} />
            </button>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="w-full pl-2 pr-12 py-2 resize-none border-none focus:outline-none focus:ring-0 bg-transparent"
            rows={1}
            style={{ minHeight: "40px" }}
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300"
            disabled={!inputValue.trim() && !previewImage}
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </form>
      {showMentions && filteredMentions.length > 0 && (
        <div className="absolute bottom-full mb-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
          {filteredMentions.map((mention, index) => (
            <button
              key={mention.id}
              onClick={() => handleMentionSelect(mention)}
              className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                index === selectedMentionIndex ? "bg-gray-100" : ""
              }`}
            >
              {mention.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
