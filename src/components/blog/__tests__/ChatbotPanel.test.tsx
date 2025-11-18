import ChatbotPanel from "../ChatbotPanel";
import { vi } from 'vitest';
import React from 'react';

vi.mock("../../UnifiedChatbot", () => {
  return {
    default: () => React.createElement("div", null, "Mock Chatbot"),
  };
});

describe("ChatbotPanel", () => {
  it("should be importable", () => {
    expect(ChatbotPanel).toBeDefined();
  });
});
