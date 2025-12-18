import React from "react";
import { Meta, StoryObj } from "@storybook/react";
import IconSelector from "@/components/blog/IconSelector";

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

// Mock functions for Storybook
const mockSetPostIcon = (postId: string, icon: string) => {
  console.log("Setting icon", icon, "for post", postId);
};

const mockRemovePostIcon = (postId: string) => {
  console.log("Removing icon for post", postId);
};

export const Default: Story = {
  args: {
    showIconSelector: true,
    setShowIconSelector: (show: boolean) =>
      console.log("Set show icon selector:", show),
    iconOptions: [
      "📝",
      "📘",
      "📚",
      "📋",
      "📌",
      "🔍",
      "💡",
      "⚙️",
      "🛠️",
      "🔬",
      "🎨",
      "📊",
      "📈",
      "📉",
      "💰",
      "🛒",
    ],
    setPostIcon: mockSetPostIcon,
    removePostIcon: mockRemovePostIcon,
    activePostId: "1",
  },
};

export const Hidden: Story = {
  args: {
    ...Default.args,
    showIconSelector: false,
  },
};
