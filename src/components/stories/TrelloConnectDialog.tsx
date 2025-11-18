"use client";
import React, { useState } from "react";
import { X } from "lucide-react";

interface TrelloConnectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (credentials: TrelloCredentials) => Promise<void>;
}

export interface TrelloCredentials {
  trelloKey: string;
  trelloToken: string;
}

export interface TrelloBoard {
  id: string;
  name: string;
  desc?: string;
  url?: string;
}

export default function TrelloConnectDialog({
  isOpen,
  onClose,
  onConnect,
}: TrelloConnectDialogProps) {
  const [trelloKey, setTrelloKey] = useState("");
  const [trelloToken, setTrelloToken] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!trelloKey || !trelloToken) {
      setError("Please fill in all fields");
      return;
    }

    setIsConnecting(true);
    try {
      await onConnect({ trelloKey, trelloToken });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to Trello");
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Connect to Trello</h2>
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
              API Key
            </label>
            <input
              type="text"
              value={trelloKey}
              onChange={(e) => setTrelloKey(e.target.value)}
              placeholder="Your Trello API key"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isConnecting}
            />
            <p className="mt-1 text-xs text-gray-500">
              <a
                href="https://trello.com/power-ups/admin"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Get your API key
              </a>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Token
            </label>
            <input
              type="password"
              value={trelloToken}
              onChange={(e) => setTrelloToken(e.target.value)}
              placeholder="Your Trello token"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isConnecting}
            />
            <p className="mt-1 text-xs text-gray-500">
              Generate a token after getting your API key
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
              How to get your Trello credentials:
            </h3>
            <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
              <li>Go to Trello Power-Ups Admin page</li>
              <li>Click "New" to create a new Power-Up (or use existing)</li>
              <li>Copy your API Key</li>
              <li>Click "Token" link to generate a token</li>
              <li>Authorize and copy the token</li>
              <li>After connecting, you'll be able to select a board</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
