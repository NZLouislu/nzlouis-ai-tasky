'use client';

import React, { useEffect, useState } from 'react';
import { PartialBlock } from '@blocknote/core';
import { VersionControl, ArticleVersion } from '@/lib/blog/version-control';

interface VersionHistoryProps {
  postId: string;
  userId: string;
  onRestore?: (content: PartialBlock[]) => void;
}

export function VersionHistory({ postId, userId, onRestore }: VersionHistoryProps) {
  const [versions, setVersions] = useState<ArticleVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  useEffect(() => {
    loadVersions();
  }, [postId]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const vc = new VersionControl();
      const history = await vc.getVersionHistory(postId);
      setVersions(history);
    } catch (error) {
      console.error('Failed to load versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (versionId: string) => {
    if (!confirm('Are you sure you want to restore this version?')) return;

    try {
      const vc = new VersionControl();
      const version = await vc.getVersion(versionId);
      
      if (version && onRestore) {
        onRestore(version.content);
      }

      await vc.rollbackToVersion(versionId);
      loadVersions();
    } catch (error) {
      console.error('Failed to restore version:', error);
    }
  };

  const getVersionIcon = (trigger: string) => {
    switch (trigger) {
      case 'ai':
        return '🤖';
      case 'auto':
        return '💾';
      case 'manual':
        return '✏️';
      default:
        return '📝';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Version History</h3>
        <button
          onClick={loadVersions}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
        >
          Refresh
        </button>
      </div>

      {versions.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No version history yet</p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {versions.map((version, index) => (
            <div
              key={version.id}
              className={`p-4 border rounded-lg transition-colors ${
                selectedVersion === version.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-2xl">{getVersionIcon(version.metadata.trigger)}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {version.metadata.description || `${version.metadata.trigger} save`}
                      </span>
                      {index === 0 && (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(version.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedVersion(
                      selectedVersion === version.id ? null : version.id
                    )}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    {selectedVersion === version.id ? 'Hide' : 'Preview'}
                  </button>
                  {index !== 0 && (
                    <button
                      onClick={() => handleRestore(version.id)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Restore
                    </button>
                  )}
                </div>
              </div>

              {selectedVersion === version.id && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Content blocks: {version.content.length}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
