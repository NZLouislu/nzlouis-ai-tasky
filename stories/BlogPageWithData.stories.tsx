import React from "react";
import { Meta, StoryObj } from "@storybook/react";
import BlogPageStorybook from "../components/blog/BlogPageStorybook";
import { PartialBlock } from "@blocknote/core";



const meta: Meta<typeof BlogPageStorybook> = {
  title: "Blog/BlogPageWithData",
  component: BlogPageStorybook,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof BlogPageStorybook>;

export const WithMockData: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "BlogPage with simplified mock data for better performance",
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

export const WithRealApiIntegration: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "BlogPage with simulated API integration using mock data",
      },
    },
  },
  decorators: [
    (Story) => {
      return <Story />;
    },
  ],
};

export const FullFeaturedBlogPage: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "A full-featured blog page with optimized performance",
      },
    },
  },
};