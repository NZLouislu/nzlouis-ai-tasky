'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Download, FileText, CheckSquare } from 'lucide-react';

interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
}

export default function ExportPage() {
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [format, setFormat] = useState<'markdown' | 'jira' | 'trello'>('markdown');

  useEffect(() => {
    if (session?.user) {
      loadSessions();
    }
  }, [session]);

  const loadSessions = async () => {
    try {
      const res = await fetch('/api/chat-sessions');
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const handleExport = async () => {
    if (!selectedSession) return;

    try {
      const res = await fetch(
        `/api/chat-sessions/${selectedSession}/export?format=${format}`
      );
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-export-${format}.${format === 'jira' ? 'txt' : 'md'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Download size={24} />
            <h1 className="text-2xl font-bold">Export Chat Sessions</h1>
          </div>

          <div className="space-y-6">
            {/* Session Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Session
              </label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a session...</option>
                {sessions.map((sess) => (
                  <option key={sess.id} value={sess.id}>
                    {sess.title} - {new Date(sess.updatedAt).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Export Format
              </label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setFormat('markdown')}
                  className={`p-4 border rounded-lg flex flex-col items-center gap-2 ${
                    format === 'markdown'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <FileText size={24} />
                  <span className="font-medium">Markdown</span>
                  <span className="text-xs text-gray-500">Standard .md file</span>
                </button>
                <button
                  onClick={() => setFormat('jira')}
                  className={`p-4 border rounded-lg flex flex-col items-center gap-2 ${
                    format === 'jira'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <CheckSquare size={24} />
                  <span className="font-medium">Jira</span>
                  <span className="text-xs text-gray-500">Jira Wiki format</span>
                </button>
                <button
                  onClick={() => setFormat('trello')}
                  className={`p-4 border rounded-lg flex flex-col items-center gap-2 ${
                    format === 'trello'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <CheckSquare size={24} />
                  <span className="font-medium">Trello</span>
                  <span className="text-xs text-gray-500">Card format</span>
                </button>
              </div>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={!selectedSession}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={20} />
              Export Session
            </button>

            {/* Instructions */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Export Instructions</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>Markdown:</strong> Standard format for documentation</li>
                <li>• <strong>Jira:</strong> Import into Jira using Wiki markup</li>
                <li>• <strong>Trello:</strong> Copy content into Trello card descriptions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
