import ChatbotPanel from "../ChatbotPanel";

// Mock UnifiedChatbot component
jest.mock("../../UnifiedChatbot", () => {
  const actual = jest.requireActual("react");
  return {
    __esModule: true,
    default: () => actual.createElement("div", null, "Mock Chatbot"),
  };
});

describe("ChatbotPanel", () => {
  it("should be importable", () => {
    expect(ChatbotPanel).toBeDefined();
  });
});
