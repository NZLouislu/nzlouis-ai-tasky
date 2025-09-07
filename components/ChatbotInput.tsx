"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useAISettings } from "@/lib/useAISettings";

type Message = {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  image?: string;
  isLoading?: boolean;
};

interface ChatbotInputProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  previewImage: string | null;
  setPreviewImage: (image: string | null) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function ChatbotInput({
  inputValue,
  setInputValue,
  previewImage,
  setPreviewImage,
  onSubmit
}: ChatbotInputProps) {
  const { getCurrentModel } = useAISettings();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputAreaRef = useRef<HTMLDivElement | null>(null);

  const currentModel = getCurrentModel();

  const handleImageUpload = useCallback((file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [setPreviewImage]);

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
  }, [handleImageUpload]);

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const formEvent = new Event("submit", { bubbles: true, cancelable: true }) as unknown as React.FormEvent;
      onSubmit(formEvent);
    }
  };

  return (
    <div ref={inputAreaRef} className="w-full">
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

        <form onSubmit={onSubmit} className="p-4">
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

            <textarea ref={textareaRef} value={inputValue} onChange={(e) => { setInputValue(e.target.value); adjustTextareaHeight(); }} onKeyDown={handleKeyDown} placeholder={currentModel?.supportsVision ? "Type your message or upload an image..." : "Type your message..."} className="flex-1 px-4 py-3 focus:outline-none resize-none max-h-32" rows={3} />

            <button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-3 hover:opacity-90 transition-opacity disabled:opacity-50 self-stretch" disabled={!inputValue.trim() && !previewImage}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500">+Enter for newline • {currentModel ? `${currentModel.name} • ` : ""}{currentModel?.isFree ? "Free model" : `~$${currentModel?.pricing.input}/1K tokens`}</p>
            <a href="/chatbot/settings" className="text-xs text-blue-600 hover:text-blue-800 underline">Settings</a>
          </div>
        </form>
      </div>
    </div>
  );
}