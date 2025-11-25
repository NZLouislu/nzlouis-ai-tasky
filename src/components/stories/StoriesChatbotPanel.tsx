import React from "react";
import { FaTimes as X, FaComments as MessageCircle } from "react-icons/fa";
import dynamic from "next/dynamic";

const UnifiedChatbot = dynamic(() => import("../UnifiedChatbot"), {
  loading: () => <div className="h-full flex items-center justify-center text-gray-400">Loading chat interface...</div>,
  ssr: false,
});

interface PageModification {
  type: string;
  target?: string;
  content?: string;
  title?: string;
}

interface StoriesChatbotPanelProps {
  isChatbotVisible: boolean;
  isMobile: boolean;
  chatbotWidth: number;
  setIsChatbotVisible: (visible: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  handleMouseDown: (e: React.MouseEvent) => void;
  handlePageModification: (mod: PageModification) => Promise<string>;
  documentId?: string;
  userId?: string;
}

export default function StoriesChatbotPanel({
  isChatbotVisible,
  isMobile,
  chatbotWidth,
  setIsChatbotVisible,
  setSidebarOpen,
  setSidebarCollapsed,
  handleMouseDown,
  handlePageModification,
  documentId,
  userId,
}: StoriesChatbotPanelProps) {
  if (!isChatbotVisible) {
    return (
      <button
        onClick={() => {
          setIsChatbotVisible(true);
          if (window.innerWidth < 1024) {
            setSidebarOpen(false);
            setSidebarCollapsed(true);
          }
        }}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-30"
        title="Open Chatbot"
      >
        <MessageCircle size={isMobile ? 20 : 24} />
      </button>
    );
  }

  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-white z-[9999] flex flex-col isolate">
        <div className="p-4 border-b border-gray-200 flex-shrink-0 bg-white">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">AI Stories Assistant</h3>
            <button
              onClick={() => setIsChatbotVisible(false)}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
              title="Close Chatbot"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-white">
          <UnifiedChatbot
            mode="workspace"
            onPageModification={handlePageModification}
            documentId={documentId}
            userId={userId}
            apiEndpoint="stories"
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="fixed right-0 w-1.5 bg-gray-200 hover:bg-gray-300 cursor-col-resize z-20 hidden lg:flex items-center justify-center transition-all duration-300 flex-shrink-0"
        onMouseDown={handleMouseDown}
        style={{
          right: `${chatbotWidth}px`,
          top: "64px",
          bottom: "0",
        }}
      ></div>

      <div
        className="fixed right-0 bg-white shadow-xl flex flex-col z-40 transition-all duration-300 border-l border-gray-200"
        style={{
          width: isMobile ? '100%' : chatbotWidth,
          top: "64px",
          bottom: "0",
        }}
      >
        <div className="p-4 border-b border-gray-200 flex-shrink-0 relative bg-white">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">AI Stories Assistant</h3>
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
            documentId={documentId}
            userId={userId}
            apiEndpoint="stories"
            containerWidth={chatbotWidth}
          />
        </div>
      </div>
    </>
  );
}
