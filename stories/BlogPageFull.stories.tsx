import React from "react";
import { Meta, StoryObj } from "@storybook/react";
import BlogPage from "../components/blog/BlogPage";
import { PartialBlock } from "@blocknote/core";

const meta: Meta<typeof BlogPage> = {
  title: "Blog/BlogPageFull",
  component: BlogPage,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof BlogPage>;

// Comprehensive mock data for Storybook
const comprehensiveMockPosts = [
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
      {
        id: "1-2",
        title: "Configuration Options",
        content: [
          {
            type: "paragraph",
            content: "Explore different configuration options available.",
          },
        ] as PartialBlock[],
        icon: "🔧",
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
      {
        type: "heading",
        content: "Natural Language Processing",
        props: {
          level: 2,
        },
      },
      {
        type: "paragraph",
        content: "NLP is at the core of modern AI writing assistants.",
      },
    ] as PartialBlock[],
    icon: "🔬",
    cover: {
      type: "image",
      value: "https://images.unsplash.com/photo-1677442135722-5f11e06a4e6d",
    },
    parent_id: null,
    children: [
      {
        id: "2-1",
        title: "Language Models",
        content: [
          {
            type: "paragraph",
            content: "Understanding transformer-based language models.",
          },
        ] as PartialBlock[],
        icon: "🤖",
        parent_id: "2",
        children: [],
      },
    ],
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
  {
    id: "4",
    title: "Best Practices for Content Creation",
    content: [
      {
        type: "paragraph",
        content:
          "Learn the best practices for creating high-quality content with AI assistance.",
      },
    ] as PartialBlock[],
    icon: "🏆",
    cover: {
      type: "color",
      value: "bg-green-500",
    },
    parent_id: null,
    children: [
      {
        id: "4-1",
        title: "Content Strategy",
        content: [
          {
            type: "paragraph",
            content: "Developing an effective content strategy.",
          },
        ] as PartialBlock[],
        icon: "🧭",
        parent_id: "4",
        children: [],
      },
      {
        id: "4-2",
        title: "SEO Optimization",
        content: [
          {
            type: "paragraph",
            content: "Optimizing your content for search engines.",
          },
        ] as PartialBlock[],
        icon: "🔍",
        parent_id: "4",
        children: [],
      },
    ],
  },
];

// Extended mock data with more posts
const extendedMockPosts = [
  ...comprehensiveMockPosts,
  {
    id: "5",
    title: "Case Studies",
    content: [
      {
        type: "paragraph",
        content:
          "Real-world examples of successful AI-assisted writing projects.",
      },
    ] as PartialBlock[],
    icon: "📚",
    cover: {
      type: "color",
      value: "bg-purple-500",
    },
    parent_id: null,
    children: [
      {
        id: "5-1",
        title: "Marketing Copy",
        content: [
          {
            type: "paragraph",
            content:
              "How AI helped a company improve their marketing copy performance.",
          },
        ] as PartialBlock[],
        icon: "📢",
        parent_id: "5",
        children: [],
      },
      {
        id: "5-2",
        title: "Technical Documentation",
        content: [
          {
            type: "paragraph",
            content: "Streamlining technical documentation with AI tools.",
          },
        ] as PartialBlock[],
        icon: "📄",
        parent_id: "5",
        children: [],
      },
    ],
  },
  {
    id: "6",
    title: "Future of AI Writing",
    content: [
      {
        type: "paragraph",
        content:
          "Exploring the future trends and developments in AI writing technology.",
      },
    ] as PartialBlock[],
    icon: "🚀",
    cover: {
      type: "image",
      value: "https://images.unsplash.com/photo-1677442135723-5f11e06a4e6e",
    },
    parent_id: null,
    children: [],
  },
];

export const WithMockData: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          "BlogPage with comprehensive mock data for testing all UI elements",
      },
    },
  },
};

export const WithExtendedMockData: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          "BlogPage with extended mock data including more posts and nested structures",
      },
    },
  },
};

export const LoadingState: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "BlogPage showing loading state",
      },
    },
  },
};

export const ErrorState: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "BlogPage showing error state",
      },
    },
  },
};

export const EmptyState: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "BlogPage with no posts (empty state)",
      },
    },
  },
};

// For real data integration, you would typically use tools like MSW (Mock Service Worker)
export const WithRealApiIntegration: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          "BlogPage with real API integration (requires proper backend setup)",
      },
    },
  },
};

// Additional stories for specific UI states
export const WithCoverImages: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "BlogPage displaying posts with cover images",
      },
    },
  },
};

export const WithCustomIcons: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "BlogPage displaying posts with custom icons",
      },
    },
  },
};

export const WithDeeplyNestedPages: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "BlogPage with deeply nested page structure",
      },
    },
  },
};
