import React from "react";

export default function ChatSkeleton() {
  return (
    <div className="space-y-6 p-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`rounded-2xl p-4 ${
              i % 2 === 0 ? "bg-blue-100" : "bg-gray-100"
            } w-3/4 space-y-2`}
          >
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4 mt-2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
