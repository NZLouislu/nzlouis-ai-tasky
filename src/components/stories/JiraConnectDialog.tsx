"use client";
import React, { useState } from "react";
import { X } from "lucide-react";

interface JiraConnectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (credentials: JiraCredentials) => Promise<void>;
}

export interface JiraCredentials {
  jiraUrl: string;
  jiraEmail: string;
  jiraApiToken: string;
}

export default function JiraConnectDialog({
  isOpen,
  onClose,
  onConnect,
}: JiraConnectDialogProps) {
  const [jiraUrl, setJiraUrl] = useState("https://");
  const [jiraEmail, setJiraEmail] = useState("");
  const [jiraApiToken, setJiraApiToken] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!jiraUrl || !jiraEmail || !jiraApiToken) {
      setError("Please fill in all fields");
      return;
    }

    try {
      new URL(jiraUrl);
    } catch {
      setError("Please enter a valid Jira URL (e.g., https://yourcompany.atlassian.net)");
      return;
    }

    setIsConnecting(true);
    try {
      await onConnect({ jiraUrl, jiraEmail, jiraApiToken });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to Jira");
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Connect to Jira</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jira URL
            </label>
            <input
              type="url"
              value={jiraUrl}
              onChange={(e) => setJiraUrl(e.target.value)}
              placeholder="https://yourcompany.atlassian.net"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isConnecting}
            />
            <p className="mt-1 text-xs text-gray-500">
              Your Jira instance URL
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={jiraEmail}
              onChange={(e) => setJiraEmail(e.target.value)}
              placeholder="your.email@company.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isConnecting}
            />
            <p className="mt-1 text-xs text-gray-500">
              Your Jira account email
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Token
            </label>
            <input
              type="password"
              value={jiraApiToken}
              onChange={(e) => setJiraApiToken(e.target.value)}
              placeholder="Your Jira API token"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isConnecting}
            />
            <p className="mt-1 text-xs text-gray-500">
              <a
                href="https://id.atlassian.com/manage-profile/security/api-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Create an API token
              </a>
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              disabled={isConnecting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
              disabled={isConnecting}
            >
              {isConnecting ? "Connecting..." : "Connect"}
            </button>
          </div>
        </form>

        <div className="px-6 pb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              How to get your Jira API token:
            </h3>
            <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
              <li>Go to Atlassian Account Settings</li>
              <li>Click on Security → API tokens</li>
              <li>Click "Create API token"</li>
              <li>Give it a name and copy the token</li>
              <li>Paste it here</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
