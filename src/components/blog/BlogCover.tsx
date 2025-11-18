import React from "react";
import { FaTrashAlt as Trash2, FaImage as ImageIcon } from "react-icons/fa";
import Image from "next/image";
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
  if (!activePost) return null;

  console.log("🖼️ BlogCover render:", {
    activePostId,
    hasCover: !!activePost.cover,
    cover: activePost.cover
  });

  // Show "Add Cover" button if no cover exists
  if (!activePost.cover) {
    return (
      <div className="w-full max-w-[900px] mx-auto mb-8 px-4 sm:px-6">
        <button
          onClick={() => setShowCoverOptions(true)}
          className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400"
          style={{
            aspectRatio: "16 / 9",
            minHeight: "200px",
          }}
        >
          <ImageIcon className="w-5 h-5" />
          <span>Add Cover</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[900px] mx-auto mb-8 px-4 sm:px-6">
      <div
        className="relative overflow-hidden rounded-xl shadow-sm w-full"
        onMouseEnter={() => setShowCoverActions(true)}
        onMouseLeave={() => setShowCoverActions(false)}
        style={{
          aspectRatio: "16 / 9",
          minHeight: "200px",
        }}
      >
        {activePost.cover.type === "color" ? (
          <div
            className="w-full h-full absolute inset-0"
            style={{ backgroundColor: activePost.cover.value }}
            role="img"
            aria-label="Cover background color"
          ></div>
        ) : (
          <Image
            src={activePost.cover.value}
            alt={`Cover image for ${activePost.title || 'post'}`}
            fill
            className="object-cover"
            loading="lazy"
            sizes="(max-width: 900px) 100vw, 900px"
          />
        )}
        <div
          className={`absolute bottom-4 right-4 flex space-x-2 transition-opacity duration-200 ${showCoverActions ? "opacity-100" : "opacity-0"
            }`}
        >
          <button
            onClick={() => setShowCoverOptions(true)}
            className="px-3 py-1.5 bg-white/90 backdrop-blur-sm text-sm rounded-lg hover:bg-white shadow-sm transition-all"
          >
            Change Cover
          </button>
          <button
            onClick={() => removePostCover(activePostId)}
            className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white shadow-sm transition-all"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
