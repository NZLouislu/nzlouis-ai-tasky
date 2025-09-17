import React from "react";
import { Meta, StoryObj } from "@storybook/react";
import IconSelector from "../components/blog/IconSelector";

const meta: Meta<typeof IconSelector> = {
  title: "Blog/IconSelector",
  component: IconSelector,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof IconSelector>;

const iconOptions = ["📝", "📄", "📑", "📊", "📋", "📌", "⭐", "💡"];

export const Default: Story = {
  args: {
    showIconSelector: true,
    setShowIconSelector: () => {},
    iconOptions,
    setPostIcon: () => {},
    removePostIcon: () => {},
    activePostId: "1",
  },
};

export const Hidden: Story = {
  args: {
    showIconSelector: false,
    setShowIconSelector: () => {},
    iconOptions,
    setPostIcon: () => {},
    removePostIcon: () => {},
    activePostId: "1",
  },
};
