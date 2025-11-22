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

export interface ChatMeta {
  lastFetched: number;
  isStale: boolean;
  totalCount: number;
  hasMore: boolean;
  currentOffset: number;
  isLoadingMore: boolean;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  messages: Message[];
  availableModels: AIModel[];
  selectedModel: string;
  selectedProvider: string;
  sidebarOpen: boolean;
  
  isLoading: boolean;
  input: string;
  previewImages: string[];

  contextChats: Record<string, Message[]>;
  contextChatsMeta: Record<string, ChatMeta>;
  loadingStates: Record<string, LoadingState>;

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
  
  clearCurrentChat: () => void;

  setContextMessages: (entityId: string, messages: Message[]) => void;
  addContextMessage: (entityId: string, message: Message) => void;
  updateContextLastMessage: (entityId: string, content: string) => void;
  clearContextMessages: (entityId: string) => void;
  
  setChatMeta: (entityId: string, meta: ChatMeta) => void;
  isCacheValid: (entityId: string) => boolean;
  setLoadingState: (entityId: string, state: LoadingState) => void;
  getLoadingState: (entityId: string) => LoadingState;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
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
      contextChatsMeta: {},
      loadingStates: {},

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
      updateContextLastMessage: (entityId, content) => set((state) => {
        const messages = state.contextChats[entityId] || [];
        if (messages.length === 0) return state;
        
        const newMessages = [...messages];
        const lastMessage = { ...newMessages[newMessages.length - 1] };
        lastMessage.content = content;
        newMessages[newMessages.length - 1] = lastMessage;

        return {
          contextChats: {
            ...state.contextChats,
            [entityId]: newMessages
          }
        };
      }),
      clearContextMessages: (entityId) => set((state) => {
        const newContextChats = { ...state.contextChats };
        delete newContextChats[entityId];
        return { contextChats: newContextChats };
      }),

      setChatMeta: (entityId, meta) => set((state) => ({
        contextChatsMeta: { ...state.contextChatsMeta, [entityId]: meta }
      })),

      isCacheValid: (entityId) => {
        const state = get();
        const meta = state.contextChatsMeta[entityId];
        if (!meta) return false;

        const cacheMaxAge = 5 * 60 * 1000;
        const now = Date.now();
        const isExpired = now - meta.lastFetched > cacheMaxAge;

        return !isExpired && !meta.isStale;
      },

      setLoadingState: (entityId, loadingState) => set((state) => ({
        loadingStates: { ...state.loadingStates, [entityId]: loadingState }
      })),

      getLoadingState: (entityId) => {
        const state = get();
        return state.loadingStates[entityId] || 'idle';
      },
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sessions: state.sessions,
        currentSessionId: state.currentSessionId,
        availableModels: state.availableModels,
        selectedModel: state.selectedModel,
        selectedProvider: state.selectedProvider,
        sidebarOpen: state.sidebarOpen,
        contextChats: state.contextChats,
        contextChatsMeta: state.contextChatsMeta,
      }),
    }
  )
);
