export const sendMessageToAI = async (content: string): Promise<string> => {
  // This should call the actual AI service API
  // Currently we're simulating a simple reply
  return `This is AI's response to "${content}"`;
};
