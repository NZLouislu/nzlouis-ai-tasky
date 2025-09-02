"use client";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { PartialBlock } from "@blocknote/core";

interface EditorProps {
  initialContent?: PartialBlock[];
}

export default function Editor({ initialContent }: EditorProps) {
  const editor = useCreateBlockNote({ initialContent });
  return <BlockNoteView editor={editor} />;
}