"use client";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { PartialBlock } from "@blocknote/core";
import { useEffect, useRef } from "react";

interface EditorProps {
  initialContent?: PartialBlock[];
  onChange?: (content: PartialBlock[]) => void;
}

export default function Editor({ initialContent, onChange }: EditorProps) {
  const editor = useCreateBlockNote({ initialContent });
  const editorRef = useRef<HTMLDivElement>(null);

  const handleChange = () => {
    if (onChange) {
      onChange(editor.document);
    }
  };

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = Array.from(e.dataTransfer?.files || []);
      const imageFiles = files.filter(file => file.type.startsWith('image/'));

      imageFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          if (result) {
            // Insert image block at cursor position
            editor.insertBlocks([{
              type: "image",
              props: {
                url: result,
                caption: "",
              },
            }], editor.getTextCursorPosition().block, "after");
          }
        };
        reader.readAsDataURL(file);
      });
    };

    const editorElement = editorRef.current;
    if (editorElement) {
      editorElement.addEventListener('dragover', handleDragOver);
      editorElement.addEventListener('drop', handleDrop);

      return () => {
        editorElement.removeEventListener('dragover', handleDragOver);
        editorElement.removeEventListener('drop', handleDrop);
      };
    }
  }, [editor]);

  return (
    <div ref={editorRef} className="w-full">
      <BlockNoteView editor={editor} onChange={handleChange} />
    </div>
  );
}