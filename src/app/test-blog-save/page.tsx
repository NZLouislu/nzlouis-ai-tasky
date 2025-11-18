"use client";
import { useState } from "react";
import { useBlogStore } from "@/lib/stores/blog-store";

export default function TestBlogSave() {
  const { posts, updatePostContent, isLoading, error } = useBlogStore();
  const [testContent, setTestContent] = useState("");
  const [message, setMessage] = useState("");

  const handleTestSave = async () => {
    if (posts.length === 0) {
      setMessage("No posts available to test");
      return;
    }

    try {
      const postId = posts[0].id;
      await updatePostContent(postId, {
        title: `Test Title Update ${new Date().toISOString()}`,
        content: [
          { type: "paragraph", content: testContent || "Test content" },
        ] as unknown as JSON,
      });
      setMessage("Test save successful!");
    } catch (err) {
      setMessage(
        `Test save failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Blog Save Test</h1>

      {isLoading && <p className="text-blue-500">Saving...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {message && <p className="text-green-500">{message}</p>}

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Test Content:</label>
        <input
          type="text"
          value={testContent}
          onChange={(e) => setTestContent(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Enter test content"
        />
      </div>

      <button
        onClick={handleTestSave}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        Test Save
      </button>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Current Posts:</h2>
        {posts.length > 0 ? (
          <ul className="space-y-2">
            {posts.map((post) => (
              <li
                key={post.id}
                className="p-3 border border-gray-200 rounded-md"
              >
                <h3 className="font-medium">{post.title}</h3>
                <p className="text-sm text-gray-500">ID: {post.id}</p>
                <p className="text-sm text-gray-500">
                  Updated: {post.updated_at || post.created_at}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No posts found</p>
        )}
      </div>
    </div>
  );
}
