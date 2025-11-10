import React from "react";
import { Meta, StoryObj } from "@storybook/react";

// Create a simplified BlogContent component for testing
const SimpleBlogContent = () => {
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Blog Content</h1>
      <p>This is a simplified blog content component for testing.</p>
      <div
        style={{
          minHeight: "200px",
          border: "1px solid #ccc",
          padding: "20px",
          marginTop: "20px",
        }}
      >
        <h2>Sample Content</h2>
        <p>This is sample content without the BlockNote editor.</p>
      </div>
    </div>
  );
};

const meta: Meta<typeof SimpleBlogContent> = {
  title: "Blog/SimpleBlogContent",
  component: SimpleBlogContent,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SimpleBlogContent>;

export const Default: Story = {
  args: {},
};
