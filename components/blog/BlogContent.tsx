import React from "react";
import { PartialBlock } from "@blocknote/core";

interface PostCover {
  type: "color" | "image";
  value: string;
}

interface ActivePost {
  id: string;
  title: string;
  content: PartialBlock[];
  icon?: string;
  cover?: PostCover;
  parent_id?: string | null;
  children?: ActivePost[];
  [key: string]: unknown;
}

interface EditorProps {
  initialContent?: PartialBlock[];
  onChange?: (content: PartialBlock[]) => void;
  onSave?: () => void;
  isSaving?: boolean;
}

interface BlogContentProps {
  activePost: ActivePost;
  activePostId: string;
  updatePostTitle: (postId: string, newTitle: string) => void;
  updatePostContent: (newContent: PartialBlock[]) => void;
  Editor: React.ComponentType<EditorProps>;
  isSaving: boolean;
  handleManualSave: () => void;
}

export default function BlogContent({
  activePost,
  activePostId,
  updatePostTitle,
  updatePostContent,
  Editor,
  isSaving,
  handleManualSave,
}: BlogContentProps) {
  return (
    <div className="w-full max-w-[900px] mx-auto px-6">
      <div className="flex items-center justify-center mb-8">
        {activePost && activePost.icon && (
          <div className="relative mr-4">
            <span
              className="text-3xl cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors"
              onClick={() => {}}
            >
              {activePost.icon}
            </span>
          </div>
        )}
        <div className="flex-1 text-center">
          <input
            id={`title-input-${activePostId}`}
            type="text"
            value={activePost ? activePost.title : ""}
            onChange={async (e) => {
              const newTitle = e.target.value;
              await updatePostTitle(activePostId, newTitle);
            }}
            placeholder="Untitled"
            className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-4xl font-bold text-gray-800 placeholder-gray-400 text-center"
          />
        </div>
      </div>

      <div className="min-h-[400px]">
        <Editor
          initialContent={
            activePost?.content && activePost.content.length > 0
              ? activePost.content
              : [{ type: "paragraph", content: "" }]
          }
          onChange={(content: PartialBlock[]) => updatePostContent(content)}
          onSave={handleManualSave}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}
