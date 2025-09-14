"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  aiContinuationService,
  ContinuationRequest,
  ContinuationResponse,
} from "@/lib/AIContinuationService";
import { useAISettings } from "@/lib/useAISettings";
import { Sparkles, Check, X, RotateCcw, Wand2 } from "lucide-react";

interface AIContinuationPanelProps {
  selectedText: string;
  contextBefore: string;
  contextAfter: string;
  onAccept: (suggestion: string) => void;
  onClose: () => void;
  position: { x: number; y: number };
}

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 5000;
const requestCache = new Map<string, ContinuationResponse[]>();

export default function AIContinuationPanel({
  selectedText,
  contextBefore,
  contextAfter,
  onAccept,
  onClose,
  position,
}: AIContinuationPanelProps) {
  const [suggestions, setSuggestions] = useState<ContinuationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<
    "continue" | "rewrite" | "summarize" | "expand"
  >("continue");
  const { settings, getCurrentModel, getApiKey, isLoaded } = useAISettings();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const actions = [
    { id: "continue" as const, label: "Continue", icon: "➡️" },
    { id: "rewrite" as const, label: "Rewrite", icon: "✏️" },
    { id: "summarize" as const, label: "Summarize", icon: "📝" },
    { id: "expand" as const, label: "Expand", icon: "🔍" },
  ];

  const generateSuggestions = useCallback(
    async (action: typeof activeAction) => {
      if (!isLoaded) return;

      const cacheKey = `${selectedText}-${action}`;
      const cached = requestCache.get(cacheKey);
      if (cached) {
        setSuggestions(cached);
        return;
      }

      const now = Date.now();
      if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
        const waitTime = MIN_REQUEST_INTERVAL - (now - lastRequestTime);
        setSuggestions([
          {
            suggestion: `API quota limit: Please wait ${Math.ceil(
              waitTime / 1000
            )} seconds before trying again. Consider using a different AI model or reducing request frequency.`,
            confidence: 0,
          },
        ]);
        return;
      }

      lastRequestTime = now;
      setLoading(true);
      setActiveAction(action);
      setSuggestions([]);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(async () => {
        const request: ContinuationRequest = {
          selectedText,
          contextBefore,
          contextAfter,
          action,
        };

        try {
          const currentModel = getCurrentModel();
          if (!currentModel) {
            throw new Error("Please select an AI model in settings");
          }

          const apiKey = getApiKey(currentModel.provider);
          if (currentModel.provider !== "google" && !apiKey) {
            throw new Error(
              `Please configure ${currentModel.provider} API key in settings`
            );
          }

          const newSuggestions =
            await aiContinuationService.getMultipleSuggestions(
              request,
              settings,
              getCurrentModel,
              getApiKey
            );

          requestCache.set(cacheKey, newSuggestions);
          setSuggestions(newSuggestions);
        } catch (error) {
          console.error("Failed to generate suggestions:", error);
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to generate suggestions";

          let userFriendlyMessage = errorMessage;
          if (
            errorMessage.includes("rate limit") ||
            errorMessage.includes("429")
          ) {
            userFriendlyMessage =
              "API request too frequent, please try again later. Suggestions:\n1. Wait 1-2 minutes before retrying\n2. Consider upgrading your API plan\n3. Use a different AI model";
          } else if (
            errorMessage.includes("quota") ||
            errorMessage.includes("RESOURCE_EXHAUSTED")
          ) {
            userFriendlyMessage =
              "API quota exhausted, please:\n1. Wait for quota reset\n2. Upgrade to a paid plan\n3. Use a different AI provider";
          }

          setSuggestions([
            {
              suggestion: `Error: ${userFriendlyMessage}`,
              confidence: 0,
            },
          ]);
        } finally {
          setLoading(false);
        }
      }, 2000);
    },
    [
      selectedText,
      contextBefore,
      contextAfter,
      settings,
      getCurrentModel,
      getApiKey,
      isLoaded,
    ]
  );

  useEffect(() => {}, [activeAction, generateSuggestions, isLoaded]);

  const handleAccept = (suggestion: string) => {
    onAccept(suggestion);
    onClose();
  };

  return (
    <div
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[400px] max-w-[600px]"
      style={{
        left: Math.max(20, Math.min(position.x, window.innerWidth - 420)),
        top: Math.max(20, Math.min(position.y, window.innerHeight - 300)),
        transform: "none",
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
          title="Close panel"
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
        {!isLoaded ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex space-x-2">
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
            <span className="ml-3 text-sm text-gray-600">
              Loading AI settings...
            </span>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
            <span className="ml-3 text-sm text-gray-600">
              Generating suggestions...
            </span>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 text-sm">
              <p className="mb-2">🚀 AI Writing Assistant is ready!</p>
              <p className="mb-3">
                Click the buttons above to get AI writing suggestions.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs">
                <p className="font-medium text-yellow-800 mb-1">
                  ❗ Important Notes:
                </p>
                <ul className="text-yellow-700 space-y-1">
                  <li>• Free API limited to 2 requests per minute</li>
                  <li>• Please use moderately to avoid frequent clicks</li>
                  <li>• Wait at least 5 seconds between requests</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`border rounded-lg p-3 ${
                suggestion.confidence === 0
                  ? "border-red-200 bg-red-50"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Wand2
                    className={`h-4 w-4 ${
                      suggestion.confidence === 0
                        ? "text-red-500"
                        : "text-blue-500"
                    }`}
                  />
                  <span className="text-xs text-gray-500">
                    Suggestion {index + 1}
                  </span>
                  {suggestion.confidence > 0 && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      {Math.round(suggestion.confidence * 100)}% confidence
                    </span>
                  )}
                </div>
                {suggestion.confidence > 0 && (
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
                )}
              </div>
              <div
                className={`text-sm whitespace-pre-wrap ${
                  suggestion.confidence === 0 ? "text-red-700" : "text-gray-800"
                }`}
              >
                {suggestion.suggestion}
              </div>
            </div>
          ))
        )}
      </div>

      {!isLoaded ? null : suggestions.length > 0 &&
        suggestions.some((s) => s.confidence > 0) ? (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            Click the checkmark to accept a suggestion, or close this panel to
            cancel
          </div>
        </div>
      ) : suggestions.some((s) => s.confidence === 0) ? (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="text-xs text-red-600 text-center">
            <p>AI connection failed. Please check your settings:</p>
            <p className="mt-1">
              Go to Chatbot → Settings to configure your API keys
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
