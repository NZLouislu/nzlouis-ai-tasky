/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { AssistantRuntime } from '@assistant-ui/react';
import { sendMessageToAI } from '@/lib/aiService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export class CustomAssistantRuntime implements AssistantRuntime {
  private messages: Message[] = [];
  private loadingState = false;

  async sendUserMessage(content: string): Promise<void> {
    this.loadingState = true;
    
    this.messages.push({
      id: Date.now().toString(),
      role: 'user',
      content,
      createdAt: new Date(),
    });
    
    try {
      const aiResponse = await sendMessageToAI(content);
      
      this.messages.push({
        id: Date.now().toString(),
        role: 'assistant',
        content: aiResponse,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Error sending message to AI:', error);
      this.messages.push({
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        createdAt: new Date(),
      });
    } finally {
      this.loadingState = false;
    }
  }

  getMessages(): Message[] {
    return this.messages;
  }

  clearMessages(): void {
    this.messages = [];
  }

  isLoading(): boolean {
    return this.loadingState;
  }

  // Stub implementations for required methods
  getThreads() { return []; }
  getThread() { return null; }
  switchToNewThread() {}
  regenerateAssistantMessage() { return Promise.resolve(); }
  deleteMessage() { return Promise.resolve(); }
  switchToThread() {}
  get threadList() { return []; }
  get thread() { return null; }
}