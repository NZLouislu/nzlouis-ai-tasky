"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useBlogStore } from "@/lib/stores/blog-store";

export default function TestBlogSessionPage() {
  const { data: session, status: sessionStatus } = useSession();
  const { posts, userId, isLoading, error, fetchPosts, setUserId } = useBlogStore();
  const [testResult, setTestResult] = useState<string[]>([]);

  const addLog = (message: string) => {
    setTestResult(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    addLog(`Session status: ${sessionStatus}`);
    if (session?.user?.id) {
      addLog(`Session user ID: ${session.user.id}`);
    }
  }, [session, sessionStatus]);

  useEffect(() => {
    addLog(`Store userId: ${userId}`);
    addLog(`Store isLoading: ${isLoading}`);
    addLog(`Store posts count: ${posts?.length || 0}`);
    if (error) {
      addLog(`Store error: ${error}`);
    }
  }, [userId, isLoading, posts, error]);

  const handleSetUserId = () => {
    if (session?.user?.id) {
      addLog(`Setting userId to: ${session.user.id}`);
      setUserId(session.user.id);
    } else {
      addLog('No session user ID available');
    }
  };

  const handleFetchPosts = async () => {
    if (userId === "00000000-0000-0000-0000-000000000000") {
      addLog('Cannot fetch posts: userId is default value');
      return;
    }
    addLog(`Fetching posts for userId: ${userId}`);
    try {
      await fetchPosts(userId);
      addLog(`Fetch complete. Posts count: ${posts?.length || 0}`);
    } catch (err) {
      addLog(`Fetch error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleCheckDatabase = async () => {
    if (!session?.user?.id) {
      addLog('No session user ID');
      return;
    }

    addLog(`Checking database via API for user: ${session.user.id}`);
    try {
      const response = await fetch('/api/blog/posts');
      const result = await response.json();

      if (!response.ok) {
        addLog(`Database error: ${result.error || 'Unknown error'}`);
      } else {
        const data = result.data;
        addLog(`Found ${data?.length || 0} posts in database`);
        if (data && data.length > 0) {
          data.forEach((post: { id: string; title?: string }, i: number) => {
            addLog(`  ${i + 1}. ${post.title || '(No title)'} - ID: ${post.id.substring(0, 8)}`);
          });
        }
      }
    } catch (err) {
      addLog(`Database check error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleCreateTestPost = async () => {
    if (!session?.user?.id) {
      addLog('No session user ID');
      return;
    }

    addLog('Creating test post via API...');
    try {
      const response = await fetch('/api/blog/create-test-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: session.user.id,
          title: `Test Post ${Date.now()}`,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        addLog(`Create error: ${result.error || 'Unknown error'}`);
      } else {
        addLog(`Created post: ${result.data.title}`);
        addLog(`Post ID: ${result.data.id}`);
      }
    } catch (err) {
      addLog(`Create error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Blog Session & Data Test</h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <h2 className="font-semibold mb-2">Session Info</h2>
          <div className="text-sm space-y-1">
            <div>Status: <span className="font-mono">{sessionStatus}</span></div>
            <div>User ID: <span className="font-mono text-xs">{session?.user?.id || 'N/A'}</span></div>
            <div>Email: <span className="font-mono">{session?.user?.email || 'N/A'}</span></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <h2 className="font-semibold mb-2">Store Info</h2>
          <div className="text-sm space-y-1">
            <div>User ID: <span className="font-mono text-xs">{userId}</span></div>
            <div>Loading: <span className="font-mono">{isLoading ? 'Yes' : 'No'}</span></div>
            <div>Posts: <span className="font-mono">{posts?.length || 0}</span></div>
            <div>Error: <span className="font-mono text-red-600">{error || 'None'}</span></div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border mb-6">
        <h2 className="font-semibold mb-3">Actions</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSetUserId}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            1. Set User ID
          </button>
          <button
            onClick={handleFetchPosts}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            2. Fetch Posts
          </button>
          <button
            onClick={handleCheckDatabase}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            3. Check Database
          </button>
          <button
            onClick={handleCreateTestPost}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            4. Create Test Post
          </button>
          <button
            onClick={() => window.location.href = '/blog'}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            5. Go to Blog Page
          </button>
          <button
            onClick={async () => {
              addLog('Resetting test data...');
              try {
                const response = await fetch('/api/blog/reset-test-data', {
                  method: 'POST',
                });
                const result = await response.json();
                if (response.ok) {
                  addLog(`✅ Reset complete! Created ${result.data.length} posts`);
                  addLog('Please refresh the blog page');
                } else {
                  addLog(`❌ Reset failed: ${result.error}`);
                }
              } catch (err) {
                addLog(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            6. Reset Test Data
          </button>
          <button
            onClick={async () => {
              addLog('Simulating new user experience...');
              try {
                // 1. 删除所有文章
                const deleteResponse = await fetch('/api/blog/reset-test-data', {
                  method: 'POST',
                });
                if (!deleteResponse.ok) {
                  throw new Error('Failed to delete posts');
                }
                addLog('✅ Deleted all posts');
                
                // 2. 初始化欢迎文章
                const initResponse = await fetch('/api/blog/initialize-user', {
                  method: 'POST',
                });
                const result = await initResponse.json();
                if (initResponse.ok) {
                  addLog(`✅ Created ${result.count} welcome posts`);
                  addLog('Please refresh the blog page to see the welcome posts');
                } else {
                  addLog(`❌ Init failed: ${result.error}`);
                }
              } catch (err) {
                addLog(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
              }
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            7. Test New User Experience
          </button>
          <button
            onClick={() => setTestResult([])}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Clear Log
          </button>
        </div>
      </div>

      <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
        <h2 className="font-semibold mb-2 text-white">Test Log</h2>
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {testResult.length === 0 ? (
            <div className="text-gray-500">No logs yet. Click buttons above to test.</div>
          ) : (
            testResult.map((log, i) => (
              <div key={i}>{log}</div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-semibold mb-2">测试步骤：</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>点击 &quot;1. Set User ID&quot; 设置用户 ID</li>
          <li>点击 &quot;2. Fetch Posts&quot; 从 store 获取数据</li>
          <li>点击 &quot;3. Check Database&quot; 直接查询数据库</li>
          <li>如果没有数据，点击 &quot;4. Create Test Post&quot; 创建测试数据</li>
          <li>然后重新执行步骤 2 和 3</li>
        </ol>
      </div>
    </div>
  );
}
