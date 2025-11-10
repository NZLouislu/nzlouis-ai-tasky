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

// Mock Editor component for Storybook
const MockEditor = (props: any) => (
  <div className="p-4 border border-gray-300 rounded">
    <p className="text-gray-600">Editor Component</p>
    <p className="text-sm text-gray-500 mt-2">Content would appear here</p>
  </div>
);

// Mock functions for Storybook
const mockUpdatePostTitle = (postId: string, newTitle: string) => {
  console.log("Update post title:", newTitle);
};

const mockUpdatePostContent = (newContent: PartialBlock[]) => {
  console.log("Update post content:", newContent);
};

const mockHandleManualSave = () => {
  console.log("Handle manual save");
};

export const WithIcon: Story = {
  args: {
    activePost: {
      id: "1",
      title: "Sample Blog Post with Icon",
      content: [
        {
          type: "paragraph",
          content: "This is a sample blog post content.",
        },
      ] as PartialBlock[],
      icon: "📝",
    },
    activePostId: "1",
    updatePostTitle: mockUpdatePostTitle,
    updatePostContent: mockUpdatePostContent,
    Editor: MockEditor,
    isSaving: false,
    handleManualSave: mockHandleManualSave,
  },
};

export const WithoutIcon: Story = {
  args: {
    ...WithIcon.args,
    activePost: {
      id: "2",
      title: "Sample Blog Post without Icon",
      content: [
        {
          type: "paragraph",
          content: "This is a sample blog post content.",
        },
      ] as PartialBlock[],
    },
    activePostId: "2",
  },
};

export const WithLongTitle: Story = {
  args: {
    ...WithIcon.args,
    activePost: {
      id: "3",
      title: "This is a very long blog post title that should be centered",
      content: [
        {
          type: "paragraph",
          content: "This is a sample blog post content.",
        },
      ] as PartialBlock[],
      icon: "📚",
    },
    activePostId: "3",
  },
};
