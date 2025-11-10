import React from "react";
import { Meta, StoryObj } from "@storybook/react";
import CoverOptions from "../components/blog/CoverOptions";

const meta: Meta<typeof CoverOptions> = {
  title: "Blog/CoverOptions",
  component: CoverOptions,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CoverOptions>;

// Mock functions for Storybook
const mockSetPostCover = (
  postId: string,
  cover: { type: string; value: string }
) => {
  console.log("Setting cover", cover, "for post", postId);
};

const mockHandleCoverFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  console.log("Handling cover file select");
};

export const Default: Story = {
  args: {
    showCoverOptions: true,
    setShowCoverOptions: (show: boolean) =>
      console.log("Set show cover options:", show),
    colorOptions: [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-gray-500",
    ],
    setPostCover: mockSetPostCover,
    activePostId: "1",
    handleCoverFileSelect: mockHandleCoverFileSelect,
  },
};

export const Hidden: Story = {
  args: {
    ...Default.args,
    showCoverOptions: false,
  },
};
