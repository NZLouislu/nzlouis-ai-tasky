"use client";

import { useEffect, useState } from "react";
import { useBlogStore } from "@/lib/stores/blog-store";
import { useSession } from "next-auth/react";

export default function BlogDebugPanel() {
  const { data: session } = useSession();
  const { posts, userId, isLoading, error } = useBlogStore();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Listen for keyboard shortcut Ctrl+Shift+D to show/hide debug panel
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-purple-600 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-purple-700 text-sm"
        >
          🐛 Debug
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border-2 border-purple-600 rounded-lg shadow-2xl p-4 max-w-md max-h-96 overflow-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg">Blog Debug Panel</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <div className="font-semibold text-purple-700">Session:</div>
          <div className="ml-2 text-gray-700">
            Status: {session ? '✅ Logged in' : '❌ Not logged in'}
          </div>
          {session?.user?.id && (
            <div className="ml-2 text-gray-600 text-xs break-all">
              User ID: {session.user.id}
            </div>
          )}
        </div>

        <div>
          <div className="font-semibold text-purple-700">Store State:</div>
          <div className="ml-2 text-gray-700">
            userId: {userId === "00000000-0000-0000-0000-000000000000" ? '❌ Default' : '✅ Set'}
          </div>
          <div className="ml-2 text-gray-600 text-xs break-all">
            {userId}
          </div>
          <div className="ml-2 text-gray-700">
            isLoading: {isLoading ? '⏳ Yes' : '✅ No'}
          </div>
          <div className="ml-2 text-gray-700">
            error: {error ? `❌ ${error}` : '✅ None'}
          </div>
        </div>

        <div>
          <div className="font-semibold text-purple-700">Posts Data:</div>
          <div className="ml-2 text-gray-700">
            Total posts: {posts?.length || 0}
          </div>
          {posts && posts.length > 0 && (
            <div className="ml-2 mt-2 space-y-1">
              {posts.map((post, index) => (
                <div key={post.id} className="text-xs bg-gray-50 p-2 rounded">
                  <div className="font-medium">
                    {index + 1}. {post.title || '(No title)'}
                  </div>
                  <div className="text-gray-500">
                    ID: {post.id.substring(0, 8)}...
                  </div>
                  {post.children && post.children.length > 0 && (
                    <div className="text-gray-500">
                      Children: {post.children.length}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2 border-t">
          <div className="text-xs text-gray-500">
            Press Ctrl+Shift+D to toggle
          </div>
        </div>
      </div>
    </div>
  );
}
