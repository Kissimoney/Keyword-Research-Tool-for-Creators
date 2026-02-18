"use client";

import { useProjectStore } from '@/store/projectStore';
import { Trash2, ExternalLink, Database, Search, Download, TrendingUp, TrendingDown, Minus, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { useMounted } from '@/hooks/use-mounted';
import { useSearchStore, KeywordResult } from '@/store/searchStore';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/Toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type SortKey = 'searchVolume' | 'competitionScore' | 'cpcValue' | 'keyword';
type SortDir = 'asc' | 'desc';
type IntentFilter = 'All' | 'Informational' | 'Commercial' | 'Transactional' | 'Navigational' | 'Viral' | 'Entertainment';

function DifficultyBadge({ score }: { score: number }) {
    if (score > 70) return (
        <span className="inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider">
            <span className="size-1.5 rounded-full bg-red-400 inline-block" />Hard · {score}
        </span>
    );
    if (score > 30) return (
        <span className="inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
            <span className="size-1.5 rounded-full bg-amber-400 inline-block" />Medium · {score}
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
            <span className="size-1.5 rounded-full bg-emerald-400 inline-block" />Easy · {score}
        </span>
    );
}

function TrendIcon({ dir }: { dir: string }) {
    if (dir === 'up') return <TrendingUp size={14} className="text-emerald-400" />;
    if (dir === 'down') return <TrendingDown size={14} className="text-red-400" />;
    return <Minus size={14} className="text-slate-500" />;
}

const INTENT_COLORS: Record<string, string> = {
    Commercial: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Transactional: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Viral: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    Entertainment: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    Navigational: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    Informational: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'searchVolume', label: 'Volume' },
    { key: 'competitionScore', label: 'Difficulty' },
    { key: 'cpcValue', label: 'CPC' },
    { key: 'keyword', label: 'A–Z' },
];

