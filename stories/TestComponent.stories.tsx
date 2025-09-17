import React from "react";
import { Meta, StoryObj } from "@storybook/react";

const TestComponent = () => {
  return (
    <div>
      <h1>Test Component</h1>
      <p>This is a simple test component to verify Storybook is working.</p>
    </div>
  );
};

const meta: Meta<typeof TestComponent> = {
  title: "Test/TestComponent",
  component: TestComponent,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof TestComponent>;

export const Default: Story = {
  args: {},
};
