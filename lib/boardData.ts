export interface Card {
  id: string;
  title: string;
  description?: string;
  due?: string;
}

export interface Column {
  id: string;
  title: string;
  cards: Card[];
}

export const boardData: Column[] = [
  {
    id: "todo",
    title: "To Do",
    cards: [
      {
        id: "task1",
        title: "Write project documentation",
        description: "Complete README",
        due: "2025-09-05",
      },
      {
        id: "task2",
        title: "Update blog",
        description: "Publish AI project progress",
        due: "2025-09-06",
      },
    ],
  },
  {
    id: "inprogress",
    title: "In Progress",
    cards: [
      {
        id: "task3",
        title: "Build frontend pages",
        description: "React + Tailwind",
        due: "2025-09-07",
      },
    ],
  },
  {
    id: "done",
    title: "Done",
    cards: [],
  },
];
