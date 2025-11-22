import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string; // Legacy support
  images?: string[]; // New support for multiple images
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  tested?: boolean;
  working?: boolean;
}

interface ChatState {
  // Data
  sessions: ChatSession[];
  currentSessionId: string | null;
  messages: Message[];
  availableModels: AIModel[];
  selectedModel: string;
  selectedProvider: string;
  sidebarOpen: boolean;
  
  // UI State (not necessarily persisted, but good for global access)
  isLoading: boolean;
  input: string;
  previewImages: string[];

  // Actions
  setSessions: (sessions: ChatSession[]) => void;
  setCurrentSessionId: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateLastMessage: (content: string) => void;
  setAvailableModels: (models: AIModel[]) => void;
  setSelectedModel: (modelId: string) => void;
  setSelectedProvider: (providerId: string) => void;
  setSidebarOpen: (open: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setInput: (input: string) => void;
  setPreviewImages: (images: string[]) => void;
  
  // Helper to clear current chat
  clearCurrentChat: () => void;

  // Contextual Chat State (for Blog/Stories)
  contextChats: Record<string, Message[]>;
  setContextMessages: (entityId: string, messages: Message[]) => void;
  addContextMessage: (entityId: string, message: Message) => void;
  clearContextMessages: (entityId: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      sessions: [],
      currentSessionId: null,
      messages: [],
      availableModels: [],
      selectedModel: '',
      selectedProvider: '',
      sidebarOpen: true,
      isLoading: false,
      input: '',
      previewImages: [],
      contextChats: {},

      setSessions: (sessions) => set({ sessions }),
      setCurrentSessionId: (id) => set({ currentSessionId: id }),
      setMessages: (messages) => set({ messages }),
      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
      updateLastMessage: (content) => set((state) => {
        const newMessages = [...state.messages];
        if (newMessages.length > 0) {
          newMessages[newMessages.length - 1].content = content;
        }
        return { messages: newMessages };
      }),
      setAvailableModels: (models) => set({ availableModels: models }),
      setSelectedModel: (modelId) => set({ selectedModel: modelId }),
      setSelectedProvider: (providerId) => set({ selectedProvider: providerId }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setInput: (input) => set({ input }),
      setPreviewImages: (images) => set({ previewImages: images }),
      
      clearCurrentChat: () => set({ 
        currentSessionId: null, 
        messages: [], 
        input: '', 
        previewImages: [] 
      }),

      setContextMessages: (entityId, messages) => set((state) => ({
        contextChats: { ...state.contextChats, [entityId]: messages }
      })),
      addContextMessage: (entityId, message) => set((state) => ({
        contextChats: {
          ...state.contextChats,
          [entityId]: [...(state.contextChats[entityId] || []), message]
        }
      })),
      clearContextMessages: (entityId) => set((state) => {
        const newContextChats = { ...state.contextChats };
        delete newContextChats[entityId];
        return { contextChats: newContextChats };
      }),
    }),
    {
      name: 'chat-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields
        sessions: state.sessions,
        currentSessionId: state.currentSessionId,
        // messages: state.messages, // Optional: persist messages if we want offline access, but might be heavy
        availableModels: state.availableModels,
        selectedModel: state.selectedModel,
        selectedProvider: state.selectedProvider,
        sidebarOpen: state.sidebarOpen,
        contextChats: state.contextChats, // Persist context chats
      }),
    }
  )
);
