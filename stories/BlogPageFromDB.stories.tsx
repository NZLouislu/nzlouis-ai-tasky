import React from "react";
import { Meta, StoryObj } from "@storybook/react";
import BlogPageFromDB from "@/components/blog/BlogPageFromDB";

const meta: Meta<typeof BlogPageFromDB> = {
  title: "Blog/BlogPageFromDB",
  component: BlogPageFromDB,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof BlogPageFromDB>;

export const ReadOnlyFromDatabase: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "BlogPage that fetches real data from Supabase database in read-only mode",
      },
    },
  },
};

export const DatabaseConnection: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "BlogPage with live database connection for viewing existing posts",
      },
    },
  },
};