import React from "react";
import type { Preview } from "@storybook/react";
import "../styles/globals.css";

const preview: Preview = {
  decorators: [
    (Story) => (
      <div style={{ padding: 20 }}>
        <Story />
      </div>
    ),
  ],
};

export default preview;