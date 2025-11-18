import React from "react";

interface IconSelectorProps {
  showIconSelector: boolean;
  setShowIconSelector: (show: boolean) => void;
  iconOptions: string[];
  setPostIcon: (postId: string, icon: string) => void;
  removePostIcon: (postId: string) => void;
  activePostId: string;
}

export default function IconSelector({
  showIconSelector,
  setShowIconSelector,
  iconOptions,
  setPostIcon,
  removePostIcon,
  activePostId,
}: IconSelectorProps) {
  if (!showIconSelector) return null;

  return (
    <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-lg mx-auto max-w-2xl">
      <div className="grid grid-cols-8 gap-3">
        {iconOptions.map((icon) => (
          <button
            key={icon}
            onClick={() => {
              setPostIcon(activePostId, icon);
              setShowIconSelector(false);
            }}
            className="text-2xl p-3 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
          >
            {icon}
          </button>
        ))}
        <button
          onClick={() => {
            removePostIcon(activePostId);
            setShowIconSelector(false);
          }}
          className="text-sm p-3 hover:bg-gray-100 rounded-lg flex items-center justify-center text-gray-500"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
