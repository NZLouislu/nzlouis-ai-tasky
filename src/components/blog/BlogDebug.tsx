"use client";

import { useBlogData } from "@/hooks/use-blog-data";

export default function BlogDebug() {
  const { posts, isLoading, error } = useBlogData();

  if (isLoading) {
    return <div className="p-4">Loading blog data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Blog Debug Info</h2>
      <div>
        <strong>Total Posts:</strong> {posts.length}
      </div>
      {posts.map((post) => (
        <div key={post.id} className="border p-3 rounded">
          <div><strong>ID:</strong> {post.id}</div>
          <div><strong>Title:</strong> {post.title}</div>
          <div><strong>Content blocks:</strong> {post.content?.length || 0}</div>
          <div><strong>Children:</strong> {post.children?.length || 0}</div>
          {post.children?.map((child) => (
            <div key={child.id} className="ml-4 mt-2 border-l-2 pl-2">
              <div><strong>Child ID:</strong> {child.id}</div>
              <div><strong>Child Title:</strong> {child.title}</div>
              <div><strong>Child Content blocks:</strong> {child.content?.length || 0}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}