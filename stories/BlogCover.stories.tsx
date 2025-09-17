import React from "react";
import { Meta, StoryObj } from "@storybook/react";
import BlogCover from "../components/blog/BlogCover";

const meta: Meta<typeof BlogCover> = {
  title: "Blog/BlogCover",
  component: BlogCover,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof BlogCover>;

export const WithColorCover: Story = {
  args: {
    activePost: {
      id: "1",
      title: "Sample Post",
      content: [],
      cover: {
        type: "color",
        value: "bg-blue-500",
      },
    },
    showCoverActions: true,
    setShowCoverActions: () => {},
    setShowCoverOptions: () => {},
    removePostCover: () => {},
    activePostId: "1",
  },
};

export const WithImageCover: Story = {
  args: {
    activePost: {
      id: "1",
      title: "Sample Post",
      content: [],
      cover: {
        type: "image",
        value:
          "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800",
      },
    },
    showCoverActions: true,
    setShowCoverActions: () => {},
    setShowCoverOptions: () => {},
    removePostCover: () => {},
    activePostId: "1",
  },
};

export const WithoutCover: Story = {
  args: {
    activePost: {
      id: "1",
      title: "Sample Post",
      content: [],
    },
    showCoverActions: false,
    setShowCoverActions: () => {},
    setShowCoverOptions: () => {},
    removePostCover: () => {},
    activePostId: "1",
  },
};
