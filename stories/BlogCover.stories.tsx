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

// Mock functions for Storybook
const mockSetShowCoverOptions = (show: boolean) => {
  console.log("Set show cover options:", show);
};

const mockRemovePostCover = (postId: string) => {
  console.log("Removing cover for post", postId);
};

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
    setShowCoverActions: (show: boolean) =>
      console.log("Set show cover actions:", show),
    setShowCoverOptions: mockSetShowCoverOptions,
    removePostCover: mockRemovePostCover,
    activePostId: "1",
  },
};

export const WithImageCover: Story = {
  args: {
    ...WithColorCover.args,
    activePost: {
      id: "2",
      title: "Sample Post with Image",
      content: [],
      cover: {
        type: "image",
        value: "https://images.unsplash.com/photo-1677442135722-5f11e06a4e6d",
      },
    },
    activePostId: "2",
  },
};

export const WithoutCover: Story = {
  args: {
    activePost: {
      id: "3",
      title: "Sample Post without Cover",
      content: [],
    },
    showCoverActions: false,
    setShowCoverActions: (show: boolean) =>
      console.log("Set show cover actions:", show),
    setShowCoverOptions: mockSetShowCoverOptions,
    removePostCover: mockRemovePostCover,
    activePostId: "3",
  },
};
