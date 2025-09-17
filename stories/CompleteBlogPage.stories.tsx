import React from "react";
import { Meta, StoryObj } from "@storybook/react";
import BlogPage from "../components/blog/BlogPage";

const meta: Meta<typeof BlogPage> = {
  title: "Blog/CompleteBlogPage",
  component: BlogPage,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof BlogPage>;

// Mock data for different scenarios
const mockPostsData = [
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
    ],
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
        ],
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
        ],
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
    ],
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
        ],
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
    ],
    icon: "❓",
    parent_id: null,
    children: [],
  },
];

// Mock API service
const mockApiService = {
  fetchPosts: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockPostsData);
      }, 300);
    });
  },

  createPost: async (postData: any) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newPost = {
          ...postData,
          id: `post-${Date.now()}`,
          created_at: new Date().toISOString(),
        };
        resolve(newPost);
      }, 300);
    });
  },

  updatePost: async (postId: string, updates: any) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: postId,
          ...updates,
          updated_at: new Date().toISOString(),
        });
      }, 300);
    });
  },

  deletePost: async (postId: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, postId });
      }, 300);
    });
  },
};

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Default BlogPage with mock data",
      },
    },
  },
};

export const WithNestedPages: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "BlogPage with nested page structure",
      },
    },
  },
};

export const WithCoverImage: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "BlogPage displaying posts with cover images",
      },
    },
  },
};

export const WithIcons: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "BlogPage displaying posts with custom icons",
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

// For real data stories, you would need to set up a mock API or use MSW
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
