"use client";
import dynamic from "next/dynamic";

const Workspace = dynamic(() => import("../../components/Workspace"), { ssr: false });

export default function WorkspacePage() {
  return (
    <div className="h-screen">
      <Workspace />
    </div>
  );
}