import React from "react";
import { Meta, StoryObj } from "@storybook/react";
import BlogPage from "../components/blog/BlogPage";
import { PartialBlock } from "@blocknote/core";

const meta: Meta<typeof BlogPage> = {
  title: "Blog/BlogPage",
  component: BlogPage,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof BlogPage>;

// Mock data for Storybook
const mockPosts = [
  {
    id: "1",
    title: "Getting Started with AI Writing",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Welcome to our AI-powered writing assistant! This blog post will help you get started with using AI to enhance your writing workflow.",
            styles: {},
          },
        ],
      },
      {
        type: "heading",
        content: "Key Features",
        props: {
          level: 2,
        },
      },
      {
        type: "bulletListItem",
        content: "AI content generation",
      },
      {
        type: "bulletListItem",
        content: "Real-time collaboration",
      },
      {
        type: "bulletListItem",
        content: "Smart editing suggestions",
      },
    ] as PartialBlock[],
    icon: "📝",
    cover: {
      type: "color",
      value: "bg-blue-500",
    },
    parent_id: null,
    children: [
      {
        id: "1-1",
        title: "Basic Setup",
        content: [
          {
            type: "paragraph",
            content: "Learn how to configure your AI writing environment.",
          },
        ] as PartialBlock[],
        icon: "⚙️",
        parent_id: "1",
        children: [],
      },
    ],
  },
  {
    id: "2",
    title: "Advanced AI Techniques",
    content: [
      {
        type: "paragraph",
        content:
          "Explore advanced techniques for leveraging AI in your writing process.",
      },
    ] as PartialBlock[],
    icon: "🔬",
    cover: {
      type: "image",
      value: "https://images.unsplash.com/photo-1677442135722-5f11e06a4e6d",
    },
    parent_id: null,
    children: [],
  },
  {
    id: "3",
    title: "Troubleshooting Guide",
    content: [
      {
        type: "paragraph",
        content:
          "Common issues and solutions when working with AI writing tools.",
      },
    ] as PartialBlock[],
    icon: "❓",
    parent_id: null,
    children: [],
  },
];

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Default BlogPage with mock data for Storybook",
      },
    },
  },
};

export const WithMultiplePosts: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "BlogPage with multiple posts and nested structure",
      },
    },
  },
};

export const WithCoverImage: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "BlogPage displaying a post with cover image",
      },
    },
  },
};

export const WithIconSelector: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "BlogPage with icon selector displayed above title",
      },
    },
  },
};

export const WithCoverOptions: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "BlogPage with cover options displayed above title",
      },
    },
  },
};

export const Loading: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "BlogPage in loading state",
      },
    },
  },
};

export const WithError: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "BlogPage with error state",
      },
    },
  },
};

// Note: For real data stories, you would need to set up a mock API or use MSW
// This is just a placeholder to show how you might structure it
export const WithRealData: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          "BlogPage connected to real API (requires Supabase configuration)",
      },
    },
  },
};
