"use client";
import React from "react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { PartialBlock } from "@blocknote/core";
import { useEffect, useRef, useCallback } from "react";
import { Save } from "lucide-react";

interface EditorProps {
  initialContent?: PartialBlock[];
  onChange?: (content: PartialBlock[]) => void;
  onSave?: () => void;
  isSaving?: boolean;
}

export default function Editor({
  initialContent,
  onChange,
  onSave,
  isSaving,
}: EditorProps) {
  // Check if we're in a Storybook environment
  const isStorybook =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1") &&
    (window.location.port === "6006" ||
      window.location.port === "6007" ||
      window.location.port === "6008" ||
      window.location.port === "6009" ||
      window.location.port === "6010" ||
      window.location.port === "6011" ||
      window.location.port === "6012" ||
      window.location.port === "6013" ||
      window.location.port === "6014" ||
      window.location.port === "6015" ||
      window.location.port === "6016");

  const editor = useCreateBlockNote({
    initialContent,
    defaultStyles: true,
    trailingBlock: false,
    uploadFile: async (file: File) => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("entityType", "blog_post");
        formData.append("entityId", "current-post");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error("Upload failed");
        }

        const data = await res.json();
        return data.publicUrl;
      } catch (error) {
        console.error("Image upload failed:", error);
        return "";
      }
    },
  });
  const globalFileInputRef = useRef<HTMLInputElement | null>(null);
  const lastContentRef = useRef<PartialBlock[]>(initialContent || []);
  const contentChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (
      initialContent &&
      JSON.stringify(initialContent) !== JSON.stringify(lastContentRef.current)
    ) {
      try {
        editor.replaceBlocks(editor.document, initialContent);
        lastContentRef.current = initialContent;
      } catch (error) {
        console.error("Failed to update editor content:", error);
      }
    }
  }, [initialContent, editor]);

  const handleContentChange = useCallback(() => {
    if (contentChangeTimeoutRef.current) {
      clearTimeout(contentChangeTimeoutRef.current);
    }

    contentChangeTimeoutRef.current = setTimeout(() => {
      onChange?.(editor.document);
    }, 5000);
  }, [editor, onChange]);

  const handleImmediateSave = useCallback(() => {
    if (contentChangeTimeoutRef.current) {
      clearTimeout(contentChangeTimeoutRef.current);
      contentChangeTimeoutRef.current = null;
    }
    onChange?.(editor.document);
    onSave?.();
  }, [editor, onChange, onSave]);

  const insertImageDataUrl = useCallback(
    (dataUrl: string) => {
      const blocks: PartialBlock[] = [
        {
          type: "image",
          props: {
            url: dataUrl,
            caption: "",
          },
        },
      ];

      const pos = editor.getTextCursorPosition();
      if (pos && pos.block) {
        editor.insertBlocks(blocks, pos.block, "after");
      } else {
        editor.insertBlocks(
          blocks,
          editor.document[editor.document.length - 1],
          "after"
        );
      }

      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
      );
      handleContentChange();
    },
    [editor, handleContentChange]
  );

  // AI Writing Assistant removed - it was interfering with user input

  useEffect(() => {
    // Skip DOM operations in Storybook environment
    if (isStorybook) {
      return;
    }

    if (!globalFileInputRef.current) {
      const fi = document.createElement("input");
      fi.type = "file";
      fi.accept = "image/*";
      fi.style.display = "none";
      document.body.appendChild(fi);
      globalFileInputRef.current = fi;
    }
    const fileInput = globalFileInputRef.current;

    const handleFile = (file: File | null) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (!result) return;
        insertImageDataUrl(result);
      };
      reader.readAsDataURL(file);
    };

    const onGlobalFileChange = () => {
      const f = fileInput?.files?.[0] ?? null;
      handleFile(f);
      if (fileInput) fileInput.value = "";
    };

    fileInput?.addEventListener("change", onGlobalFileChange);

    const injectButtonToEmbed = (embedInput: HTMLInputElement) => {
      const parent = embedInput.parentElement;
      if (!parent) return;
      if (parent.querySelector(".bn-local-image-btn")) return;

      // Don't add button if it's in a cover options dialog
      if (parent.closest('[class*="shadow-lg"]')) return;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "bn-local-image-btn";
      btn.textContent = "Upload local image";
      btn.style.marginLeft = "8px";
      btn.style.padding = "6px 10px";
      btn.style.borderRadius = "4px";
      btn.style.border = "1px solid #d0d0d0";
      btn.style.background = "#fff";
      btn.onclick = (e) => {
        e.stopPropagation();
        fileInput?.click();
      };
      parent.appendChild(btn);
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (e.target && (e.target as Element).closest(".unified-chatbot")) {
        return;
      }
      const items = Array.from(e.clipboardData?.items || []);
      const imageItems = items.filter(
        (it) => it.kind === "file" && it.type.startsWith("image/")
      );
      if (imageItems.length === 0) return;
      e.preventDefault();
      e.stopPropagation();
      imageItems.forEach((item) => {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const result = ev.target?.result as string;
            if (result) insertImageDataUrl(result);
          };
          reader.readAsDataURL(file);
        }
      });
    };

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        const nodes = Array.from(m.addedNodes) as HTMLElement[];
        for (const node of nodes) {
          if (!(node instanceof HTMLElement)) continue;
          const embedInput = node.querySelector<HTMLInputElement>(
            'input[placeholder="Enter URL"], input[placeholder="Enter image URL"], input[placeholder="Enter URL here"]'
          );
          if (embedInput) injectButtonToEmbed(embedInput);
          const nestedInputs = node.querySelectorAll<HTMLInputElement>(
            'input[placeholder="Enter URL"], input[placeholder="Enter image URL"], input[placeholder="Enter URL here"]'
          );
          nestedInputs.forEach((i) => injectButtonToEmbed(i));
        }
      }
    });

    const editorContainer = document.querySelector(".bn-editor");
    if (editorContainer) {
      observer.observe(editorContainer, { childList: true, subtree: true });
    }

    const existing = document.querySelectorAll<HTMLInputElement>(
      'input[placeholder="Enter URL"], input[placeholder="Enter image URL"], input[placeholder="Enter URL here"]'
    );
    existing.forEach((i) => injectButtonToEmbed(i));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        // AI Writing Assistant shortcut removed
      }
    };

    // Selection change handler removed - AI Writing Assistant disabled

    document.addEventListener("paste", handlePaste, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      observer.disconnect();
      fileInput?.removeEventListener("change", onGlobalFileChange);
      document.removeEventListener("paste", handlePaste, true);
      document.removeEventListener("keydown", handleKeyDown);

      // Clear the content change timer
      if (contentChangeTimeoutRef.current) {
        clearTimeout(contentChangeTimeoutRef.current);
      }

      if (globalFileInputRef.current) {
        try {
          document.body.removeChild(globalFileInputRef.current);
        } catch {}
        globalFileInputRef.current = null;
      }
    };
  }, [editor, insertImageDataUrl, handleContentChange, isStorybook]);

  return (
    <div className="w-full relative">
      <div className="mb-2 flex items-center justify-end text-sm text-gray-500">
        {/* Save button */}
        <button
          onClick={handleImmediateSave}
          disabled={isSaving}
          className={`flex items-center px-3 py-1 rounded text-sm ${
            isSaving
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
          }`}
        >
          <Save className="h-4 w-4 mr-1" />
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>

      <div style={{ marginBottom: 12 }} className="no-wrap-editor">
        <BlockNoteView
          editor={editor}
          onChange={handleContentChange}
          theme="light"
          className="max-w-full"
        />
      </div>

      {/* AI Writing Assistant panel removed */}
    </div>
  );
}
