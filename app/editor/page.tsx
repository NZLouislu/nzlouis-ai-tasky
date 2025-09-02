"use client";
import dynamic from "next/dynamic";
import { getPage } from "../../services/pageService";
import { useEffect, useState } from "react";
import { PartialBlock } from "@blocknote/core";

interface Page {
  id: string;
  title: string;
  content: PartialBlock[];
}

const Editor = dynamic(() => import("../../components/Editor"), { ssr: false });

export default function EditorPage() {
  const [page, setPage] = useState<Page | null>(null);

  useEffect(() => {
    const fetchPage = async () => {
      const data = await getPage();
      setPage(data);
    };
    fetchPage();
  }, []);

  if (!page) return <div>Loading...</div>;

  return (
    <div>
      <h1>{page.title}</h1>
      <Editor initialContent={page.content} />
    </div>
  );
}