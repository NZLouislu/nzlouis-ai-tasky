/**
 * Jira Sync Button and UI Component
 * Provides interface for triggering Jira synchronization
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Upload, ExternalLink, AlertTriangle } from 'lucide-react';

interface JiraSyncButtonProps {
  documentId: string;
  documentContent: string;
  isConnected: boolean;
  onSyncComplete?: (results: SyncResults) => void;
}

interface SyncResults {
  total: number;
  synced: number;
  failed: number;
  details: Array<{
    success: boolean;
    issueKey?: string;
    error?: string;
    subTasks?: Array<{ key: string; summary: string }>;
  }>;
}

interface SyncProgress {
  current: number;
  total: number;
  currentStory: string;
}

export function JiraSyncButton({ 
  documentId, 
  documentContent, 
  isConnected,
  onSyncComplete 
}: JiraSyncButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [results, setResults] = useState<SyncResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    if (!isConnected) {
      setError('Jira connection is required');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);
    setProgress(null);

    try {
      const response = await fetch('/api/stories/sync/jira', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      setResults(data.results);
      onSyncComplete?.(data.results);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  };

  const getStoryCount = () => {
    const storyMatches = documentContent.match(/^- Story:/gm);
    return storyMatches ? storyMatches.length : 0;
  };

  const storyCount = getStoryCount();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          size="sm"
          disabled={!isConnected || storyCount === 0}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Sync to Jira
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sync Stories to Jira</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm">
              {isConnected ? 'Jira Connected' : 'Jira Not Connected'}
            </span>
          </div>

          {/* Story Count */}
          <div className="text-sm text-gray-600">
            Found {storyCount} {storyCount === 1 ? 'story' : 'stories'} to sync
          </div>

          {/* Warning for no stories */}
          {storyCount === 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No stories found in document. Make sure your document contains properly formatted stories.
              </AlertDescription>
            </Alert>
          )}

          {/* Progress */}
          {progress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Syncing stories...</span>
                <span>{progress.current} of {progress.total}</span>
              </div>
              <Progress value={(progress.current / progress.total) * 100} />
              <div className="text-xs text-gray-500 truncate">
                Current: {progress.currentStory}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">Sync Complete</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-lg font-semibold">{results.total}</div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
                <div className="p-2 bg-green-50 rounded">
                  <div className="text-lg font-semibold text-green-700">{results.synced}</div>
                  <div className="text-xs text-gray-600">Synced</div>
                </div>
                <div className="p-2 bg-red-50 rounded">
                  <div className="text-lg font-semibold text-red-700">{results.failed}</div>
                  <div className="text-xs text-gray-600">Failed</div>
                </div>
              </div>

              {/* Successful syncs */}
              {results.details.filter(d => d.success).length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Successfully Created:</div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {results.details
                      .filter(d => d.success)
                      .map((detail, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="truncate">{detail.issueKey}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => window.open(`https://your-domain.atlassian.net/browse/${detail.issueKey}`, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Failed syncs */}
              {results.details.filter(d => !d.success).length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-red-700">Failed to Create:</div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {results.details
                      .filter(d => !d.success)
                      .map((detail, index) => (
                        <div key={index} className="text-sm">
                          <div className="text-red-600">{detail.error}</div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              {results ? 'Close' : 'Cancel'}
            </Button>
            {!results && (
              <Button
                onClick={handleSync}
                disabled={isLoading || !isConnected || storyCount === 0}
              >
                {isLoading ? 'Syncing...' : 'Start Sync'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Sync Status Indicator for Sidebar
 */
interface SyncStatusProps {
  lastSyncAt?: string;
  syncStatus?: 'success' | 'partial' | 'failed' | 'never';
}

export function SyncStatus({ lastSyncAt, syncStatus }: SyncStatusProps) {
  if (!lastSyncAt || syncStatus === 'never') {
    return (
      <Badge variant="secondary" className="text-xs">
        Never synced
      </Badge>
    );
  }

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case 'success':
        return 'Synced';
      case 'partial':
        return 'Partial';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Badge className={`text-xs ${getStatusColor()}`}>
        {getStatusText()}
      </Badge>
      <span className="text-xs text-gray-500">
        {formatDate(lastSyncAt)}
      </span>
    </div>
  );
}