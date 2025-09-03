"use client";

import React, { useEffect, useState } from "react";
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
import Task from "./Task";
import ColumnContainer from "./ColumnContainer";
import { Card, Column } from "./types";



export default function TaskList({ initialBoard }: { initialBoard: Column[] }) {
  const [board, setBoard] = useState<Column[]>(
    initialBoard.map((c) => ({ ...c, cards: [...c.cards] }))
  );
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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

  if (isMobile) {
    return (
      <div className="w-full max-w-[900px] px-2 py-2">
        <div className="flex flex-col gap-4">
          {board.map((column) => (
            <div key={column.id} className="bg-gray-100 rounded-lg p-4 w-full">
              <h3 className="font-bold text-gray-700 mb-3 text-base">
                {column.title}
              </h3>
              <div className="flex flex-col">
                {column.cards.map((card) => (
                  <div
                    key={card.id}
                    className="bg-white rounded-lg shadow p-4 mb-3"
                  >
                    <h4 className="font-semibold text-gray-800 text-base">
                      {card.title}
                    </h4>
                    {card.description && (
                      <p className="text-gray-500 text-sm mt-1">
                        {card.description}
                      </p>
                    )}
                    {card.due && (
                      <span className="text-gray-400 text-xs mt-2 block">
                        Due: {card.due}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full max-w-[900px] px-2 md:px-4 flex flex-row gap-4 p-2">
        {board.map((column) => (
          <ColumnContainer
            key={column.id}
            id={column.id}
            title={column.title}
            onOverChange={(isOver) => {
              if (isOver) setOverColumnId(column.id);
              else if (overColumnId === column.id) setOverColumnId(null);
            }}
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
