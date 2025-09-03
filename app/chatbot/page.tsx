"use client";

import Chatbot from "@/components/Chatbot";

export default function Page() {
  return (
    <div className="h-screen flex flex-col">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 md:px-6">
        <h1 className="text-2xl font-bold">AI Chatbot</h1>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <Chatbot />
      </div>
    </div>
  );
}