"use client";

import { boardData } from "../../lib/boardData";
import TaskList from "../../components/TaskList";

export default function Page() {
  return (
    <div className="h-screen bg-gray-50">
      <h1 className="text-2xl font-bold p-4">My Task Board</h1>
      <TaskList initialBoard={boardData} />
    </div>
  );
}
