import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface ChatUsage {
  messagesToday: number;
  messagesLimitHourly: number;
  messagesLimitDaily: number;
  tokensToday: number;
  tokensLimitDaily: number;
  tokensMonth: number;
  tokensLimitMonthly: number;
  canSend: boolean;
  nextAvailableAt: string | null;
}

interface ChatState {
  isOpen: boolean;
  conversationId: string | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  usage: ChatUsage | null;
  toggle: () => void;
  open: () => void;
  close: () => void;
  setConversationId: (id: string) => void;
  addMessage: (msg: ChatMessage) => void;
  appendToLastAssistant: (chunk: string) => void;
  setStreaming: (v: boolean) => void;
  setError: (e: string | null) => void;
  setUsage: (u: ChatUsage) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  isOpen: false,
  conversationId: null,
  messages: [],
  isStreaming: false,
  error: null,
  usage: null,

  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  setConversationId: (id) => set({ conversationId: id }),

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),

  appendToLastAssistant: (chunk) =>
    set((s) => {
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      if (last?.role === 'assistant') {
        msgs[msgs.length - 1] = { ...last, content: last.content + chunk };
      }
      return { messages: msgs };
    }),

  setStreaming: (v) => set({ isStreaming: v }),
  setError: (e) => set({ error: e }),
  setUsage: (u) => set({ usage: u }),
  clearMessages: () => set({ messages: [], conversationId: null, error: null }),
}));
