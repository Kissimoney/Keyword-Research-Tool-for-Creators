import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

export interface SearchHistoryEntry {
    query: string;
    mode: 'web' | 'video' | 'competitor';
    timestamp: number;
    resultCount: number;
    results: KeywordResult[]; // Store results for drill-down
}

interface SearchState {
    query: string;
    results: KeywordResult[];
    isLoading: boolean;
    history: SearchHistoryEntry[];
    filters: {
        platform: string;
        difficulty: string;
        intent: string;
    };
    language: string;
    isLiveMode: boolean; // Added for real-time search grounding
    setQuery: (query: string) => void;
    setResults: (results: KeywordResult[]) => void;
    setIsLoading: (isLoading: boolean) => void;
    setFilter: (key: string, value: string) => void;
    setLanguage: (language: string) => void;
    setIsLiveMode: (isLiveMode: boolean) => void; // Added live mode setter
    addToHistory: (entry: SearchHistoryEntry) => void;
    clearHistory: () => void;
}

export const useSearchStore = create<SearchState>()(
    persist(
        (set) => ({
            query: '',
            results: [],
            isLoading: false,
            history: [],
            filters: {
                platform: 'Google',
                difficulty: 'All',
                intent: 'All',
            },
            language: 'English',
            isLiveMode: false,
            setQuery: (query) => set({ query }),
            setLanguage: (language: string) => set({ language }),
            setIsLiveMode: (isLiveMode: boolean) => set({ isLiveMode }),
            setResults: (results) => set({ results }),
            setIsLoading: (isLoading) => set({ isLoading }),
            setFilter: (key, value) =>
                set((state) => ({
                    filters: { ...state.filters, [key]: value }
                })),
            addToHistory: (entry) =>
                set((state) => {
                    // Deduplicate by query+mode, keep newest, cap at 20 (increased for better drill-down)
                    const filtered = state.history.filter(
                        h => !(h.query === entry.query && h.mode === entry.mode)
                    );
                    return { history: [entry, ...filtered].slice(0, 20) };
                }),
            clearHistory: () => set({ history: [] }),
        }),
        {
            name: 'creatorkeyword-search',
            // Only persist history, last query, and settings
            partialize: (state) => ({
                query: state.query,
                history: state.history,
                language: state.language,
                isLiveMode: state.isLiveMode,
            }),
        }
    )
);
