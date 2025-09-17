import React from "react";
import { Meta, StoryObj } from "@storybook/react";

// 创建一个简化的 BlogPage 组件用于测试
const SimpleBlogPage = () => {
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Blog Page</h1>
      <p>
        If you can see this, the BlogPage component is working in Storybook!
      </p>
    </div>
  );
};

const meta: Meta<typeof SimpleBlogPage> = {
  title: "Blog/SimpleBlogPage",
  component: SimpleBlogPage,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SimpleBlogPage>;

export const Default: Story = {
  args: {},
};
