import React from "react";
import { FaTrashAlt as Trash2 } from "react-icons/fa";

interface DeleteDropdownProps {
  dropdownRef: React.RefObject<HTMLDivElement>;
  handleDeletePost: () => void;
}

export default function DeleteDropdown({
  dropdownRef,
  handleDeletePost,
}: DeleteDropdownProps) {
  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-50 border border-gray-200"
    >
      <div className="py-1">
        <button
          onClick={handleDeletePost}
          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
        >
          <Trash2 size={14} className="mr-2" />
          Delete
        </button>
      </div>
    </div>
  );
}
