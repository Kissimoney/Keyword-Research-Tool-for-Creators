import { create } from 'zustand';
import { KeywordResult } from './searchStore';
import { supabase } from '@/lib/supabase';

interface ProjectState {
    savedKeywords: KeywordResult[];
    isLoading: boolean;
    fetchKeywords: () => Promise<void>;
    saveKeyword: (keyword: KeywordResult) => Promise<void>;
    removeKeyword: (keywordString: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
    savedKeywords: [],
    isLoading: false,
    fetchKeywords: async () => {
        set({ isLoading: true });
        const { data, error } = await supabase
            .from('saved_keywords')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) {
            const results: KeywordResult[] = data.map(item => ({
                keyword: item.keyword,
                searchVolume: item.search_volume,
                competitionScore: item.competition_score,
                cpcValue: Number(item.cpc_value),
                intentType: item.intent_type as any,
                trendDirection: item.trend_direction as any,
                updatedAt: item.created_at,
                strategy: item.strategy,
                cluster: item.cluster
            }));
            set({ savedKeywords: results });
        }
        set({ isLoading: false });
    },
    saveKeyword: async (keyword) => {
        if (get().savedKeywords.some(k => k.keyword === keyword.keyword)) return;

        // Resolve the authenticated user's email for the RLS-scoped insert
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) return;

        const { error } = await supabase.from('saved_keywords').insert([{
            keyword: keyword.keyword,
            search_volume: keyword.searchVolume,
            competition_score: keyword.competitionScore,
            cpc_value: keyword.cpcValue,
            intent_type: keyword.intentType,
            trend_direction: keyword.trendDirection,
            strategy: keyword.strategy,
            cluster: keyword.cluster,
            user_email: user.email,        // ← required by RLS policy
        }]);

        if (!error) {
            set((state) => ({ savedKeywords: [keyword, ...state.savedKeywords] }));
        }
    },
    removeKeyword: async (keywordString) => {
        const { error } = await supabase
            .from('saved_keywords')
            .delete()
            .eq('keyword', keywordString);

        if (!error) {
            set((state) => ({
                savedKeywords: state.savedKeywords.filter(k => k.keyword !== keywordString)
            }));
        }
    },
}));
