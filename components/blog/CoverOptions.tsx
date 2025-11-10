import React from "react";
import { FaTimes as X } from "react-icons/fa";

interface PostCover {
  type: "color" | "image";
  value: string;
}

interface CoverOptionsProps {
  showCoverOptions: boolean;
  setShowCoverOptions: (show: boolean) => void;
  colorOptions: string[];
  setPostCover: (postId: string, cover: PostCover) => void;
  activePostId: string;
  handleCoverFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function CoverOptions({
  showCoverOptions,
  setShowCoverOptions,
  colorOptions,
  setPostCover,
  activePostId,
  handleCoverFileSelect,
}: CoverOptionsProps) {
  if (!showCoverOptions) return null;

  return (
    <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-lg mx-auto max-w-2xl relative">
      <button
        onClick={() => setShowCoverOptions(false)}
        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
        title="Close"
      >
        <X size={16} />
      </button>
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Colors</h3>
        <div className="flex flex-wrap gap-3">
          {colorOptions.map((color) => (
            <button
              key={color}
              onClick={() =>
                setPostCover(activePostId, {
                  type: "color",
                  value: color,
                })
              }
              className={`w-10 h-10 rounded-lg ${color} hover:opacity-80 transition-opacity`}
            ></button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Upload Image</h3>
        <input
          type="file"
          accept="image/*"
          onChange={handleCoverFileSelect}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Or enter image URL below</p>
        <input
          type="text"
          placeholder="Enter image URL"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-2"
          onBlur={(e) => {
            if (e.target.value)
              setPostCover(activePostId, {
                type: "image",
                value: e.target.value,
              });
          }}
        />
      </div>
    </div>
  );
}
