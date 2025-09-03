"use client";

import React from "react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { Card } from "./types";

export default function Task({ task }: { task: Card }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: "100%",
    boxSizing: "border-box",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
    maxWidth: "100%",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg shadow p-4 mb-3 cursor-pointer hover:shadow-md transition-shadow"
    >
      <h4 className="font-semibold text-gray-800 text-sm sm:text-base md:text-lg">
        {task.title}
      </h4>
      {task.description && (
        <p className="text-gray-500 text-xs sm:text-sm mt-1">
          {task.description}
        </p>
      )}
      {task.due && (
        <span className="text-gray-400 text-xs sm:text-sm mt-2 block">
          Due: {task.due}
        </span>
      )}
    </div>
  );
}
