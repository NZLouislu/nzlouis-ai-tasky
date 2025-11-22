"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Download, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface JiraSyncPanelProps {
  documentId: string;
  isConnected: boolean;
}

interface SyncResult {
  created?: number;
  skipped?: number;
  errors?: number;
  written?: number;
  totalIssues?: number;
}

export function JiraSyncPanel({ documentId, isConnected }: JiraSyncPanelProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [uploadResult, setUploadResult] = useState<SyncResult | null>(null);
  const [downloadResult, setDownloadResult] = useState<SyncResult | null>(null);
  const [dryRun, setDryRun] = useState(false);
  const { toast } = useToast();

  const handleUpload = async () => {
    setIsUploading(true);
    setUploadResult(null);

    try {
      const response = await fetch("/api/stories/jira/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upload",
          inputDir: `/documents/${documentId}`,
          dryRun,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setUploadResult(data.result);
      toast({
        title: "Sync Complete",
        description: `Created ${data.result.created} issues, skipped ${data.result.skipped}`,
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadResult(null);

    try {
      const response = await fetch("/api/stories/jira/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "download",
          outputDir: `/documents/${documentId}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Download failed");
      }

      setDownloadResult(data.result);
      toast({
        title: "Sync Complete",
        description: `Downloaded ${data.result.totalIssues} issues`,
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isConnected) {
    return (
      <Alert>
        <AlertDescription>
          Please connect to Jira first to enable sync operations.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Jira Sync</h3>
        <Badge variant="outline" className="text-xs">
          Connected
        </Badge>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="dryRun"
            checked={dryRun}
            onChange={(e) => setDryRun(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="dryRun" className="text-sm">
            Dry run (test mode)
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleUpload}
            disabled={isUploading || isDownloading}
            className="w-full"
            size="sm"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span className="ml-2">Sync to Jira</span>
          </Button>

          <Button
            onClick={handleDownload}
            disabled={isUploading || isDownloading}
            variant="outline"
            className="w-full"
            size="sm"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="ml-2">Sync from Jira</span>
          </Button>
        </div>

        {uploadResult && (
          <div className="p-3 bg-green-50 rounded-md space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-green-800">
              <CheckCircle className="h-4 w-4" />
              Upload Complete
            </div>
            <div className="text-xs text-green-700">
              Created: {uploadResult.created}, Skipped: {uploadResult.skipped}
              {uploadResult.errors ? `, Errors: ${uploadResult.errors}` : ""}
            </div>
          </div>
        )}

        {downloadResult && (
          <div className="p-3 bg-blue-50 rounded-md space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
              <CheckCircle className="h-4 w-4" />
              Download Complete
            </div>
            <div className="text-xs text-blue-700">
              Downloaded: {downloadResult.totalIssues} issues
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
