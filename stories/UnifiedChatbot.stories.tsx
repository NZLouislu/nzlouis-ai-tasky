import React from "react";
import { Meta, StoryObj } from "@storybook/react";
import UnifiedChatbot from "../components/UnifiedChatbot";

const meta: Meta<typeof UnifiedChatbot> = {
  title: "Components/UnifiedChatbot",
  component: UnifiedChatbot,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof UnifiedChatbot>;

export const WorkspaceMode: Story = {
  args: {
    mode: "workspace",
    onPageModification: async (mod) => {
      console.log("Page modification", mod);
      return "Modification applied";
    },
  },
};

export const StandaloneMode: Story = {
  args: {
    mode: "standalone",
  },
};
