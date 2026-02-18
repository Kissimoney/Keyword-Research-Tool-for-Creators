import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CreditState {
    credits: number;
    useCredits: (amount: number) => boolean;
    addCredits: (amount: number) => void;
    resetCredits: () => void;
}

export const useCreditStore = create<CreditState>()(
    persist(
        (set, get) => ({
            credits: 30, // Default free limit
            useCredits: (amount) => {
                const current = get().credits;
                if (current >= amount) {
                    set({ credits: current - amount });
                    return true;
                }
                return false;
            },
            addCredits: (amount) => set((state) => ({ credits: state.credits + amount })),
            resetCredits: () => set({ credits: 30 }),
        }),
        {
            name: 'keyword-tool-credits',
        }
    )
);
