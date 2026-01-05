import { create } from 'zustand';

interface UIState {
    isAIChatOpen: boolean;
    toggleAIChat: () => void;
    openAIChat: () => void;
    closeAIChat: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    isAIChatOpen: false,
    toggleAIChat: () => set((state) => ({ isAIChatOpen: !state.isAIChatOpen })),
    openAIChat: () => set({ isAIChatOpen: true }),
    closeAIChat: () => set({ isAIChatOpen: false }),
}));
