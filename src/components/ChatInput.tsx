"use client";
import React, { useRef, useMemo, useCallback } from 'react';
import { Send, Paperclip } from 'lucide-react';
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
  onSubmit: (text: string) => void;
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableProviders = useMemo(() => {
    const providers = new Set(availableModels.map(m => m.provider));
    return Array.from(providers);
  }, [availableModels]);

  const getModelsForProvider = useCallback((provider: string) => {
    return availableModels.filter(m => m.provider === provider);
  }, [availableModels]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || previewImages.length > 0) && selectedModel) {
      onSubmit(input);
      setInput("");
    }
  };

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
          <div className="mb-3 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            No AI models configured. Please configure your API keys in settings.
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
                  className="w-full resize-none border-0 pl-12 pr-14 sm:pr-16 pt-3 pb-10 text-sm sm:text-base focus:outline-none focus:ring-0"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if ((input.trim() || previewImages.length > 0) && selectedModel) {
                        handleSubmit(e);
                      }
                    }
                  }}
                  style={{ minHeight: '80px', maxHeight: '200px' }}
                />
                <button
                  type="submit"
                  disabled={(!input.trim() && previewImages.length === 0) || !selectedModel || isLoading}
                  className="absolute right-3 top-3 bg-teal-500 text-white rounded-full p-2 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>

              {availableModels.length > 0 && (
                <div className="border-t border-gray-200 px-3 py-2 bg-gray-50/50">
                  <div className={`flex flex-col ${!isMobile ? 'sm:flex-row sm:items-center sm:gap-4' : ''} gap-2`}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500 whitespace-nowrap">Provider:</span>
                      <select
                        value={selectedProvider}
                        onChange={(e) => {
                          const newProvider = e.target.value;
                          setSelectedProvider(newProvider);
                          const providerModels = getModelsForProvider(newProvider);
                          if (providerModels.length > 0) {
                            setSelectedModel(providerModels[0].id);
                          }
                        }}
                        className={`text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-colors w-full ${!isMobile ? 'sm:w-auto' : ''}`}
                      >
                        {availableProviders.map(provider => (
                          <option key={provider} value={provider}>
                            {getProviderName(provider)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500 whitespace-nowrap">Model:</span>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className={`text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-colors w-full ${!isMobile ? 'sm:w-auto max-w-full sm:max-w-[200px]' : ''}`}
                      >
                        {getModelsForProvider(selectedProvider).map(model => (
                          <option key={model.id} value={model.id}>
                            {model.tested === true && model.working === true && '✓ '}
                            {model.tested === true && model.working === false && '✗ '}
                            {model.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status icon removed as per request */}
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
