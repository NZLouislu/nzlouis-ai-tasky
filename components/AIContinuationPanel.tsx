"use client";
import { useState, useEffect, useCallback } from "react";
import { aiContinuationService, ContinuationRequest, ContinuationResponse } from "@/lib/AIContinuationService";
import { Sparkles, Check, X, RotateCcw, Wand2 } from "lucide-react";

interface AIContinuationPanelProps {
  selectedText: string;
  contextBefore: string;
  contextAfter: string;
  onAccept: (suggestion: string) => void;
  onClose: () => void;
  position: { x: number; y: number };
}

export default function AIContinuationPanel({
  selectedText,
  contextBefore,
  contextAfter,
  onAccept,
  onClose,
  position
}: AIContinuationPanelProps) {
  const [suggestions, setSuggestions] = useState<ContinuationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<"continue" | "rewrite" | "summarize" | "expand">("continue");

  const actions = [
    { id: "continue" as const, label: "Continue", icon: "➡️" },
    { id: "rewrite" as const, label: "Rewrite", icon: "✏️" },
    { id: "summarize" as const, label: "Summarize", icon: "📝" },
    { id: "expand" as const, label: "Expand", icon: "🔍" }
  ];

  const generateSuggestions = useCallback(async (action: typeof activeAction) => {
    setLoading(true);
    setActiveAction(action);

    const request: ContinuationRequest = {
      selectedText,
      contextBefore,
      contextAfter,
      action
    };

    try {
      // For now, we'll use a simple mock implementation
      // In a real implementation, you'd get these from useAISettings
      const mockSettings = {
        systemPrompt: "You are a helpful writing assistant.",
        selectedModel: "gpt-3.5-turbo",
        temperature: 0.7,
        maxTokens: 2048
      };
      const mockGetCurrentModel = () => ({ id: "gpt-3.5-turbo", provider: "openai" });
      const mockGetApiKey = () => "mock-api-key";

      const newSuggestions = await aiContinuationService.getMultipleSuggestions(
        request,
        mockSettings,
        mockGetCurrentModel,
        mockGetApiKey,
        3
      );
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error("Failed to generate suggestions:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedText, contextBefore, contextAfter]);

  useEffect(() => {
    generateSuggestions(activeAction);
  }, [activeAction, generateSuggestions]);

  const handleAccept = (suggestion: string) => {
    onAccept(suggestion);
    onClose();
  };

  return (
    <div
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[400px] max-w-[600px]"
      style={{
        left: Math.min(position.x, window.innerWidth - 420),
        top: Math.min(position.y, window.innerHeight - 300)
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900">AI Writing Assistant</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-2">Selected text:</div>
        <div className="bg-gray-50 p-3 rounded text-sm text-gray-800 max-h-20 overflow-y-auto">
          {selectedText}
        </div>
      </div>

      <div className="flex space-x-2 mb-4">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => generateSuggestions(action.id)}
            disabled={loading}
            className={`flex items-center space-x-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
              activeAction === action.id
                ? "bg-blue-100 text-blue-700 border border-blue-200"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span>{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      <div className="space-y-3 max-h-60 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
            </div>
            <span className="ml-3 text-sm text-gray-600">Generating suggestions...</span>
          </div>
        ) : (
          suggestions.map((suggestion, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Wand2 className="h-4 w-4 text-blue-500" />
                  <span className="text-xs text-gray-500">Suggestion {index + 1}</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    {Math.round(suggestion.confidence * 100)}% confidence
                  </span>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleAccept(suggestion.suggestion)}
                    className="text-green-600 hover:text-green-700 p-1 rounded hover:bg-green-50"
                    title="Accept suggestion"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => generateSuggestions(activeAction)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                    title="Regenerate"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-800 whitespace-pre-wrap">
                {suggestion.suggestion}
              </div>
            </div>
          ))
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            Click the checkmark to accept a suggestion, or close this panel to cancel
          </div>
        </div>
      )}
    </div>
  );
}