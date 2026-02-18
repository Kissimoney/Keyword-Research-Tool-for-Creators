"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { usePathname } from 'next/navigation';
import { BarChart3, Database, User } from 'lucide-react';
import { useCreditStore } from '@/store/creditStore';
import { useMounted } from '@/hooks/use-mounted';
import { supabase } from '@/lib/supabase';


export default function Navbar() {
    const pathname = usePathname();
    const credits = useCreditStore((state) => state.credits);
    const mounted = useMounted();

    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        // Initial check
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
        });

        return () => subscription.unsubscribe();
    }, []);

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

                <div className="flex items-center gap-6">
                    <Link href="/pricing" className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-full flex items-center gap-2 group hover:bg-primary/20 transition-all">
                        <Database className="text-primary size-4 group-hover:animate-pulse" />
                        <span className="text-xs font-black text-primary uppercase tracking-[0.15em]">
                            {mounted ? credits.toLocaleString() : '---'} <span className="hidden sm:inline">Credits</span>
                        </span>
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

