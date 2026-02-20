import { create } from 'zustand';
import { KeywordResult } from './searchStore';
import { supabase } from '@/lib/supabase';

export interface ContentProject {
    id: string;
    keyword: string;
    brief: string | null;
    draft: string | null;
    format: string;
    status: 'draft' | 'outlining' | 'published' | 'archived';
    created_at: string;
    updated_at?: string;
}

interface ProjectState {
    savedKeywords: KeywordResult[];
    contentProjects: ContentProject[];
    isLoading: boolean;
    fetchKeywords: () => Promise<void>;
    saveKeyword: (keyword: KeywordResult) => Promise<void>;
    removeKeyword: (keywordString: string) => Promise<void>;

    // Content Project Actions
    fetchProjects: () => Promise<void>;
    updateProject: (id: string, updates: Partial<ContentProject>) => Promise<void>;
    removeProject: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
    savedKeywords: [],
    contentProjects: [],
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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('saved_keywords').insert([{
            keyword: keyword.keyword,
            search_volume: keyword.searchVolume,
            competition_score: keyword.competitionScore,
            cpc_value: keyword.cpcValue,
            intent_type: keyword.intentType,
            trend_direction: keyword.trendDirection,
            strategy: keyword.strategy,
            cluster: keyword.cluster,
            user_id: user.id
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

    fetchProjects: async () => {
        set({ isLoading: true });
        const { data, error } = await supabase
            .from('content_projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) {
            set({ contentProjects: data });
        }
        set({ isLoading: false });
    },

    updateProject: async (id, updates) => {
        const { error } = await supabase
            .from('content_projects')
            .update(updates)
            .eq('id', id);

        if (!error) {
            set((state) => ({
                contentProjects: state.contentProjects.map(p =>
                    p.id === id ? { ...p, ...updates } : p
                )
            }));
        }
    },

    removeProject: async (id) => {
        const { error } = await supabase
            .from('content_projects')
            .delete()
            .eq('id', id);

        if (!error) {
            set((state) => ({
                contentProjects: state.contentProjects.filter(p => p.id !== id)
            }));
        }
    }
}));
