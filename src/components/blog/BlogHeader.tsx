import React from "react";
import { FaEllipsisH as MoreHorizontal } from "react-icons/fa";
import DeleteDropdown from "./DeleteDropdown";

interface BlogHeaderProps {
  setShowDeleteDropdown: (show: boolean) => void;
  showDeleteDropdown: boolean;
  dropdownRef: React.RefObject<HTMLDivElement>;
  handleDeletePost: () => void;
  saveStatus?: 'saved' | 'saving' | 'error';
}

export default function BlogHeader({
  setShowDeleteDropdown,
  showDeleteDropdown,
  dropdownRef,
  handleDeletePost,
  saveStatus = 'saved',
}: BlogHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-4">
        {/* Save Status Indicator - Similar to Copilot Pages */}
        {saveStatus === 'saving' && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Saving...</span>
          </div>
        )}
        {saveStatus === 'saved' && (
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>Saved</span>
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="flex items-center space-x-2 text-sm text-red-600">
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Failed to save</span>
          </div>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => setShowDeleteDropdown(!showDeleteDropdown)}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative"
        >
          <MoreHorizontal size={16} />
        </button>

        {showDeleteDropdown && (
          <DeleteDropdown
            dropdownRef={dropdownRef}
            handleDeletePost={handleDeletePost}
          />
        )}
      </div>
    </div>
  );
}
