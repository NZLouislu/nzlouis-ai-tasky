import React from "react";
import { Meta, StoryObj } from "@storybook/react";
import BlogHeader from "../components/blog/BlogHeader";

const meta: Meta<typeof BlogHeader> = {
  title: "Blog/BlogHeader",
  component: BlogHeader,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof BlogHeader>;

export const WithIconAndCover: Story = {
  args: {
    activePost: {
      id: "1",
      title: "Sample Post",
      content: [],
      icon: "📝",
      cover: {
        type: "color",
        value: "bg-blue-500",
      },
    },
    setShowIconSelector: () => {},
    setShowCoverOptions: () => {},
    setShowDeleteDropdown: () => {},
    showIconSelector: false,
    showCoverOptions: false,
    showDeleteDropdown: false,
    dropdownRef: { current: null },
    handleDeletePost: () => {},
  },
};

export const WithoutIconOrCover: Story = {
  args: {
    activePost: {
      id: "1",
      title: "Sample Post",
      content: [],
    },
    setShowIconSelector: () => {},
    setShowCoverOptions: () => {},
    setShowDeleteDropdown: () => {},
    showIconSelector: false,
    showCoverOptions: false,
    showDeleteDropdown: false,
    dropdownRef: { current: null },
    handleDeletePost: () => {},
  },
};
