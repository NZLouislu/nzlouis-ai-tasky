import React from "react";
import { Meta, StoryObj } from "@storybook/react";

const SimpleTest = () => {
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Simple Test Component</h1>
      <p>If you can see this, Storybook is working correctly!</p>
    </div>
  );
};

const meta: Meta<typeof SimpleTest> = {
  title: "Test/SimpleTest",
  component: SimpleTest,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SimpleTest>;

export const Default: Story = {
  args: {},
};
