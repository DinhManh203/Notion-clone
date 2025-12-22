import { create } from "zustand";

type ChatStore = {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
};

export const useChat = create<ChatStore>((set) => ({
    isOpen: false,
    onOpen: () => set({ isOpen: true }),
    onClose: () => set({ isOpen: false }),
}));
