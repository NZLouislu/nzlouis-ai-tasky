"use client";
import React, { useRef } from 'react';
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
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  previewImage: string | null;
  setPreviewImage: (value: string | null) => void;
  onImageUpload: (file: File) => void;
  availableModels: AIModel[];
  selectedModel: string;
  setSelectedModel: (value: string) => void;
  selectedProvider: string;
  setSelectedProvider: (value: string) => void;
  placeholder?: string;
  isMobile?: boolean;
}

export default function ChatInput({
  input,
  setInput,
  onSubmit,
  isLoading,
  previewImage,
  setPreviewImage,
  onImageUpload,
  availableModels,
  selectedModel,
  setSelectedModel,
  selectedProvider,
  setSelectedProvider,
  placeholder = "Type your message... (Ctrl+V to paste screenshot)",
  isMobile = false,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get unique providers
  const getAvailableProviders = () => {
    const providers = new Set(availableModels.map(m => m.provider));
    return Array.from(providers);
  };

  // Get models for selected provider
  const getModelsForProvider = (provider: string) => {
    return availableModels.filter(m => m.provider === provider);
  };

  // Provider display names
  const getProviderName = (provider: string) => {
    const names: Record<string, string> = {
      'google': 'Google Gemini',
      'openai': 'OpenAI',
      'anthropic': 'Anthropic Claude',
      'openrouter': 'OpenRouter',
      'kilo': 'Kilo'
    };
    return names[provider] || provider;
  };

  return (
    <div className="bg-white border-t border-gray-200 p-3 sm:p-4 flex-shrink-0">
      <div className="max-w-[900px] mx-auto">
        {previewImage && (
          <div className="mb-3 relative inline-block">
            <Image
              src={previewImage}
              alt="Preview"
              width={120}
              height={120}
              className="rounded-lg"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
            >
              ×
            </button>
          </div>
        )}
        {availableModels.length === 0 && (
          <div className="mb-3 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            No AI models configured. Please configure your API keys in settings.
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className="relative border-2 border-blue-500 rounded-xl overflow-visible">
            <div className="flex flex-col">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute left-3 top-3 text-gray-400 hover:text-gray-600 z-10"
                >
                  <Paperclip size={20} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      onImageUpload(e.target.files[0]);
                    }
                  }}
                  accept="image/*"
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
                      if ((input.trim() || previewImage) && selectedModel) {
                        onSubmit(e);
                      }
                    }
                  }}
                  style={{ minHeight: '80px', maxHeight: '200px' }}
                />
                <button
                  type="submit"
                  disabled={(!input.trim() && !previewImage) || !selectedModel || isLoading}
                  className="absolute right-3 top-3 bg-teal-500 text-white rounded-full p-2 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </button>
              </div>

              {availableModels.length > 0 && (
                <div className="border-t border-gray-200 px-3 py-2 bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    {/* Provider Selection */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500">Provider:</span>
                      <select
                        value={selectedProvider}
                        onChange={(e) => {
                          const newProvider = e.target.value;
                          setSelectedProvider(newProvider);
                          // Auto-select first model of new provider
                          const providerModels = getModelsForProvider(newProvider);
                          if (providerModels.length > 0) {
                            setSelectedModel(providerModels[0].id);
                          }
                        }}
                        className="text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-colors"
                      >
                        {getAvailableProviders().map(provider => (
                          <option key={provider} value={provider}>
                            {getProviderName(provider)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Model Selection */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500">Model:</span>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-colors max-w-[200px]"
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

                    {/* Status Icon */}
                    {(() => {
                      const currentModel = availableModels.find(m => m.id === selectedModel);
                      if (!currentModel) return null;
                      
                      if (currentModel.tested === true && currentModel.working === true) {
                        return (
                          <div className="flex items-center text-green-600" title="Model tested and working">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        );
                      }
                      
                      if (currentModel.tested === true && currentModel.working === false) {
                        return (
                          <div className="flex items-center text-red-600" title="Model test failed">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        );
                      }
                      
                      return null;
                    })()}
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
