"use client";

import { useState } from "react";
import Blog from "@/components/blog/Blog";
import BlogDebug from "@/components/blog/BlogDebug";

export default function BlogFixPreview() {
  const [showDebug, setShowDebug] = useState(false);

  return (
    <div className="h-screen overflow-hidden">
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          {showDebug ? "Hide Debug" : "Show Debug"}
        </button>
      </div>

      {showDebug ? (
        <div className="h-full overflow-auto">
          <BlogDebug />
        </div>
      ) : (
        <Blog />
      )}
    </div>
  );
}
