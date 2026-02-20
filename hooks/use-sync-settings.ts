import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useSearchStore } from '@/store/searchStore';

export function useSyncSettings() {
    const { language, setLanguage, isLiveMode, setIsLiveMode } = useSearchStore();
    const syncedRef = useRef(false);

    // Initial load: Fetch settings from profiles
    useEffect(() => {
        if (syncedRef.current) return;

        const loadSettings = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('preferred_language')
                .eq('id', user.id)
                .single();

            if (data?.preferred_language) {
                setLanguage(data.preferred_language);
            }
            syncedRef.current = true;
        };

        loadSettings();
    }, [setLanguage]);

    // Update cloud whenever language changes
    useEffect(() => {
        if (!syncedRef.current) return;

        const persistSettings = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase
                .from('profiles')
                .update({
                    preferred_language: language,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);
        };

        persistSettings();
    }, [language]);

    return null;
}
