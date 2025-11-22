"use client";

import { useState } from "react";
import { Upload, Download, Loader2 } from "lucide-react";

interface TrelloSyncPanelProps {
  projectName: string;
  boardId: string;
  onSyncComplete?: () => void;
}

export default function TrelloSyncPanel({
  projectName,
  boardId,
  onSyncComplete,
}: TrelloSyncPanelProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [dryRun, setDryRun] = useState(false);

  const handleSyncToTrello = async () => {
    setIsUploading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/stories/trello/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upload",
          inputDir: `./stories/${projectName}`,
          configName: "Default",
          dryRun,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Sync failed");
      }

      setMessage({
        type: "success",
        text: `Successfully synced to Trello! Created: ${data.result.created}, Updated: ${data.result.updated}`,
      });

      onSyncComplete?.();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to sync to Trello",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSyncFromTrello = async () => {
    setIsDownloading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/stories/trello/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "download",
          outputDir: `./stories/${projectName}`,
          configName: "Default",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Sync failed");
      }

      setMessage({
        type: "success",
        text: `Successfully synced from Trello! Written: ${data.result.written} files`,
      });

      onSyncComplete?.();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to sync from Trello",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-white dark:bg-gray-800">
      <h3 className="text-lg font-semibold">Trello Sync</h3>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="dryRun"
          checked={dryRun}
          onChange={(e) => setDryRun(e.target.checked)}
          className="rounded"
        />
        <label htmlFor="dryRun" className="text-sm">
          Dry Run (test mode)
        </label>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSyncToTrello}
          disabled={isUploading || isDownloading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          Sync to Trello
        </button>

        <button
          onClick={handleSyncFromTrello}
          disabled={isUploading || isDownloading}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Sync from Trello
        </button>
      </div>

      {message && (
        <div
          className={`p-3 rounded ${
            message.type === "success"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
