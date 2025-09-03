"use client";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { PartialBlock } from "@blocknote/core";

interface EditorProps {
  initialContent?: PartialBlock[];
  onChange?: (content: PartialBlock[]) => void;
}

export default function Editor({ initialContent, onChange }: EditorProps) {
  const editor = useCreateBlockNote({ initialContent });
  
  const handleChange = () => {
    if (onChange) {
      onChange(editor.document);
    }
  };
  
  return <BlockNoteView editor={editor} onChange={handleChange} />;
}