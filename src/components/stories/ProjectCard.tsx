import React from 'react';

interface Connection {
  platform: string;
  status: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  projectKey: string;
  connections?: Connection[];
  documentCount?: number;
  lastSyncAt?: string;
  syncStatus?: string;
}

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const handleEdit = () => {
    onEdit(project);
  };

  const handleDelete = () => {
    onDelete(project.id);
  };

  const formatSyncStatus = (lastSyncAt: string, syncStatus: string) => {
    if (syncStatus === 'success') {
      return `Last synced: ${new Date(lastSyncAt).toLocaleDateString()}`;
    }
    return 'Not synced';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{project.name}</h3>
          <p className="text-gray-600 mt-1">{project.description}</p>
          <p className="text-sm text-gray-500 mt-2 font-mono">{project.projectKey}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleEdit}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Connection Status */}
      {project.connections && project.connections.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Connections</h4>
          <div className="flex gap-2">
            {project.connections.map((connection) => (
              <span
                key={connection.platform}
                className={`px-2 py-1 text-xs rounded ${
                  connection.status === 'connected'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {connection.platform.charAt(0).toUpperCase() + connection.platform.slice(1)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Document Count */}
      {project.documentCount !== undefined && (
        <div className="mb-2">
          <span className="text-sm text-gray-600">
            {project.documentCount} documents
          </span>
        </div>
      )}

      {/* Sync Status */}
      {project.lastSyncAt && project.syncStatus && (
        <div className="text-sm text-gray-500">
          {formatSyncStatus(project.lastSyncAt, project.syncStatus)}
        </div>
      )}
    </div>
  );
}