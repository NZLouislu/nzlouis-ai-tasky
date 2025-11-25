"use client";
import React, { useRef, useMemo, useCallback, useState } from 'react';
import { Send, Paperclip, Globe, Settings } from 'lucide-react';
import Image from 'next/image';

interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  tested?: boolean;
  working?: boolean;
}

interface ChatInputProps {
  onSubmit: (text: string, options?: { searchWeb?: boolean }) => void;
  isLoading: boolean;
  previewImages: string[];
  setPreviewImages: (value: string[]) => void;
  onImageUpload: (files: FileList | null) => void;
  availableModels: AIModel[];
  selectedModel: string;
  setSelectedModel: (value: string) => void;
  selectedProvider: string;
  setSelectedProvider: (value: string) => void;
  placeholder?: string;
  isMobile?: boolean;
}

export default function ChatInput({
  onSubmit,
  isLoading,
  previewImages,
  setPreviewImages,
  onImageUpload,
  availableModels,
  selectedModel,
  setSelectedModel,
  selectedProvider,
  setSelectedProvider,
  placeholder = "Type your message... (Ctrl+V to paste screenshot)",
  isMobile = false,
}: ChatInputProps) {
  const [input, setInput] = React.useState("");
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableProviders = useMemo(() => {
    const providers = new Set(availableModels.map(m => m.provider));
    return Array.from(providers);
  }, [availableModels]);

  const currentProviderModels = useMemo(() => {
    return availableModels.filter(m => m.provider === selectedProvider);
  }, [availableModels, selectedProvider]);

  const getProviderName = useCallback((provider: string) => {
    const names: Record<string, string> = {
      'google': 'Google Gemini',
      'openai': 'OpenAI',
      'anthropic': 'Anthropic Claude',
      'openrouter': 'OpenRouter',
      'kilo': 'Kilo'
    };
    return names[provider] || provider;
  }, []);

  const removeImage = useCallback((index: number) => {
    const newImages = [...previewImages];
    newImages.splice(index, 1);
    setPreviewImages(newImages);
  }, [previewImages, setPreviewImages]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || previewImages.length > 0) && selectedModel) {
      onSubmit(input, { searchWeb: isSearchEnabled });
      setInput("");
    }
  }, [input, previewImages, selectedModel, onSubmit, isSearchEnabled]);

  return (
    <div className="bg-white border-t border-gray-200 p-3 sm:p-4 flex-shrink-0">
      <div className="w-full max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto">
        {previewImages.length > 0 && (
          <div className="mb-3 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-3">
                {previewImages.map((img, index) => (
                  <div key={index} className="relative">
                    <Image
                      src={img}
                      alt={`Preview ${index + 1}`}
                      width={100}
                      height={100}
                      className="rounded-lg border-2 border-white shadow-sm object-cover w-24 h-24"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 shadow-md transition-colors text-sm"
                      title="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="pt-1">
                <p className="text-sm font-medium text-blue-900">{previewImages.length} image{previewImages.length > 1 ? 's' : ''} attached</p>
                <p className="text-xs text-blue-700 mt-1">Type your message below and send together</p>
              </div>
            </div>
          </div>
        )}
        {availableModels.length === 0 && (
          <div className="mb-3 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium mb-2">
              ⚠️ No AI models configured
            </p>
            <p className="text-xs text-yellow-700 mb-3">
              Please configure your API keys to start using the chatbot.
            </p>
            <a
              href="/chatbot/settings"
              className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <Settings size={16} />
              Go to Settings
            </a>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="relative border-2 border-blue-500 rounded-xl overflow-visible">
            <div className="flex flex-col">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute left-3 top-3 text-gray-500 hover:text-blue-600 transition-colors z-10 p-1 hover:bg-blue-50 rounded"
                  title="Upload images (or paste with Ctrl+V)"
                >
                  <Paperclip size={20} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      onImageUpload(e.target.files);
                      e.target.value = '';
                    }
                  }}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isMobile ? "Type message..." : placeholder}
                  className="w-full resize-none border-0 pl-12 pr-14 sm:pr-16 pt-3 pb-10 focus:outline-none focus:ring-0"
                  rows={1}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={() => setIsComposing(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !isComposing && !isMobile) {
                      e.preventDefault();
                      if ((input.trim() || previewImages.length > 0) && selectedModel) {
                        handleSubmit(e);
                      }
                    }
                  }}
                  style={{ 
                    minHeight: '80px', 
                    maxHeight: '200px',
                    boxSizing: 'border-box',
                    maxWidth: '100%',
                    width: '100%',
                    fontSize: '16px',
                    WebkitTextSizeAdjust: '100%',
                  }}
                />
                <button
                  type="submit"
                  disabled={(!input.trim() && previewImages.length === 0) || !selectedModel || isLoading}
                  className={`absolute right-3 top-3 bg-teal-500 text-white rounded-full p-2 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 ${isLoading && isSearchEnabled ? 'pl-3 pr-4 w-auto' : 'w-9 h-9 justify-center'}`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {isSearchEnabled && <span className="text-xs font-medium">Searching...</span>}
                    </>
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>

              {availableModels.length > 0 && (
                <div className="border-t border-gray-200 px-3 py-2 bg-gray-50/50">
                  <div className={`flex ${isMobile ? 'flex-col gap-2' : 'flex-row items-center gap-4'}`}>
                    <div className={`flex items-center gap-1.5 ${isMobile ? 'w-full' : ''}`}>
                      <span className="text-xs text-gray-500 whitespace-nowrap">Provider:</span>
                      <select
                        value={selectedProvider}
                        onChange={(e) => {
                          const newProvider = e.target.value;
                          setSelectedProvider(newProvider);
                          const providerModels = availableModels.filter(m => m.provider === newProvider);
                          if (providerModels.length > 0) {
                            setSelectedModel(providerModels[0].id);
                          }
                        }}
                        className={`text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-colors ${isMobile ? 'flex-1' : 'w-auto'}`}
                      >
                        {availableProviders.map(provider => (
                          <option key={provider} value={provider}>
                            {getProviderName(provider)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={`flex ${isMobile ? 'flex-row items-center justify-between w-full gap-2' : 'contents'}`}>
                      <div className={`flex items-center gap-1.5 ${isMobile ? 'flex-1 min-w-0' : 'mr-4'}`}>
                        <span className="text-xs text-gray-500 whitespace-nowrap">Model:</span>
                        <select
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          className={`text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-colors ${isMobile ? 'flex-1 w-full' : 'w-auto max-w-[200px]'}`}
                        >
                          {currentProviderModels.map(model => (
                            <option key={model.id} value={model.id}>
                              {model.tested === true && model.working === true && '✓ '}
                              {model.tested === true && model.working === false && '✗ '}
                              {model.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={`${!isMobile ? 'ml-auto' : 'flex-shrink-0'}`}>
                        <button
                          type="button"
                          onClick={() => setIsSearchEnabled(!isSearchEnabled)}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                            isSearchEnabled 
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title={selectedProvider === 'google' ? "Enable Google Search Grounding" : "Web search (requires Tavily API key)"}
                        >
                          <Globe size={14} />
                          <span className={`${isMobile ? 'hidden sm:inline' : 'inline'}`}>Search</span>
                          <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${isSearchEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}>
                            <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${isSearchEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
