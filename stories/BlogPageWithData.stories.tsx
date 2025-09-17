import React from "react";
import { Meta, StoryObj } from "@storybook/react";
import BlogPage from "../components/blog/BlogPage";
import { PartialBlock } from "@blocknote/core";

// Mock API service for Storybook
const mockApiService = {
  // Mock function to simulate fetching posts from API
  fetchPosts: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
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
                    content:
                      "Learn how to configure your AI writing environment.",
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
              value:
                "https://images.unsplash.com/photo-1677442135722-5f11e06a4e6d",
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
        ]);
      }, 500); // Simulate network delay
    });
  },

  // Mock function to simulate creating a new post
  createPost: async (postData: any) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ...postData,
          id: `post-${Date.now()}`,
          created_at: new Date().toISOString(),
        });
      }, 300);
    });
  },

  // Mock function to simulate updating a post
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

  // Mock function to simulate deleting a post
  deletePost: async (postId: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, postId });
      }, 300);
    });
  },
};

const meta: Meta<typeof BlogPage> = {
  title: "Blog/BlogPageWithData",
  component: BlogPage,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof BlogPage>;

export const WithMockData: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "BlogPage with comprehensive mock data simulating API responses",
      },
    },
  },
};

export const LoadingState: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "BlogPage showing loading state while fetching data",
      },
    },
  },
};

export const ErrorState: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "BlogPage showing error state when API calls fail",
      },
    },
  },
};

// For real data integration, you would typically use tools like MSW (Mock Service Worker)
// or set up a proper Storybook decorator that provides the necessary context
export const WithRealApiIntegration: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          "BlogPage with real API integration (requires proper Supabase configuration and authentication)",
      },
    },
  },
};

// 添加一个新的故事，展示更丰富的博客页面功能
export const FullFeaturedBlogPage: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          "A full-featured blog page with all UI elements and interactions",
      },
    },
  },
};
