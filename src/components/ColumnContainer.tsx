"use client";

import React, { useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";

export default function ColumnContainer({
  id,
  title,
  children,
  onOverChange,
}: {
  id: string;
  title: string;
  children?: React.ReactNode;
  onOverChange?: (isOver: boolean) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  useEffect(() => {
    if (onOverChange) onOverChange(Boolean(isOver));
  }, [isOver, onOverChange]);

  return (
    <div
      ref={setNodeRef}
      className={`bg-gray-100 rounded-lg p-2 sm:p-4 flex-1 min-w-0 transition-all ${
        isOver ? "border-2 border-blue-500" : ""
      }`}
    >
      <h3 className="font-bold text-gray-700 mb-3 text-sm sm:text-base md:text-lg">
        {title}
      </h3>
      {children}
    </div>
  );
}
