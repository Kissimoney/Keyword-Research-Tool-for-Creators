"use client";

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { BarChart3, Database, User, AlertTriangle } from 'lucide-react';
import { useCreditStore } from '@/store/creditStore';
import { useMounted } from '@/hooks/use-mounted';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { motion, AnimatePresence } from 'framer-motion';

const LOW_CREDIT_THRESHOLD = 5;

export default function Navbar() {
    const pathname = usePathname();
    const credits = useCreditStore((state) => state.credits);
    const mounted = useMounted();
    const { warning } = useToast();

    const [user, setUser] = useState<any>(null);
    const prevCreditsRef = useRef<number | null>(null);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
        });
        return () => subscription.unsubscribe();
    }, []);

    // Fire a low-credit warning toast when credits drop to/below threshold
    useEffect(() => {
        if (!mounted) return;
        const prev = prevCreditsRef.current;
        if (prev !== null && prev > LOW_CREDIT_THRESHOLD && credits <= LOW_CREDIT_THRESHOLD && credits > 0) {
            warning(`Only ${credits} credit${credits === 1 ? '' : 's'} remaining — upgrade to keep researching!`);
        }
        prevCreditsRef.current = credits;
    }, [credits, mounted, warning]);

    const isLow = mounted && credits <= LOW_CREDIT_THRESHOLD;
    const pct = Math.min(100, (credits / 30) * 100); // 30 = free tier default

    return (
        <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-primary/10 px-4 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="bg-primary p-2.5 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform">
                        <BarChart3 className="text-white size-5" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="font-black text-xl tracking-tighter text-white leading-none">CreatorKeyword</h1>
                        <span className="text-[8px] font-black text-primary uppercase tracking-[0.3em] mt-0.5">Pro</span>
                    </div>
                </Link>

                <div className="flex items-center gap-4">
                    {/* Credit pill */}
                    <Link
                        href="/pricing"
                        className={`relative flex items-center gap-2 px-4 py-2 rounded-full border transition-all group ${isLow
                                ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20'
                                : 'bg-primary/10 border-primary/20 hover:bg-primary/20'
                            }`}
                    >
                        {isLow ? (
                            <AlertTriangle className="text-red-400 size-4 animate-pulse" />
                        ) : (
                            <Database className="text-primary size-4 group-hover:animate-pulse" />
                        )}

                        <div className="flex flex-col items-start">
                            <span className={`text-xs font-black uppercase tracking-[0.15em] leading-none ${isLow ? 'text-red-400' : 'text-primary'}`}>
                                {mounted ? credits.toLocaleString() : '---'}{' '}
                                <span className="hidden sm:inline">Credits</span>
                            </span>
                            {/* Mini progress bar */}
                            {mounted && (
                                <div className="w-12 h-0.5 rounded-full bg-white/10 mt-1 overflow-hidden hidden sm:block">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ duration: 0.6, ease: 'easeOut' }}
                                        className={`h-full rounded-full ${isLow ? 'bg-red-400' : 'bg-primary'}`}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Low credit pulse dot */}
                        <AnimatePresence>
                            {isLow && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    className="absolute -top-1 -right-1 size-3 bg-red-500 rounded-full border-2 border-background"
                                >
                                    <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </Link>

                    {user ? (
                        <Link
                            href="/account"
                            className="size-10 rounded-2xl bg-surface border border-white/10 flex items-center justify-center overflow-hidden hover:border-primary/50 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-black/20"
                        >
                            <User className="text-slate-400 size-6" />
                        </Link>
                    ) : (
                        <Link
                            href="/auth"
                            className="bg-white text-black px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-xl shadow-white/5 active:scale-95"
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
