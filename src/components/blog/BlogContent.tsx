import React, { useEffect, useRef } from "react";
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
  const titleRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
    }
  }, [activePost?.title, activePostId]);

  return (
    <div className="w-full max-w-3xl md:max-w-4xl lg:max-w-5xl mx-auto px-2 sm:px-4 md:px-6">
      <div className="flex items-center justify-center mb-8">

        <div className="flex-1 text-center">
          <textarea
            ref={titleRef}
            id={`title-input-${activePostId}`}
            value={activePost ? activePost.title : ""}
            onChange={async (e) => {
              const newTitle = e.target.value;
              await updatePostTitle(activePostId, newTitle);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
            }}
            placeholder="Untitled"
            className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-4xl font-bold text-gray-800 placeholder-gray-400 text-center resize-none overflow-hidden"
            rows={1}
            style={{ minHeight: '1.2em' }}
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
