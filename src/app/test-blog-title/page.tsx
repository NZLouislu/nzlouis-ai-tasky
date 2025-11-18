"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase/supabase-client";

interface BlogPost {
  id: string;
  title: string;
  content: unknown;
  user_id: string;
  created_at: string;
  updated_at: string;
  parent_id: string | null;
  icon: string | null;
}

export default function TestBlogTitlePage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchPosts = async () => {
      try {
        setLoading(true);
        if (!supabase) {
          throw new Error('Supabase client not available');
        }
        if (!session.user?.id) {
          throw new Error('User not authenticated');
        }
        const { data, error } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        console.log("Fetched posts:", data);
        setPosts(data || []);
      } catch (err) {
        console.error("Error fetching posts:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch posts");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [session?.user?.id]);

  if (!session) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">请先登录</h1>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">加载中...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4 text-red-600">错误</h1>
        <p>{error}</p>
      </div>
    );
  }

  const rootPosts = posts.filter((p) => !p.parent_id);
  const childPosts = posts.filter((p) => p.parent_id);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Blog Posts 数据检查</h1>
      <p className="mb-4 text-gray-600">User ID: {session.user?.id}</p>
      <p className="mb-4 text-gray-600">总共 {posts.length} 篇文章</p>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">根页面 ({rootPosts.length})</h2>
          <div className="space-y-2">
            {rootPosts.map((post) => {
              const children = childPosts.filter((c) => c.parent_id === post.id);
              return (
                <div key={post.id} className="border p-4 rounded">
                  <div className="font-medium">
                    {post.icon} {post.title || "(无标题)"}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    ID: {post.id}
                  </div>
                  <div className="text-sm text-gray-500">
                    创建: {new Date(post.created_at).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    更新: {new Date(post.updated_at).toLocaleString()}
                  </div>

                  {children.length > 0 && (
                    <div className="mt-3 ml-4 space-y-2">
                      <div className="text-sm font-medium text-gray-700">
                        子页面 ({children.length}):
                      </div>
                      {children.map((child) => (
                        <div key={child.id} className="border-l-2 border-blue-300 pl-3">
                          <div className="font-medium text-sm">
                            {child.icon} {child.title || "(无标题)"}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {child.id}
                          </div>
                          <div className="text-xs text-gray-500">
                            更新: {new Date(child.updated_at).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {childPosts.filter((c) => !rootPosts.some((p) => p.id === c.parent_id)).length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-2 text-orange-600">
              孤立的子页面 (parent_id 不存在)
            </h2>
            <div className="space-y-2">
              {childPosts
                .filter((c) => !rootPosts.some((p) => p.id === c.parent_id))
                .map((post) => (
                  <div key={post.id} className="border border-orange-300 p-4 rounded">
                    <div className="font-medium">
                      {post.icon} {post.title || "(无标题)"}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      ID: {post.id}
                    </div>
                    <div className="text-sm text-gray-500">
                      Parent ID: {post.parent_id}
                    </div>
                    <div className="text-sm text-gray-500">
                      更新: {new Date(post.updated_at).toLocaleString()}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
