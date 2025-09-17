import React from "react";
import {
  FaPlus as Plus,
  FaImage as ImageIcon,
  FaEllipsisH as MoreHorizontal,
} from "react-icons/fa";
import DeleteDropdown from "./DeleteDropdown";

interface PostCover {
  type: "color" | "image";
  value: string;
}

interface ActivePost {
  id: string;
  title: string;
  content: unknown[];
  icon?: string;
  cover?: PostCover;
  parent_id?: string | null;
  children?: ActivePost[];
  [key: string]: unknown;
}

interface BlogHeaderProps {
  activePost: ActivePost;
  setShowIconSelector: (show: boolean) => void;
  setShowCoverOptions: (show: boolean) => void;
  setShowDeleteDropdown: (show: boolean) => void;
  showIconSelector: boolean;
  showCoverOptions: boolean;
  showDeleteDropdown: boolean;
  dropdownRef: React.RefObject<HTMLDivElement>;
  handleDeletePost: () => void;
}

export default function BlogHeader({
  activePost,
  setShowIconSelector,
  setShowCoverOptions,
  setShowDeleteDropdown,
  showIconSelector,
  showCoverOptions,
  showDeleteDropdown,
  dropdownRef,
  handleDeletePost,
}: BlogHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-4">
        {activePost && !activePost.icon && !activePost.cover && (
          <button
            onClick={() => setShowIconSelector(!showIconSelector)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} className="mr-2" />
            Add Icon
          </button>
        )}

        {activePost && !activePost.cover && (
          <button
            onClick={() => setShowCoverOptions(!showCoverOptions)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
          >
            <ImageIcon size={16} className="mr-2" />
            Add Cover
          </button>
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
