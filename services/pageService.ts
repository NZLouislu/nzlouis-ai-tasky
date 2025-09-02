import { mockPage } from "../lib/mockData";
import { PartialBlock } from "@blocknote/core";

export async function getPage() {
  const content: PartialBlock[] = mockPage.content.map((item) => ({
    type: "paragraph",
    content: item.content,
  }));

  return {
    ...mockPage,
    content,
  };
}

export async function savePage(content: unknown) {
  console.log("Saving to mock data", content);
}
