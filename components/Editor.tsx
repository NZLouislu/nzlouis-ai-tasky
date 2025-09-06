"use client";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { PartialBlock } from "@blocknote/core";
import { useEffect, useRef } from "react";
import { Image } from "lucide-react";

interface EditorProps {
  initialContent?: PartialBlock[];
  onChange?: (content: PartialBlock[]) => void;
}

export default function Editor({ initialContent, onChange }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const editor = useCreateBlockNote({
    initialContent,
  });

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

    const handlePaste = (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items || []);
      const imageItems = items.filter(item => item.type.startsWith('image/'));

      if (imageItems.length > 0) {
        e.preventDefault();
        e.stopImmediatePropagation();

        imageItems.forEach(item => {
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const result = event.target?.result as string;
              if (result) {
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
          }
        });
      }
    };

    const editorElement = editorRef.current;
    if (editorElement) {
      editorElement.addEventListener('dragover', handleDragOver, true);
      editorElement.addEventListener('drop', handleDrop, true);
      editorElement.addEventListener('paste', handlePaste, true);

      return () => {
        editorElement.removeEventListener('dragover', handleDragOver, true);
        editorElement.removeEventListener('drop', handleDrop, true);
        editorElement.removeEventListener('paste', handlePaste, true);
      };
    }
  }, [editor]);


  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          if (result) {
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
      }
    });
  };

  const handleImageSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div ref={editorRef} className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/*"
        multiple
        className="hidden"
      />

      <div className="mb-2 flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={handleImageSelect}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          title="Insert image"
        >
          <Image size={16} />
          Add Image
        </button>
      </div>

      <div
        onPaste={(e) => {
          const items = Array.from(e.clipboardData?.items || []);
          const imageItems = items.filter(item => item.type.startsWith('image/'));

          if (imageItems.length > 0) {
            e.preventDefault();
            e.stopPropagation();

            imageItems.forEach(item => {
              const file = item.getAsFile();
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  const result = event.target?.result as string;
                  if (result) {
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
              }
            });
          }
        }}
      >
        <BlockNoteView
          editor={editor}
          onChange={handleChange}
          theme="light"
          sideMenu={false}
        />
      </div>
    </div>
  );
}