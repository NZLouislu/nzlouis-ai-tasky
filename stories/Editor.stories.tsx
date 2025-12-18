import React from "react";
import { Meta, StoryObj } from "@storybook/react";
import Editor from "@/components/Editor";
import { PartialBlock } from "@blocknote/core";

const meta: Meta<typeof Editor> = {
  title: "Components/Editor",
  component: Editor,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Editor>;

export const Empty: Story = {
  args: {
    initialContent: undefined,
    onChange: (content: PartialBlock[]) => console.log("Content changed", content),
    onSave: () => console.log("Save clicked"),
    isSaving: false,
  },
};

export const WithContent: Story = {
  args: {
    initialContent: [
      {
        type: "paragraph",
        content: "This is a sample paragraph in the editor.",
      },
      {
        type: "heading",
        content: "This is a heading",
        props: {
          level: 1,
        },
      },
      {
        type: "paragraph",
        content: "This is another paragraph with some ",
      },
    ] as PartialBlock[],
    onChange: (content: PartialBlock[]) => console.log("Content changed", content),
    onSave: () => console.log("Save clicked"),
    isSaving: false,
  },
};

export const Saving: Story = {
  args: {
    initialContent: [
      {
        type: "paragraph",
        content: "This is a sample paragraph in the editor.",
      },
    ] as PartialBlock[],
    onChange: (content: PartialBlock[]) => console.log("Content changed", content),
    onSave: () => console.log("Save clicked"),
    isSaving: true,
  },
};
