import React from "react";
import { Meta, StoryObj } from "@storybook/react";
import DeleteDropdown from "@/components/blog/DeleteDropdown";

const meta: Meta<typeof DeleteDropdown> = {
  title: "Blog/DeleteDropdown",
  component: DeleteDropdown,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DeleteDropdown>;

export const Default: Story = {
  args: {
    dropdownRef: { current: null },
    handleDeletePost: () => {},
  },
};
