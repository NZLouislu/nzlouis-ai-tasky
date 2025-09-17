import React from "react";
import { Meta, StoryObj } from "@storybook/react";
import ChatbotPanel from "../components/blog/ChatbotPanel";

const meta: Meta<typeof ChatbotPanel> = {
  title: "Blog/ChatbotPanel",
  component: ChatbotPanel,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ChatbotPanel>;

export const Visible: Story = {
  args: {
    isChatbotVisible: true,
    isMobile: false,
    chatbotWidth: 600,
    setIsChatbotVisible: () => {},
    setSidebarOpen: () => {},
    setSidebarCollapsed: () => {},
    handleMouseDown: () => {},
    handlePageModification: async () => "",
  },
};

export const Hidden: Story = {
  args: {
    isChatbotVisible: false,
    isMobile: false,
    chatbotWidth: 600,
    setIsChatbotVisible: () => {},
    setSidebarOpen: () => {},
    setSidebarCollapsed: () => {},
    handleMouseDown: () => {},
    handlePageModification: async () => "",
  },
};
