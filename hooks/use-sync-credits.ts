/**
 * useSyncCredits
 *
 * Syncs the local Zustand credit store with the user's Supabase `profiles` row.
 *
 * On mount (when a user is authenticated):
 *   1. Fetches the remote credit balance from profiles.credits
 *   2. Writes it into the local store (source of truth: DB)
 *
 * On spend (debit):
 *   3. Optimistically deducts from local store
 *   4. Persists the new balance back to Supabase
 *
 * Usage: call once near the top of the authenticated layout / dashboard.
 */

import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useCreditStore } from '@/store/creditStore';

export function useSyncCredits() {
    const { setCredits, credits } = useCreditStore();
    const syncedRef = useRef(false);

    // ── Load remote balance on first mount ───────────────────────────────────
    useEffect(() => {
        if (syncedRef.current) return;

        const sync = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Ensure a profile row exists (in case trigger hasn't fired yet)
            const { data, error } = await supabase
                .from('profiles')
                .select('credits, plan')
                .eq('id', user.id)
                .single();

            if (error?.code === 'PGRST116') {
                // Row doesn't exist yet — create it with defaults
                await supabase.from('profiles').insert({
                    id: user.id,
                    credits: 30,
                    plan: 'starter',
                });
                setCredits(30);
            } else if (data) {
                setCredits(data.credits ?? 30);
            }

            syncedRef.current = true;
        };

        sync();
    }, [setCredits]);

    // ── Persist local balance back to DB whenever it changes ─────────────────
    const persistCredits = useCallback(async (newBalance: number) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
            .from('profiles')
            .update({ credits: newBalance, updated_at: new Date().toISOString() })
            .eq('id', user.id);
    }, []);

    return { persistCredits };
}
