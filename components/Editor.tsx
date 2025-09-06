"use client";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { PartialBlock } from "@blocknote/core";
import { useEffect, useRef, useCallback } from "react";

interface EditorProps {
  initialContent?: PartialBlock[];
  onChange?: (content: PartialBlock[]) => void;
}

export default function Editor({ initialContent, onChange }: EditorProps) {
  const editor = useCreateBlockNote({ initialContent });
  const globalFileInputRef = useRef<HTMLInputElement | null>(null);

  const insertImageDataUrl = useCallback(
    (dataUrl: string) => {
      editor.insertBlocks(
        [
          {
            type: "image",
            props: {
              url: dataUrl,
              caption: "",
            },
          },
        ],
        "after"
      );
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      if (onChange) onChange(editor.document);
    },
    [editor, onChange]
  );

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
      btn.style.padding = "4px 8px";
      btn.style.borderRadius = "4px";
      btn.style.border = "1px solid #d0d0d0";
      btn.style.background = "#fff";
      btn.style.fontSize = "12px";
      btn.onclick = (e) => {
        e.stopPropagation();
        fileInput?.click();
      };
      parent.appendChild(btn);
    };

    const handlePaste = (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items || []);
      const imageItems = items.filter((it) => it.kind === "file" && it.type.startsWith("image/"));
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
          const embedInput = node.querySelector<HTMLInputElement>('input[placeholder="Enter URL"], input[placeholder="Enter image URL"], input[placeholder="Enter URL here"]');
          if (embedInput) injectButtonToEmbed(embedInput);
          const nestedInputs = node.querySelectorAll<HTMLInputElement>('input[placeholder="Enter URL"], input[placeholder="Enter image URL"], input[placeholder="Enter URL here"]');
          nestedInputs.forEach((i) => injectButtonToEmbed(i));
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const existing = document.querySelectorAll<HTMLInputElement>('input[placeholder="Enter URL"], input[placeholder="Enter image URL"], input[placeholder="Enter URL here"]');
    existing.forEach((i) => injectButtonToEmbed(i));

    document.addEventListener("paste", handlePaste, true);

    return () => {
      observer.disconnect();
      fileInput?.removeEventListener("change", onGlobalFileChange);
      document.removeEventListener("paste", handlePaste, true);
      if (globalFileInputRef.current) {
        try { document.body.removeChild(globalFileInputRef.current); } catch {}
        globalFileInputRef.current = null;
      }
    };
  }, [editor, insertImageDataUrl, onChange]);

  return (
    <div className="w-full">
      <div style={{ marginBottom: 12 }}>
        <BlockNoteView editor={editor} onChange={() => onChange?.(editor.document)} theme="light" />
      </div>
    </div>
  );
}
