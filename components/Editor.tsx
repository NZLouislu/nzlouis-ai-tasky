"use client";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { PartialBlock } from "@blocknote/core";
import { useEffect, useRef, useCallback, useState } from "react";
import AIContinuationPanel from "./AIContinuationPanel";
import { Sparkles } from "lucide-react";

interface EditorProps {
  initialContent?: PartialBlock[];
  onChange?: (content: PartialBlock[]) => void;
}

export default function Editor({ initialContent, onChange }: EditorProps) {
  const editor = useCreateBlockNote({ initialContent });
  const globalFileInputRef = useRef<HTMLInputElement | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiPanelPosition, setAIPanelPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState("");
  const [contextBefore, setContextBefore] = useState("");
  const [contextAfter, setContextAfter] = useState("");
  const lastContentRef = useRef<PartialBlock[]>(initialContent || []);
  const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSelectionRef = useRef<string>("");

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
      if (onChange) onChange(editor.document);
    },
    [editor, onChange]
  );

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const selectedText = selection.toString().trim();
    if (!selectedText || selectedText.length < 3) return;

    if (selectedText === lastSelectionRef.current) return;
    lastSelectionRef.current = selectedText;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) return;

    setSelectedText(selectedText);

    const editorElement = document.querySelector(".bn-editor");
    if (editorElement) {
      const editorRect = editorElement.getBoundingClientRect();
      const relativeX = Math.max(
        20,
        Math.min(
          rect.left - editorRect.left + rect.width / 2,
          editorRect.width - 420
        )
      );
      const relativeY = Math.max(20, rect.top - editorRect.top - 60);

      setAIPanelPosition({
        x: relativeX,
        y: relativeY,
      });
    } else {
      setAIPanelPosition({
        x: Math.max(
          20,
          Math.min(rect.left + rect.width / 2, window.innerWidth - 420)
        ),
        y: Math.max(20, rect.top - 60),
      });
    }

    setContextBefore("Previous content context");
    setContextAfter("Following content context");
    setShowAIPanel(true);
  }, []);

  const handleAIAccept = useCallback(
    (suggestion: string) => {
      const pos = editor.getTextCursorPosition();
      if (pos && pos.block) {
        editor.insertBlocks(
          [
            {
              type: "paragraph",
              content: [{ type: "text", text: suggestion, styles: {} }],
            },
          ],
          pos.block,
          "after"
        );
      }
      setShowAIPanel(false);
      if (onChange) onChange(editor.document);
    },
    [editor, onChange]
  );

  const handleAIClose = useCallback(() => {
    setShowAIPanel(false);
  }, []);

  useEffect(() => {
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
      if (e.target && (e.target as Element).closest('.unified-chatbot')) {
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

    observer.observe(document.body, { childList: true, subtree: true });

    const existing = document.querySelectorAll<HTMLInputElement>(
      'input[placeholder="Enter URL"], input[placeholder="Enter image URL"], input[placeholder="Enter URL here"]'
    );
    existing.forEach((i) => injectButtonToEmbed(i));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "k" || e.key === "K") {
          e.preventDefault();
          handleTextSelection();
        }
      }
    };

    const handleSelectionChange = () => {
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }

      selectionTimeoutRef.current = setTimeout(() => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) {
          const selectedText = selection.toString().trim();
          if (
            selectedText.length >= 3 &&
            selectedText !== lastSelectionRef.current
          ) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              handleTextSelection();
            }
          }
        }
      }, 1000);
    };

    document.addEventListener("paste", handlePaste, true);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      observer.disconnect();
      fileInput?.removeEventListener("change", onGlobalFileChange);
      document.removeEventListener("paste", handlePaste, true);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("selectionchange", handleSelectionChange);

      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }

      if (globalFileInputRef.current) {
        try {
          document.body.removeChild(globalFileInputRef.current);
        } catch {}
        globalFileInputRef.current = null;
      }
    };
  }, [editor, insertImageDataUrl, onChange, handleTextSelection]);

  return (
    <div className="w-full relative">
      <div className="mb-2 flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-4 w-4" />
          <span>AI Writing Assistant</span>
        </div>
        <div className="text-xs">
          Select text and press{" "}
          <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+K</kbd>{" "}
          for AI suggestions
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <BlockNoteView
          editor={editor}
          onChange={() => onChange?.(editor.document)}
          theme="light"
        />
      </div>

      {showAIPanel && (
        <AIContinuationPanel
          selectedText={selectedText}
          contextBefore={contextBefore}
          contextAfter={contextAfter}
          onAccept={handleAIAccept}
          onClose={handleAIClose}
          position={aiPanelPosition}
        />
      )}
    </div>
  );
}
