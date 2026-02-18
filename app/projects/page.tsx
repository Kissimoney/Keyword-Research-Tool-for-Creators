"use client";

import { useProjectStore } from '@/store/projectStore';
import { Trash2, ExternalLink, Database, Search, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useEffect } from 'react';
import { useMounted } from '@/hooks/use-mounted';
import { useSearchStore } from '@/store/searchStore';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ProjectsPage() {
    const { savedKeywords, removeKeyword, fetchKeywords, isLoading } = useProjectStore();
    const { setQuery } = useSearchStore();
    const mounted = useMounted();
    const router = useRouter();

    const handleExportAll = () => {
        if (savedKeywords.length === 0) return;
        const headers = ["Keyword", "Search Volume", "Competition Score", "CPC", "Intent", "Trend", "Strategy", "Cluster"];
        const rows = savedKeywords.map(r => [
            `"${r.keyword}"`,
            r.searchVolume,
            r.competitionScore,
            r.cpcValue,
            r.intentType,
            r.trendDirection,
            `"${(r.strategy || '').replace(/"/g, '""')}"`,
            `"${(r.cluster || '').replace(/"/g, '""')}"`
        ]);
        const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `creatorkeyword-pro-export.csv`;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(url); }, 100);
    };

    const handleViewDetails = (keyword: string) => {
        setQuery(keyword);
        router.push('/dashboard');
    };

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth');
            } else if (mounted) {
                fetchKeywords();
            }
        };
        checkAuth();
    }, [mounted, fetchKeywords, router]);

    if (!mounted) return null;


    return (
        <div className="min-h-screen px-4 pt-6 sm:pt-12 pb-32 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight mb-2">My Projects</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">Saved Keywords & Strategies</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportAll}
                        disabled={savedKeywords.length === 0}
                        className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-slate-300 font-bold hover:bg-white/10 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Download size={16} />
                        Export All
                    </button>
                    <Link href="/dashboard" className="px-6 py-3 bg-primary text-white rounded-2xl font-black hover:brightness-110 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
                        <Search size={18} />
                        Find More
                    </Link>
                </div>
            </div>

            {savedKeywords.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedKeywords.map((kw) => (
                        <div key={kw.keyword} className="bg-surface-dark border border-white/5 p-6 rounded-[32px] hover:border-primary/30 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => removeKeyword(kw.keyword)}
                                    className="text-slate-600 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="flex flex-col h-full">
                                <h3 className="text-xl font-bold text-white mb-6 pr-8">{kw.keyword}</h3>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-white/5 p-4 rounded-2xl">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Vol</p>
                                        <p className="text-lg font-black text-white">{kw.searchVolume.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Diff</p>
                                        <p className={cn(
                                            "text-lg font-black",
                                            kw.competitionScore > 70 ? "text-red-500" : kw.competitionScore > 30 ? "text-orange-500" : "text-primary"
                                        )}>{kw.competitionScore}</p>
                                    </div>
                                </div>

                                <div className="mt-auto flex items-center justify-between">
                                    <span className={cn(
                                        "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest",
                                        kw.intentType === 'Commercial' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                            kw.intentType === 'Transactional' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    )}>
                                        {kw.intentType}
                                    </span>
                                    <button
                                        onClick={() => handleViewDetails(kw.keyword)}
                                        className="text-primary font-bold text-sm flex items-center gap-1 hover:underline"
                                    >
                                        Analyze <ExternalLink size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-32 bg-white/5 rounded-[48px] border-2 border-dashed border-white/10">
                    <div className="bg-primary/10 size-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Database className="text-primary size-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">No saved keywords yet</h3>
                    <p className="text-slate-500 mb-10 max-w-sm mx-auto">Start searching and save the most profitable keywords to your projects.</p>
                    <Link href="/dashboard" className="px-10 py-4 bg-primary text-white rounded-2xl font-black hover:brightness-110 transition-all">
                        Go to Research
                    </Link>
                </div>
            )}
        </div>
    );
}
