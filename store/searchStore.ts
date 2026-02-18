import { create } from 'zustand';

export interface KeywordResult {
    keyword: string;
    searchVolume: number;
    competitionScore: number;
    cpcValue: number;
    intentType: 'Informational' | 'Commercial' | 'Transactional' | 'Navigational' | 'Viral' | 'Entertainment';
    trendDirection: 'up' | 'down' | 'neutral';
    updatedAt?: string;
    strategy?: string;
    cluster?: string;
}

interface SearchState {
    query: string;
    results: KeywordResult[];
    isLoading: boolean;
    filters: {
        platform: string;
        difficulty: string;
        intent: string;
    };
    setQuery: (query: string) => void;
    setResults: (results: KeywordResult[]) => void;
    setIsLoading: (isLoading: boolean) => void;
    setFilter: (key: string, value: string) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
    query: '',
    results: [],
    isLoading: false,
    filters: {
        platform: 'Google',
        difficulty: 'All',
        intent: 'All',
    },
    setQuery: (query) => set({ query }),
    setResults: (results) => set({ results }),
    setIsLoading: (isLoading) => set({ isLoading }),
    setFilter: (key, value) =>
        set((state) => ({
            filters: { ...state.filters, [key]: value }
        })),
}));
