import React from "react";
import { Meta, StoryObj } from "@storybook/react";
import AIContinuationPanel from "../components/AIContinuationPanel";

const meta: Meta<typeof AIContinuationPanel> = {
  title: "Components/AIContinuationPanel",
  component: AIContinuationPanel,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AIContinuationPanel>;

export const Default: Story = {
  args: {
    selectedText:
      "This is the selected text that will be used for AI continuation.",
    contextBefore: "Previous content context",
    contextAfter: "Following content context",
    onAccept: (suggestion) => console.log("Accepted suggestion", suggestion),
    onClose: () => console.log("Panel closed"),
    position: { x: 100, y: 100 },
  },
};