const INTENT_FILTERS: IntentFilter[] = ['All', 'Commercial', 'Transactional', 'Informational', 'Viral', 'Entertainment', 'Navigational'];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
    const { savedKeywords, removeKeyword, fetchKeywords, isLoading } = useProjectStore();
    const { setQuery } = useSearchStore();
    const { success } = useToast();
    const mounted = useMounted();
    const router = useRouter();

    const [sortKey, setSortKey] = useState<SortKey>('searchVolume');
    const [sortDir, setSortDir] = useState<SortDir>('desc');
    const [intentFilter, setIntentFilter] = useState<IntentFilter>('All');

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
        success(`${savedKeywords.length} keywords exported!`);
    };

    const handleRemove = async (keyword: string) => {
        await removeKeyword(keyword);
        success(`"${keyword}" removed from projects.`);
    };

    const handleViewDetails = (keyword: string) => {
        setQuery(keyword);
        router.push('/dashboard');
    };

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('desc');
        }
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

    const filteredAndSorted = useMemo(() => {
        let list = intentFilter === 'All'
            ? [...savedKeywords]
            : savedKeywords.filter(k => k.intentType === intentFilter);

        list.sort((a, b) => {
            const av = a[sortKey] as any;
            const bv = b[sortKey] as any;
            if (typeof av === 'string') {
                return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
            }
            return sortDir === 'asc' ? av - bv : bv - av;
        });
        return list;
    }, [savedKeywords, sortKey, sortDir, intentFilter]);

    if (!mounted) return null;

    return (
        <div className="min-h-screen px-4 pt-6 sm:pt-12 pb-32 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight mb-2">My Projects</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">
                        {savedKeywords.length} Saved Keyword{savedKeywords.length !== 1 ? 's' : ''} & Strategies
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportAll}
                        disabled={savedKeywords.length === 0}
                        className="px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-slate-300 font-bold hover:bg-white/10 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                    >
                        <Download size={15} />
                        Export All
                    </button>
                    <Link href="/dashboard" className="px-5 py-3 bg-primary text-white rounded-2xl font-black hover:brightness-110 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 text-sm">
                        <Search size={16} />
                        Find More
                    </Link>
                </div>
            </div>

            {savedKeywords.length > 0 && (
                <div className="mb-6 space-y-3">
                    {/* Intent filter chips */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest shrink-0">Filter:</span>
                        {INTENT_FILTERS.map(f => (
                            <button
                                key={f}
                                onClick={() => setIntentFilter(f)}
                                className={cn(
                                    'text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wider transition-all border',
                                    intentFilter === f
                                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                        : 'bg-white/5 text-slate-500 border-white/5 hover:border-white/10 hover:text-slate-300'
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* Sort bar */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest shrink-0 flex items-center gap-1">
                            <ArrowUpDown size={10} /> Sort:
                        </span>
                        {SORT_OPTIONS.map(opt => (
                            <button
                                key={opt.key}
                                onClick={() => toggleSort(opt.key)}
                                className={cn(
                                    'text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wider transition-all border flex items-center gap-1',
                                    sortKey === opt.key
                                        ? 'bg-white/10 text-white border-white/20'
                                        : 'bg-white/3 text-slate-600 border-white/5 hover:text-slate-400'
                                )}
                            >
                                {opt.label}
                                {sortKey === opt.key && (
                                    <span className="text-primary">{sortDir === 'desc' ? '↓' : '↑'}</span>
                                )}
                            </button>
                        ))}
                        {intentFilter !== 'All' && (
                            <span className="text-[10px] text-slate-500 ml-2">
                                Showing {filteredAndSorted.length} of {savedKeywords.length}
                            </span>
                        )}
                    </div>
                </div>
            )}

            <AnimatePresence mode="popLayout">
                {filteredAndSorted.length > 0 ? (
                    <motion.div
                        layout
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                    >
                        {filteredAndSorted.map((kw, idx) => (
                            <motion.div
                                layout
                                key={kw.keyword}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.04 }}
                                className="bg-surface-dark border border-white/5 p-6 rounded-[28px] hover:border-primary/30 transition-all group relative overflow-hidden"
                            >
                                {/* Subtle glow on hover */}
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity" />

                                {/* Delete button */}
                                <div className="absolute top-0 right-0 p-4 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <button
                                        onClick={() => handleRemove(kw.keyword)}
                                        className="text-slate-600 hover:text-red-400 transition-colors p-1"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="flex flex-col h-full gap-4">
                                    {/* Keyword name */}
                                    <h3 className="text-base font-black text-white pr-8 leading-snug tracking-tight group-hover:text-primary transition-colors">
                                        {kw.keyword}
                                    </h3>

                                    {/* Stats grid */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="bg-white/5 p-3 rounded-2xl flex flex-col gap-0.5">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Volume</p>
                                            <p className="text-sm font-black text-white">{kw.searchVolume.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-white/5 p-3 rounded-2xl flex flex-col gap-0.5">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">CPC</p>
                                            <p className="text-sm font-black text-white">${kw.cpcValue.toFixed(2)}</p>
                                        </div>
                                        <div className="bg-white/5 p-3 rounded-2xl flex flex-col items-center justify-center gap-0.5">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Trend</p>
                                            <TrendIcon dir={kw.trendDirection} />
                                        </div>
                                    </div>

                                    {/* Difficulty badge */}
                                    <DifficultyBadge score={kw.competitionScore} />

                                    {/* Strategy snippet */}
                                    {kw.strategy && (
                                        <p className="text-[11px] text-slate-500 italic font-medium line-clamp-2 leading-relaxed">
                                            {kw.strategy}
                                        </p>
                                    )}

                                    {/* Footer */}
                                    <div className="mt-auto flex items-center justify-between pt-2 border-t border-white/5">
                                        <span className={cn(
                                            'text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border',
                                            INTENT_COLORS[kw.intentType] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                        )}>
                                            {kw.intentType}
                                        </span>
                                        <button
                                            onClick={() => handleViewDetails(kw.keyword)}
                                            className="text-primary font-bold text-xs flex items-center gap-1 hover:underline"
                                        >
                                            Analyze <ExternalLink size={12} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : savedKeywords.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-32 bg-white/3 rounded-[48px] border-2 border-dashed border-white/10"
                    >
                        <div className="bg-primary/10 size-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Database className="text-primary size-10" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">No saved keywords yet</h3>
                        <p className="text-slate-500 mb-10 max-w-sm mx-auto">Start searching and save the most profitable keywords to your projects.</p>
                        <Link href="/dashboard" className="px-10 py-4 bg-primary text-white rounded-2xl font-black hover:brightness-110 transition-all">
                            Go to Research
                        </Link>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20 bg-white/3 rounded-[40px] border border-dashed border-white/10"
                    >
                        <p className="text-slate-500 font-bold mb-4">No keywords match the <span className="text-white">{intentFilter}</span> filter.</p>
                        <button onClick={() => setIntentFilter('All')} className="text-primary font-black text-sm hover:underline">
                            Clear filter
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
