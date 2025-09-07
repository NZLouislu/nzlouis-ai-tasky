import { PartialBlock } from "@blocknote/core";

export interface Page {
  id: string;
  title: string;
  content: PartialBlock[];
  icon?: string;
  cover?: {
    type: "color" | "image";
    value: string;
  };
  children?: Page[];
}

export const mockPages: Page[] = [
  {
    id: "page-1",
    title: "My First Page",
    content: [
      {
        type: "paragraph",
        content: "Welcome to AI Tasky Editor!"
      }
    ],
    children: [
      {
        id: "page-1-1",
        title: "Sub page 1",
        content: [
          {
            type: "paragraph",
            content: "This is a sub page of page 1."
          }
        ]
      }
    ]
  }
];