import React from "react";
import { Meta, StoryObj } from "@storybook/react";
import BlogContent from "../components/blog/BlogContent";
import { PartialBlock } from "@blocknote/core";

const meta: Meta<typeof BlogContent> = {
  title: "Blog/BlogContent",
  component: BlogContent,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof BlogContent>;

const mockEditor = () => <div>Mock Editor Component</div>;

export const WithContent: Story = {
  args: {
    activePost: {
      id: "1",
      title: "Sample Post",
      content: [
        {
          type: "paragraph",
          content: "This is a sample blog post content.",
        },
      ] as PartialBlock[],
      icon: "📝",
    },
    activePostId: "1",
    updatePostTitle: () => {},
    updatePostContent: () => {},
    Editor: mockEditor,
    isSaving: false,
    handleManualSave: () => {},
  },
};

export const WithoutIcon: Story = {
  args: {
    activePost: {
      id: "1",
      title: "Sample Post",
      content: [
        {
          type: "paragraph",
          content: "This is a sample blog post content.",
        },
      ] as PartialBlock[],
    },
    activePostId: "1",
    updatePostTitle: () => {},
    updatePostContent: () => {},
    Editor: mockEditor,
    isSaving: false,
    handleManualSave: () => {},
  },
};
