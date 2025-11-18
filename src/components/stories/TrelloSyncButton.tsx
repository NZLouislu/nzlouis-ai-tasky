/**
 * Trello Sync Button and UI Component
 * Provides interface for triggering Trello synchronization
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Upload, ExternalLink, AlertTriangle, List } from 'lucide-react';

interface TrelloSyncButtonProps {
  documentId: string;
  documentContent: string;
  isConnected: boolean;
  boardUrl?: string;
  onSyncComplete?: (results: TrelloSyncResults) => void;
}

interface TrelloSyncResults {
  total: number;
  synced: number;
  failed: number;
  checklistsCreated: number;
  details: Array<{
    success: boolean;
    cardId?: string;
    cardUrl?: string;
    error?: string;
    checklistsCreated?: number;
  }>;
}

interface SyncProgress {
  current: number;
  total: number;
  currentStory: string;
}

export function TrelloSyncButton({ 
  documentId, 
  documentContent, 
  isConnected,
  boardUrl,
  onSyncComplete 
}: TrelloSyncButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [results, setResults] = useState<TrelloSyncResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    if (!isConnected) {
      setError('Trello connection is required');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);
    setProgress(null);

    try {
      const response = await fetch('/api/stories/sync/trello', {
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
          Sync to Trello
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sync Stories to Trello</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm">
              {isConnected ? 'Trello Connected' : 'Trello Not Connected'}
            </span>
            {boardUrl && isConnected && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 ml-auto"
                onClick={() => window.open(boardUrl, '_blank')}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
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

          {/* Sync Info */}
          {storyCount > 0 && (
            <Alert>
              <List className="h-4 w-4" />
              <AlertDescription>
                Each story will be created as a Trello card with acceptance criteria as checklists.
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
              
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-lg font-semibold">{results.total}</div>
                  <div className="text-xs text-gray-600">Total Stories</div>
                </div>
                <div className="p-2 bg-green-50 rounded">
                  <div className="text-lg font-semibold text-green-700">{results.synced}</div>
                  <div className="text-xs text-gray-600">Cards Created</div>
                </div>
              </div>

              {results.checklistsCreated > 0 && (
                <div className="text-center p-2 bg-blue-50 rounded">
                  <div className="text-lg font-semibold text-blue-700">{results.checklistsCreated}</div>
                  <div className="text-xs text-gray-600">Checklists Created</div>
                </div>
              )}

              {results.failed > 0 && (
                <div className="text-center p-2 bg-red-50 rounded">
                  <div className="text-lg font-semibold text-red-700">{results.failed}</div>
                  <div className="text-xs text-gray-600">Failed</div>
                </div>
              )}

              {/* Successful syncs */}
              {results.details.filter(d => d.success).length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Successfully Created Cards:</div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {results.details
                      .filter(d => d.success)
                      .map((detail, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="truncate">Card #{index + 1}</span>
                          <div className="flex items-center gap-1">
                            {detail.checklistsCreated && detail.checklistsCreated > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {detail.checklistsCreated} checklist{detail.checklistsCreated > 1 ? 's' : ''}
                              </Badge>
                            )}
                            {detail.cardUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => window.open(detail.cardUrl, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
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
            {results && boardUrl && (
              <Button
                onClick={() => window.open(boardUrl, '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                View Board
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Trello Sync Status Indicator
 */
interface TrelloSyncStatusProps {
  lastSyncAt?: string;
  syncStatus?: 'success' | 'partial' | 'failed' | 'never';
  cardsCreated?: number;
}

export function TrelloSyncStatus({ lastSyncAt, syncStatus, cardsCreated }: TrelloSyncStatusProps) {
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
        return cardsCreated ? `${cardsCreated} cards` : 'Synced';
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