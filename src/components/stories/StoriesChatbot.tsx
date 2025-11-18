"use client";
import React, { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { MessageCircle, Send, Loader2, Sparkles } from "lucide-react";

interface StoriesChatbotProps {
  documentId?: string;
  documentType?: 'report' | 'stories';
  platform?: 'jira' | 'trello';
  projectName?: string;
  onContentGenerated?: (content: any) => void;
  className?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function StoriesChatbot({
  documentId,
  documentType = 'report',
  platform = 'jira',
  projectName,
  onContentGenerated,
  className = "",
}: StoriesChatbotProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Generate context-aware system prompt
  const getSystemPrompt = useCallback(() => {
    const basePrompt = `You are an AI assistant specialized in helping with ${documentType === 'report' ? 'project reports' : 'user stories'} for ${platform.toUpperCase()} projects.`;
    
    const contextPrompt = documentType === 'report' 
      ? `Help users create comprehensive project reports with sections like Overview, Requirements, Implementation Plan, and Notes. Focus on clear structure and actionable content.`
      : `Help users create well-structured user stories following ${platform === 'jira' ? 'Jira' : 'Trello'} best practices. Include proper acceptance criteria, priority levels, and assignee information.`;

    const projectContext = projectName ? `Current project: ${projectName}` : '';

    return `${basePrompt} ${contextPrompt} ${projectContext}`;
  }, [documentType, platform, projectName]);

  // Handle sending messages
  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: getSystemPrompt() },
            ...messages.map(msg => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: message.trim() }
          ],
          context: {
            documentId,
            documentType,
            platform,
            projectName,
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content || 'Sorry, I could not generate a response.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If the response contains structured content, notify parent
      if (onContentGenerated && data.structuredContent) {
        onContentGenerated(data.structuredContent);
      }

    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, getSystemPrompt, documentId, documentType, platform, projectName, onContentGenerated]);

  // Handle quick actions
  const handleQuickAction = useCallback((action: string) => {
    const quickPrompts = {
      'improve-report': `Please help me improve this ${documentType} by suggesting additional sections or content that would make it more comprehensive.`,
      'generate-stories': `Based on this report, please generate user stories for ${platform} that cover the main requirements and features.`,
      'add-acceptance-criteria': 'Help me add detailed acceptance criteria to the existing user stories.',
      'review-structure': `Please review the structure of this ${documentType} and suggest improvements.`,
    };

    const prompt = quickPrompts[action as keyof typeof quickPrompts];
    if (prompt) {
      handleSendMessage(prompt);
    }
  }, [documentType, platform, handleSendMessage]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  if (!session) {
    return null;
  }

  return (
    <div className={`stories-chatbot ${className}`}>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors z-50"
        title="Open AI Assistant"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-96 h-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-gray-800">
                {documentType === 'report' ? 'Report' : 'Stories'} Assistant
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 text-sm">
                <p className="mb-3">
                  Hi! I'm here to help you with your {documentType === 'report' ? 'project report' : 'user stories'}.
                </p>
                
                {/* Quick Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => handleQuickAction(documentType === 'report' ? 'improve-report' : 'generate-stories')}
                    className="block w-full text-left px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                  >
                    {documentType === 'report' ? '✨ Improve this report' : '📝 Generate user stories'}
                  </button>
                  
                  <button
                    onClick={() => handleQuickAction('review-structure')}
                    className="block w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    🔍 Review structure
                  </button>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-3 py-2 rounded-lg">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white p-2 rounded-md transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}