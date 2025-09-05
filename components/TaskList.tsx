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
      <div className="w-full max-w-[900px] mx-auto px-4 md:px-6 lg:px-8 py-6">
        <div className="flex flex-col gap-6">
          {board.map((column) => (
            <div key={column.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 text-lg flex items-center">
                  {column.title}
                  <span className="ml-auto text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {column.cards.length}
                  </span>
                </h3>
              </div>
              <div className="p-4">
                <div className="flex flex-col gap-3">
                  {column.cards.map((card) => (
                    <div
                      key={card.id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow"
                    >
                      <h4 className="font-semibold text-gray-900 text-base mb-2">
                        {card.title}
                      </h4>
                      {card.description && (
                        <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                          {card.description}
                        </p>
                      )}
                      {card.due && (
                        <div className="flex items-center text-sm text-gray-500">
                          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {card.due}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
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
      <div className="w-full max-w-[900px] mx-auto px-4 md:px-6 lg:px-8 py-6">
        <div className="flex flex-row gap-6 overflow-x-auto pb-4">
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
      </div>
      <DragOverlay>
        {activeCard ? <Task task={activeCard} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
