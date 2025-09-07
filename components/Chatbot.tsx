"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import { useAISettings } from "@/lib/useAISettings";
import { getVisionModels } from "@/lib/aiConfig";
import ChatbotInput from "./ChatbotInput";

type Message = {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  image?: string;
  isLoading?: boolean;
};

export default function Chatbot() {
  const { settings, getCurrentModel, getApiKey } = useAISettings();
  const [currentSessionId, setCurrentSessionId] = useState("default");
  const [sessionMessages, setSessionMessages] = useState<Record<string, Message[]>>({
    "default": []
  });
  const [inputValue, setInputValue] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const messages = useMemo(() => sessionMessages[currentSessionId] || [], [sessionMessages, currentSessionId]);
  
  const handleNewSession = () => {
    const newId = `session-${Date.now()}`;
    setSessionMessages(prev => ({ ...prev, [newId]: [] }));
    setCurrentSessionId(newId);
    setInputValue("");
    setPreviewImage(null);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() === "" && !previewImage) return;
    const currentModel = getCurrentModel();
    if (!currentModel) {
      alert("Please select a model in settings");
      return;
    }
    const apiKey = getApiKey(currentModel.provider);
    if (currentModel.provider !== "google" && !apiKey) {
      alert(`Please set your ${currentModel.provider} API key in settings`);
      return;
    }
    const newMessage: Message = {
      id: Date.now(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
      ...(previewImage && { image: previewImage })
    };
    
    // Save current messages before updating state
    const currentMessages = [...messages];
    
    setSessionMessages(prev => {
      const updated = { ...prev };
      updated[currentSessionId] = [...currentMessages, newMessage];
      return updated;
    });
    
    setInputValue("");
    setPreviewImage(null);
    setIsLoading(true);
    try {
      // Use saved currentMessages (without new messages) for request
      const chatMessages = [
        { role: "system", content: settings.systemPrompt },
        ...currentMessages.map(msg => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.text,
          ...(msg.image && { image: msg.image })
        })),
        {
          role: "user",
          content: newMessage.text,
          ...(newMessage.image && { image: newMessage.image })
        }
      ];
      
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          modelId: settings.selectedModel,
          messages: chatMessages,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
          apiKey: apiKey
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to get response from AI");
      }
      
      const data = await response.json();
      
      // Add AI response message
      const aiMessage: Message = {
        id: Date.now(),
        text: data.response,
        sender: "bot",
        timestamp: new Date()
      };

      setSessionMessages(prev => {
        const updated = { ...prev };
        updated[currentSessionId] = [...updated[currentSessionId], aiMessage];
        return updated;
      });
    } catch (error) {
      console.error("Chat error:", error);
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now(),
        text: "Sorry, I encountered an error. Please try again.",
        sender: "bot",
        timestamp: new Date()
      };

      setSessionMessages(prev => {
        const updated = { ...prev };
        updated[currentSessionId] = [...updated[currentSessionId], errorMessage];
        return updated;
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => scrollToBottom(), 120);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderMessageContent = (message: Message) => {
    if (message.isLoading) {
      return (
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
          </div>
          <span className="text-sm text-gray-500">AI is thinking...</span>
        </div>
      );
    }
    return (
      <div>
        {message.image && (
          <div className="mb-2">
            <Image src={message.image} alt="Uploaded content" width={400} height={300} className="max-w-full max-h-48 rounded-lg" />
          </div>
        )}
        {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}
      </div>
    );
  };

  const currentModel = getCurrentModel();
  const visionModels = getVisionModels();

  return (
    <div className="flex flex-col h-full w-full max-w-[900px] mx-auto px-2 md:pl-8 md:pr-2 lg:pl-8 lg:pr-2 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-lg overflow-hidden relative">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-white/20 rounded-full p-2 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-lg">AI Assistant</h1>
              <p className="text-sm text-blue-100">
                {currentModel ? `${currentModel.name} • ${currentModel.provider}` : "Select a model"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {currentModel?.supportsVision && <div className="bg-white/20 rounded-full px-2 py-1 text-xs">👁️ Vision</div>}
            <button onClick={handleNewSession} className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors" title="New chat session">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
            <button onClick={() => setShowModelSelector(!showModelSelector)} className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors" title="Change model">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        {showModelSelector && (
          <div className="mt-4 bg-white/10 rounded-lg p-3">
            <div className="text-sm text-blue-100 mb-2">Quick Model Switch</div>
            <div className="grid grid-cols-2 gap-2">
              {visionModels.slice(0, 4).map(model => (
                <button key={model.id} onClick={() => { alert(`Switch to ${model.name}? Go to Settings to change models.`); setShowModelSelector(false); }} className="bg-white/20 hover:bg-white/30 rounded px-2 py-1 text-xs transition-colors">
                  {model.name}
                </button>
              ))}
            </div>
            <div className="mt-2 text-center">
              <a href="/chatbot/settings" className="text-blue-200 hover:text-white text-xs underline">More options →</a>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-4">
        {messages.map(message => (
          <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div className="flex max-w-[85%] md:max-w-[75%]">
              {message.sender === "bot" && (
                <div className="mr-3 mt-1">
                  <div className="bg-indigo-500 w-8 h-8 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
              <div className={`p-4 rounded-2xl ${message.sender === "user" ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-tr-none" : "bg-white text-gray-800 rounded-tl-none shadow-sm"}`}>
                {renderMessageContent(message)}
                <p className={`text-xs mt-1 ${message.sender === "user" ? "text-blue-200" : "text-gray-500"}`}>{formatTime(message.timestamp)}</p>
              </div>
              {message.sender === "user" && (
                <div className="ml-3 mt-1">
                  <div className="bg-blue-500 w-8 h-8 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <ChatbotInput
        inputValue={inputValue}
        setInputValue={setInputValue}
        previewImage={previewImage}
        setPreviewImage={setPreviewImage}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
