import React from "react";
import { Meta, StoryObj } from "@storybook/react";
import BlogHeader from "@/components/blog/BlogHeader";

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

// Mock functions for Storybook
const mockHandleDeletePost = () => {
  console.log("Handle delete post");
};

export const WithIconAndCover: Story = {
  args: {
    setShowDeleteDropdown: (show: boolean) =>
      console.log("Set show delete dropdown:", show),
    showDeleteDropdown: false,
    dropdownRef: React.createRef(),
    handleDeletePost: mockHandleDeletePost,
  },
};

export const WithoutIconAndCover: Story = {
  args: {
    ...WithIconAndCover.args,
  },
};
