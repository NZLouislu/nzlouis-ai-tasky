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

const colorOptions = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-yellow-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-gray-500",
  "bg-red-500",
];

export const Default: Story = {
  args: {
    showCoverOptions: true,
    setShowCoverOptions: () => {},
    colorOptions,
    setPostCover: () => {},
    activePostId: "1",
    handleCoverFileSelect: () => {},
  },
};

export const Hidden: Story = {
  args: {
    showCoverOptions: false,
    setShowCoverOptions: () => {},
    colorOptions,
    setPostCover: () => {},
    activePostId: "1",
    handleCoverFileSelect: () => {},
  },
};
