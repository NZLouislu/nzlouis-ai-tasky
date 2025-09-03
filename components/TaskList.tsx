"use client";

import React, { useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  DragOverlay,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Card } from "./types";
import Task from "./Task";

export interface Column {
  id: string;
  title: string;
  cards: Card[];
}

interface TaskListProps {
  initialBoard: Column[];
}

function ColumnContainer({
  column,
  isOver,
  children,
}: {
  column: Column;
  isOver: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id: column.id });
  return (
    <div
      ref={setNodeRef}
      className={`bg-gray-100 rounded-lg p-4 min-w-[250px] flex-shrink-0 transition-all ${
        isOver ? "border-2 border-blue-500" : ""
      }`}
    >
      <h3 className="font-bold text-gray-700 mb-3 text-sm sm:text-base md:text-lg">
        {column.title}
      </h3>
      {children}
    </div>
  );
}

export default function TaskList({ initialBoard }: TaskListProps) {
  const [board, setBoard] = useState<Column[]>(
    initialBoard.map((c) => ({ ...c, cards: [...c.cards] }))
  );
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  const findCardLocation = (id: string | null) => {
    if (!id) return { colIndex: -1, cardIndex: -1 };
    for (let i = 0; i < board.length; i++) {
      const idx = board[i].cards.findIndex((c) => c.id === id);
      if (idx !== -1) return { colIndex: i, cardIndex: idx };
    }
    return { colIndex: -1, cardIndex: -1 };
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const loc = findCardLocation(active.id as string);
    if (loc.colIndex !== -1) {
      setActiveCard(board[loc.colIndex].cards[loc.cardIndex]);
    } else {
      setActiveCard(null);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id;
    if (!overId) {
      setOverColumnId(null);
      return;
    }
    const isColumn = board.some((c) => c.id === overId);
    if (isColumn) {
      setOverColumnId(overId as string);
      return;
    }
    const loc = findCardLocation(overId as string);
    if (loc.colIndex !== -1) {
      setOverColumnId(board[loc.colIndex].id);
    } else {
      setOverColumnId(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      setActiveCard(null);
      setOverColumnId(null);
      return;
    }
    const activeId = active.id as string;
    const overId = over.id as string;

    const source = findCardLocation(activeId);
    if (source.colIndex === -1) {
      setActiveCard(null);
      setOverColumnId(null);
      return;
    }

    const destIsColumn = board.some((c) => c.id === overId);
    let destColIndex = -1;
    let destCardIndex = -1;

    if (destIsColumn) {
      destColIndex = board.findIndex((c) => c.id === overId);
      destCardIndex = board[destColIndex].cards.length;
    } else {
      const loc = findCardLocation(overId);
      destColIndex = loc.colIndex;
      destCardIndex = loc.cardIndex;
    }

    if (destColIndex === -1) {
      setActiveCard(null);
      setOverColumnId(null);
      return;
    }

    const newBoard = [...board];
    if (source.colIndex === destColIndex) {
      if (source.cardIndex !== destCardIndex) {
        newBoard[source.colIndex].cards = arrayMove(
          newBoard[source.colIndex].cards,
          source.cardIndex,
          destCardIndex
        );
      }
    } else {
      const [moved] = newBoard[source.colIndex].cards.splice(
        source.cardIndex,
        1
      );
      newBoard[destColIndex].cards.splice(destCardIndex, 0, moved);
    }
    setBoard(newBoard);
    setActiveCard(null);
    setOverColumnId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col sm:flex-row sm:space-x-4 overflow-x-auto p-2 sm:p-4">
        {board.map((column) => (
          <ColumnContainer
            key={column.id}
            column={column}
            isOver={overColumnId === column.id}
          >
            <SortableContext
              items={column.cards.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {column.cards.map((card) => (
                <Task key={card.id} task={card} />
              ))}
            </SortableContext>
          </ColumnContainer>
        ))}
      </div>

      <DragOverlay>
        {activeCard ? <Task task={activeCard} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
