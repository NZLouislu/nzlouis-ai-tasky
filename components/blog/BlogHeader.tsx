import React from "react";
import { FaEllipsisH as MoreHorizontal } from "react-icons/fa";
import DeleteDropdown from "./DeleteDropdown";

interface BlogHeaderProps {
  setShowDeleteDropdown: (show: boolean) => void;
  showDeleteDropdown: boolean;
  dropdownRef: React.RefObject<HTMLDivElement>;
  handleDeletePost: () => void;
}

export default function BlogHeader({
  setShowDeleteDropdown,
  showDeleteDropdown,
  dropdownRef,
  handleDeletePost,
}: BlogHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-4">
        {/* Removed Add Icon and Add Cover buttons as they are now shown above the title */}
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
