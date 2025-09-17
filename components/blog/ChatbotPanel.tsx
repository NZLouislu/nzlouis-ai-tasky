import React from "react";
import { FaTimes as X, FaComments as MessageCircle } from "react-icons/fa";
import UnifiedChatbot from "../UnifiedChatbot";

interface PageModification {
  type: string;
  target?: string;
  content?: string;
  title?: string;
}

interface ChatbotPanelProps {
  isChatbotVisible: boolean;
  isMobile: boolean;
  chatbotWidth: number;
  setIsChatbotVisible: (visible: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  handleMouseDown: (e: React.MouseEvent) => void;
  handlePageModification: (mod: PageModification) => Promise<string>;
}

export default function ChatbotPanel({
  isChatbotVisible,
  isMobile,
  chatbotWidth,
  setIsChatbotVisible,
  setSidebarOpen,
  setSidebarCollapsed,
  handleMouseDown,
  handlePageModification,
}: ChatbotPanelProps) {
  if (!isChatbotVisible) {
    return (
      !isMobile && (
        <button
          onClick={() => {
            setIsChatbotVisible(true);
            setSidebarOpen(false);
            setSidebarCollapsed(true);
          }}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-30"
          title="Open Chatbot"
        >
          <MessageCircle size={24} />
        </button>
      )
    );
  }

  return (
    <>
      <div
        className="fixed right-0 w-1.5 bg-gray-200 hover:bg-gray-300 cursor-col-resize z-20 flex items-center justify-center transition-all duration-300 flex-shrink-0"
        onMouseDown={handleMouseDown}
        style={{
          right: `${chatbotWidth}px`,
          top: "64px",
          bottom: "0",
        }}
      ></div>
      <div
        className="fixed right-0 bg-white shadow-xl flex flex-col z-10 transition-all duration-300"
        style={{
          width: chatbotWidth,
          top: "64px",
          bottom: "0",
        }}
      >
        <div className="p-4 border-b border-gray-200 flex-shrink-0 relative">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">AI Blog Assistant</h3>
            <button
              onClick={() => setIsChatbotVisible(false)}
              className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100 transition-colors"
              title="Close Chatbot"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <UnifiedChatbot
            mode="workspace"
            onPageModification={handlePageModification}
          />
        </div>
      </div>
    </>
  );
}
