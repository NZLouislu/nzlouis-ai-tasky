import React from "react";
import { FaTrashAlt as Trash2 } from "react-icons/fa";
import { Post } from "../Blog";

interface BlogCoverProps {
  activePost: Post | undefined;
  showCoverActions: boolean;
  setShowCoverActions: (show: boolean) => void;
  setShowCoverOptions: (show: boolean) => void;
  removePostCover: (postId: string) => void;
  activePostId: string;
}

export default function BlogCover({
  activePost,
  showCoverActions,
  setShowCoverActions,
  setShowCoverOptions,
  removePostCover,
  activePostId,
}: BlogCoverProps) {
  if (!activePost || !activePost.cover) return null;

  return (
    <div
      className="relative mb-8 rounded-lg overflow-hidden"
      onMouseEnter={() => setShowCoverActions(true)}
      onMouseLeave={() => setShowCoverActions(false)}
      style={{
        height: "12rem",
      }}
    >
      {activePost.cover.type === "color" ? (
        <div className={`h-full ${activePost.cover.value}`}></div>
      ) : (
        <div
          className="h-full bg-cover bg-center"
          style={{
            backgroundImage: `url(${activePost.cover.value})`,
          }}
        ></div>
      )}
      <div
        className={`absolute bottom-4 right-4 flex space-x-2 transition-opacity duration-200 ${
          showCoverActions || (!activePost.icon && !activePost.cover)
            ? "opacity-100"
            : "opacity-0"
        }`}
      >
        <button
          onClick={() => setShowCoverOptions(true)}
          className="px-3 py-1 bg-white bg-opacity-80 text-sm rounded hover:bg-opacity-100"
        >
          Change Cover
        </button>
        <button
          onClick={() => removePostCover(activePostId)}
          className="p-1 bg-white bg-opacity-80 rounded hover:bg-opacity-100"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
