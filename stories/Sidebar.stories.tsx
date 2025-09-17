import React from "react";
import { Meta, StoryObj } from "@storybook/react";
import Sidebar from "../components/Sidebar";

const meta: Meta<typeof Sidebar> = {
  title: "Components/Sidebar",
  component: Sidebar,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

const samplePages = [
  {
    id: "1",
    title: "Getting Started",
    icon: "📝",
    children: [
      {
        id: "1-1",
        title: "Introduction",
        icon: "📄",
      },
      {
        id: "1-2",
        title: "Installation",
        icon: "📥",
      },
    ],
  },
  {
    id: "2",
    title: "Components",
    icon: "🧩",
    children: [
      {
        id: "2-1",
        title: "Buttons",
        icon: "🔘",
      },
      {
        id: "2-2",
        title: "Forms",
        icon: "📝",
      },
    ],
  },
  {
    id: "3",
    title: "API Reference",
    icon: "📚",
  },
];

export const Default: Story = {
  args: {
    title: "Documentation",
    icon: "📖",
    pages: samplePages,
    activePageId: "1-1",
    onAddPage: () => console.log("Add page clicked"),
    onAddSubPage: (parentPageId) =>
      console.log("Add sub page clicked for", parentPageId),
    onUpdatePageTitle: (pageId, newTitle) =>
      console.log("Update page title", pageId, newTitle),
    onSelectPage: (pageId) => console.log("Select page", pageId),
    sidebarOpen: true,
    expandedPages: new Set(["1", "2"]),
    onToggleExpand: (pageId) => console.log("Toggle expand", pageId),
  },
};

export const Collapsed: Story = {
  args: {
    title: "Documentation",
    icon: "📖",
    pages: samplePages,
    activePageId: "1-1",
    onAddPage: () => console.log("Add page clicked"),
    onAddSubPage: (parentPageId) =>
      console.log("Add sub page clicked for", parentPageId),
    onUpdatePageTitle: (pageId, newTitle) =>
      console.log("Update page title", pageId, newTitle),
    onSelectPage: (pageId) => console.log("Select page", pageId),
    sidebarOpen: false,
    expandedPages: new Set(["1", "2"]),
    onToggleExpand: (pageId) => console.log("Toggle expand", pageId),
  },
};
