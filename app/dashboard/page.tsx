"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Search, TrendingUp, DollarSign, ExternalLink, Save, ArrowDown, Database, Check, X, FileText, Sparkles, TrendingDown, Minus, Shield, Globe, Zap, Download, FileJson, FileCode, Copy, Share2, Clock, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchStore, KeywordResult } from '@/store/searchStore';
import { useCreditStore } from '@/store/creditStore';
import { useProjectStore } from '@/store/projectStore';
import { cn } from '@/lib/utils';
import { useMounted } from '@/hooks/use-mounted';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import BriefModal from '@/components/BriefModal';
import { useToast } from '@/components/Toast';
import OnboardingModal from '@/components/OnboardingModal';


const SUGGESTED_KEYWORDS = [
    { label: 'AI Side Hustles', mode: 'web' as const },
    { label: 'ChatGPT Prompts', mode: 'web' as const },
    { label: 'Passive Income 2026', mode: 'web' as const },
    { label: 'YouTube Automation', mode: 'video' as const },
    { label: 'Faceless YouTube Channel', mode: 'video' as const },
    { label: 'Digital Products to Sell', mode: 'web' as const },
];

export default function Dashboard() {
    const { query, setQuery, results, setResults, isLoading, setIsLoading, history, addToHistory } = useSearchStore();
    const { credits, useCredits } = useCreditStore();
    const { saveKeyword, savedKeywords, fetchKeywords: fetchSaved } = useProjectStore();
    const { success, error: toastError, info } = useToast();

    const [searchInput, setSearchInput] = useState(query);
    const [selectedKeyword, setSelectedKeyword] = useState<KeywordResult | null>(null);
    const [mode, setMode] = useState<'web' | 'video' | 'competitor'>('web');
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [collapsedClusters, setCollapsedClusters] = useState<Set<string>>(new Set());
    const mounted = useMounted();
    const router = useRouter();
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth');
            }
        };
        checkAuth();
    }, [router]);

    // Global Cmd/Ctrl+K shortcut to focus search
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
                searchInputRef.current?.select();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const fetchKeywords = useCallback(async (kw: string, currentMode = mode) => {
        if (!kw) return;
        if (credits <= 0) {
            toastError('No credits remaining. Please upgrade your plan.');
            return;
        }

        setIsLoading(true);
        try {
            const resp = await fetch('/api/keywords', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyword: kw, mode: currentMode }),
            });
            const data = await resp.json();

            if (resp.ok) {
                setResults(data);
                useCredits(1);
                addToHistory({ query: kw, mode: currentMode, timestamp: Date.now(), resultCount: data.length });
            } else {
                toastError(`Analysis failed: ${data.error}`);
            }
        } catch (err) {
            console.error(err);
            toastError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [credits, setIsLoading, setResults, useCredits, mode, addToHistory, toastError]);

    const handleSearchSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!searchInput.trim()) return;
        setQuery(searchInput);
        fetchKeywords(searchInput);
    };

    const handleSaveAll = async () => {
        setIsLoading(true);
        try {
            for (const item of results) {
                await saveKeyword(item);
            }
            success(`${results.length} keywords synced to your projects!`);
        } catch (err) {
            console.error(err);
            toastError('Failed to save keywords. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const downloadCSV = () => {
        const headers = ["Keyword", "Search Volume", "Competition Score", "CPC", "Intent", "Trend", "Strategy", "Cluster"];
        const rows = results.map(r => [
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
        link.style.display = 'none';
        link.href = url;
        link.download = `creatorkeyword-pro-${query || 'research'}.csv`;
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            setShowExportMenu(false);
            success('CSV exported successfully!');
        }, 100);
    };

    const downloadJSON = () => {
        const dataStr = JSON.stringify(results, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.style.display = 'none';
        link.href = url;
        link.download = `creatorkeyword-pro-${query || 'research'}.json`;
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            setShowExportMenu(false);
            success('JSON exported successfully!');
        }, 100);
    };

    const copyToNotion = () => {
        const text = results.map(r => `| ${r.keyword} | ${r.searchVolume} | ${r.competitionScore}% | ${r.intentType} |`).join('\n');
        const table = `### Keyword Intelligence: ${query}\n\n| Keyword | Volume | Difficulty | Intent |\n|---|---|---|---|\n${text}\n\n*Generated by CreatorKeyword Pro Export Engine*`;

        const doCopy = (str: string) => {
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(str).then(() => {
                    success('Markdown table copied — ready to paste into Notion!');
                    setShowExportMenu(false);
                });
            } else {
                const textArea = document.createElement('textarea');
                textArea.value = str;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                success('Markdown table copied!');
                setShowExportMenu(false);
            }
        };
        doCopy(table);
    };


    const hasFetchedRef = useRef(false);
    useEffect(() => {
        if (mounted && !hasFetchedRef.current && query) {
            hasFetchedRef.current = true;
            if (results.length === 0) fetchKeywords(query);
            fetchSaved();
        }
    }, [mounted, query, results.length, fetchKeywords, fetchSaved]);

    const groupedResults = useMemo(() => {
        const groups: Record<string, KeywordResult[]> = {};
        results.forEach(item => {
            const cluster = item.cluster || 'General Intelligence';
            if (!groups[cluster]) groups[cluster] = [];
            groups[cluster].push(item);
        });
        return groups;
    }, [results]);

    const toggleCluster = (cluster: string) => {
        setCollapsedClusters(prev => {
            const next = new Set(prev);
            if (next.has(cluster)) next.delete(cluster);
            else next.add(cluster);
            return next;
        });
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen pb-40 md:pb-32">
            <OnboardingModal />

            <AnimatePresence mode="wait">
                {selectedKeyword && (
                    <BriefModal
                        key="brief-modal"
                        keyword={selectedKeyword}
                        onClose={() => setSelectedKeyword(null)}
                    />
                )}
            </AnimatePresence>

            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="max-w-7xl mx-auto px-3 sm:px-4 pt-6 sm:pt-12 pb-4 sm:pb-6"
            >
                <div className="flex flex-col gap-3 bg-surface p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-white/10 shadow-2xl backdrop-blur-xl">
                    {/* Search input row */}
                    <form onSubmit={handleSearchSubmit} className="w-full relative group">
                        {mode === 'competitor' ?
                            <Globe className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-primary animate-pulse" size={18} /> :
                            <Search className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                        }
                        <input
                            ref={searchInputRef}
                            className="w-full bg-surface-dark border border-white/5 rounded-2xl pl-12 sm:pl-16 pr-4 sm:pr-6 py-3.5 sm:py-4 text-white placeholder:text-slate-600 font-bold focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm sm:text-base"
                            placeholder={mode === 'competitor' ? "Competitor domain (e.g. apple.com)" : "Enter keyword or phrase... (⌘K)"}
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                    </form>

                    {/* Mode + Analyze row */}
                    <div className="flex items-center gap-3">
                        <div className="flex p-1 bg-surface-dark border border-white/5 rounded-xl overflow-x-auto shrink-0 gap-0.5">
                            {[
                                { id: 'web', label: 'Web', icon: <Database size={13} /> },
                                { id: 'video', label: 'Video', icon: <Sparkles size={13} /> },
                                { id: 'competitor', label: 'Pulse', icon: <Zap size={13} /> }
                            ].map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => setMode(m.id as any)}
                                    className={cn(
                                        "px-3 sm:px-5 py-2 rounded-lg font-black text-[11px] transition-all flex items-center gap-1.5 whitespace-nowrap",
                                        mode === m.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:text-slate-300"
                                    )}
                                >
                                    {m.icon}
                                    {m.label}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => handleSearchSubmit()}
                            disabled={isLoading}
                            className="flex-1 py-3 sm:py-4 bg-primary text-white font-black rounded-xl sm:rounded-2xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                        >
                            {isLoading ? (
                                <>
                                    <Sparkles className="animate-pulse size-4" />
                                    {mode === 'competitor' ? 'Scanning...' : 'Analyzing...'}
                                </>
                            ) : (
                                mode === 'competitor' ? 'Deep Scan' : 'Analyze'
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>

            <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
                {/* Competitor DNA header card */}
                {mode === 'competitor' && results.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-5 bg-primary/5 border border-primary/20 rounded-3xl flex flex-col sm:flex-row sm:items-center gap-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="size-12 bg-primary/15 rounded-2xl flex items-center justify-center shrink-0">
                                <Shield className="text-primary size-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-0.5">Competitor Pulse Active</p>
                                <p className="text-white font-black text-base tracking-tight">{query}</p>
                            </div>
                        </div>
                        <div className="sm:ml-auto flex gap-4">
                            <div className="text-center">
                                <p className="text-xl font-black text-white">{results.length}</p>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Keywords Found</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-black text-emerald-400">{results.filter(r => r.trendDirection === 'up').length}</p>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Opportunities</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-black text-red-400">{results.filter(r => r.competitionScore > 70).length}</p>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">High Threat</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }} className="hidden md:grid grid-cols-12 gap-4 px-8 py-4 border border-white/5 rounded-t-3xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">
                    <div className="col-span-4 text-left">Keyword Insight</div>
                    <div className="col-span-2 text-center">Potential</div>
                    <div className="col-span-2 text-center">Difficulty</div>
                    <div className="col-span-1 text-center">CPC</div>
                    <div className="col-span-1 text-center">Intent</div>
                    <div className="col-span-2 text-right">Momentum</div>
                </div>

                <div className="space-y-6">
                    {results.length > 0 ? (
                        Object.entries(groupedResults).map(([cluster, clusterItems], clusterIdx) => {
                            const isCollapsed = collapsedClusters.has(cluster);
                            const avgDiff = Math.round(clusterItems.reduce((s, i) => s + i.competitionScore, 0) / clusterItems.length);
                            const totalVol = clusterItems.reduce((s, i) => s + i.searchVolume, 0);
                            return (
                                <motion.div
                                    key={cluster}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: clusterIdx * 0.08 }}
                                >
                                    {/* Cluster accordion header */}
                                    <button
                                        onClick={() => toggleCluster(cluster)}
                                        className="w-full flex items-center gap-3 mb-3 px-4 group"
                                    >
                                        <motion.span
                                            animate={{ rotate: isCollapsed ? -90 : 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="text-primary/60 group-hover:text-primary transition-colors shrink-0"
                                        >
                                            <ChevronRight size={14} />
                                        </motion.span>
                                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] whitespace-nowrap group-hover:text-primary/80 transition-colors">{cluster}</span>
                                        <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-[9px] font-black text-slate-600">{clusterItems.length} kw</span>
                                            <span className="text-[9px] font-black text-slate-600">{(totalVol / 1000).toFixed(0)}K vol</span>
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${avgDiff > 70 ? 'bg-red-500/10 text-red-400' :
                                                avgDiff > 30 ? 'bg-amber-500/10 text-amber-400' :
                                                    'bg-emerald-500/10 text-emerald-400'
                                                }`}>avg {avgDiff}</span>
                                        </div>
                                    </button>

                                    <AnimatePresence initial={false}>
                                        {!isCollapsed && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                                                className="overflow-hidden"
                                            >
                                                <div className="space-y-1 md:space-y-0 overflow-hidden rounded-3xl border border-white/5">
                                                    {clusterItems.map((item) => (
                                                        <KeywordRow
                                                            key={item.keyword}
                                                            data={item}
                                                            isSaved={savedKeywords.some(k => k.keyword === item.keyword)}
                                                            onSave={() => saveKeyword(item)}
                                                            onClick={() => setSelectedKeyword(item)}
                                                            mode={mode}
                                                        />
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            {/* Hero empty state */}
                            <div
                                style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                                className="text-center py-16 rounded-[40px] border border-dashed border-white/10"
                            >
                                <div className="bg-primary/20 size-20 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-12 shadow-2xl shadow-primary/10">
                                    {mode === 'competitor' ? <Shield className="text-primary size-10" /> : <Sparkles className="text-primary size-10" />}
                                </div>
                                <h3 className="text-2xl font-black text-white mb-3 tracking-tight">
                                    {mode === 'competitor' ? 'Perform Competitive Pulse' : 'Ready for Alpha?'}
                                </h3>
                                <p className="text-slate-500 max-w-sm mx-auto font-medium text-sm px-4">
                                    {mode === 'competitor'
                                        ? 'Enter a competitor URL to reveal hidden keyword opportunities they are actively ranking for.'
                                        : 'Enter a keyword below or pick a suggestion to generate market-leading intelligence.'}
                                </p>
                            </div>

                            {/* Suggested starter keywords */}
                            {mode !== 'competitor' && (
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 px-1">🔥 Trending Starters</p>
                                    <div className="flex flex-wrap gap-2">
                                        {SUGGESTED_KEYWORDS.map((s) => (
                                            <button
                                                key={s.label}
                                                onClick={() => {
                                                    setSearchInput(s.label);
                                                    setQuery(s.label);
                                                    setMode(s.mode);
                                                    fetchKeywords(s.label, s.mode);
                                                }}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-slate-300 hover:bg-primary/10 hover:border-primary/30 hover:text-white transition-all"
                                            >
                                                <ChevronRight size={12} className="text-primary" />
                                                {s.label}
                                                {s.mode === 'video' && <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Video</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recent search history */}
                            {history.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 px-1 flex items-center gap-2">
                                        <Clock size={11} /> Recent Searches
                                    </p>
                                    <div className="space-y-1">
                                        {history.slice(0, 5).map((h) => (
                                            <button
                                                key={`${h.query}-${h.timestamp}`}
                                                onClick={() => {
                                                    setSearchInput(h.query);
                                                    setQuery(h.query);
                                                    setMode(h.mode);
                                                    fetchKeywords(h.query, h.mode);
                                                }}
                                                className="w-full flex items-center justify-between px-4 py-3 bg-white/3 border border-white/5 rounded-2xl hover:bg-white/8 hover:border-white/10 transition-all group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Clock size={13} className="text-slate-600 shrink-0" />
                                                    <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{h.query}</span>
                                                    <span className={cn(
                                                        'text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider',
                                                        h.mode === 'video' ? 'bg-purple-500/10 text-purple-400' :
                                                            h.mode === 'competitor' ? 'bg-primary/10 text-primary' :
                                                                'bg-slate-500/10 text-slate-500'
                                                    )}>{h.mode}</span>
                                                </div>
                                                <span className="text-[10px] text-slate-600 font-bold">{h.resultCount} results</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            </main>

            <AnimatePresence>
                {results.length > 0 && (
                    <motion.div
                        key="action-bar"
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-20 md:bottom-8 left-0 right-0 p-3 sm:p-4 z-40"
                    >
                        <div className="max-w-3xl mx-auto flex items-center gap-2 sm:gap-4 p-2 sm:p-3 bg-surface border border-white/10 rounded-[24px] sm:rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl ring-1 ring-white/10">
                            <div className="hidden sm:flex -space-x-2 pl-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="size-8 rounded-full border-2 border-surface bg-slate-800 ring-1 ring-primary/20 overflow-hidden">
                                        <img src={`https://i.pravatar.cc/100?u=${i + 20}`} alt="user" />
                                    </div>
                                ))}
                            </div>
                            <div className="hidden sm:block h-8 w-px bg-white/10 mx-2"></div>

                            <div className="relative">
                                <button
                                    onClick={() => setShowExportMenu(!showExportMenu)}
                                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-3 sm:py-3.5 text-slate-300 rounded-xl sm:rounded-2xl font-black text-[10px] hover:bg-white/10 transition-all border border-white/5 uppercase tracking-[0.15em] sm:tracking-[0.2em]"
                                >
                                    <Download size={15} className="text-primary" />
                                    Export
                                </button>

                                <AnimatePresence>
                                    {showExportMenu && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: -10, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute bottom-full left-0 mb-4 w-56 bg-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
                                        >
                                            <div className="p-2 space-y-1">
                                                <button onClick={downloadCSV} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-300 hover:bg-white/5 rounded-xl transition-colors">
                                                    <FileCode size={18} className="text-emerald-400" />
                                                    Download CSV
                                                </button>
                                                <button onClick={downloadJSON} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-300 hover:bg-white/5 rounded-xl transition-colors">
                                                    <FileJson size={18} className="text-blue-400" />
                                                    Download JSON
                                                </button>
                                                <div className="h-px bg-white/5 my-1 mx-2"></div>
                                                <button onClick={copyToNotion} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-300 hover:bg-white/5 rounded-xl transition-colors">
                                                    <Database size={18} className="text-primary" />
                                                    Push to Notion
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <button
                                onClick={handleSaveAll}
                                disabled={isLoading}
                                className="flex-1 flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 bg-primary text-white rounded-xl sm:rounded-2xl font-black hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-primary/20 group uppercase text-[10px] sm:text-xs tracking-widest"
                            >
                                <Save size={16} className="group-hover:rotate-12 transition-transform shrink-0" />
                                <span className="whitespace-nowrap">Save All</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function KeywordRow({ data, isSaved, onSave, onClick, mode }: { data: KeywordResult, isSaved: boolean, onSave: () => void, onClick: () => void, mode: string }) {
    const [saving, setSaving] = useState(false);
    const difficultyColor = data.competitionScore > 70 ? 'text-red-500' : data.competitionScore > 30 ? 'text-orange-500' : 'text-primary';
    const difficultyBg = data.competitionScore > 70 ? 'bg-red-500' : data.competitionScore > 30 ? 'bg-orange-500' : 'bg-primary';

    const handleSave = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isSaved) return;
        setSaving(true);
        await onSave();
        setSaving(false);
    };

    // Deterministic sparkline path seeded from the keyword string
    const sparklinePath = useMemo(() => {
        let seed = data.keyword.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const rand = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff; };
        const points = Array.from({ length: 8 }, (_, i) => ({
            x: i * 14.2,
            y: 20 + (Math.sin(i * 0.8) * 12) + (rand() * 8 - 4)
        }));
        return `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    }, [data.keyword]);

    return (
        <motion.div
            initial={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            whileHover={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
            onClick={onClick}
            className="group border-b border-white/5 cursor-pointer last:border-b-0 transition-all"
        >
            {/* Mobile card layout */}
            <div className="md:hidden p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <span className="font-bold text-white group-hover:text-primary transition-colors text-base tracking-tight block truncate">
                            {data.keyword}
                        </span>
                        {data.strategy && <span className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 italic font-medium block">{data.strategy}</span>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className={cn(
                            "text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border",
                            data.intentType === 'Commercial' || data.intentType === 'Viral' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                data.intentType === 'Transactional' || data.intentType === 'Entertainment' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        )}>
                            {data.intentType}
                        </span>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={cn("p-1.5 rounded-lg bg-white/5 transition-colors", isSaved ? "text-primary" : "text-slate-500")}
                        >
                            {isSaved ? <Check size={13} /> : <Save size={13} />}
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white/5 rounded-xl p-2.5 flex flex-col gap-0.5">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Volume</span>
                        <span className="font-black text-white text-sm">{data.searchVolume.toLocaleString()}</span>
                    </div>
                    <div className="bg-white/5 rounded-xl p-2.5 flex flex-col gap-0.5">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Diff</span>
                        <span className={cn("font-black text-sm", difficultyColor)}>{data.competitionScore}</span>
                    </div>
                    <div className="bg-white/5 rounded-xl p-2.5 flex flex-col gap-0.5">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">CPC</span>
                        <span className="font-bold text-slate-300 text-sm">${data.cpcValue.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Desktop table row layout */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-6 items-center">
                <div className="col-span-4 flex flex-col">
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-white group-hover:text-primary transition-colors text-base tracking-tight">
                            {data.keyword}
                        </span>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className={cn("p-1.5 rounded-lg hover:bg-white/10 transition-colors", isSaved ? "text-primary" : "text-slate-600", saving && "animate-spin")}
                            >
                                {isSaved ? <Check size={14} /> : <Save size={14} />}
                            </button>
                            <FileText size={14} className="text-slate-600 hover:text-primary transition-colors" />
                        </div>
                        {mode === 'competitor' && (
                            <span className="text-[8px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20 uppercase tracking-tighter">
                                Gap Data
                            </span>
                        )}
                    </div>
                    {data.strategy && <span className="text-[10px] text-slate-500 mt-1 line-clamp-1 italic font-medium">{data.strategy}</span>}
                </div>

                <div className="col-span-2 flex justify-center">
                    <span className="font-black text-slate-200 text-sm">{data.searchVolume.toLocaleString()}</span>
                </div>

                <div className="col-span-2 flex justify-center">
                    {data.competitionScore > 70 ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider whitespace-nowrap">
                            <span className="size-1.5 rounded-full bg-red-400 inline-block" />Hard · {data.competitionScore}
                        </span>
                    ) : data.competitionScore > 30 ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider whitespace-nowrap">
                            <span className="size-1.5 rounded-full bg-amber-400 inline-block" />Medium · {data.competitionScore}
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider whitespace-nowrap">
                            <span className="size-1.5 rounded-full bg-emerald-400 inline-block" />Easy · {data.competitionScore}
                        </span>
                    )}
                </div>

                <div className="col-span-1 flex justify-center">
                    <span className="font-bold text-slate-400 text-sm">${data.cpcValue.toFixed(2)}</span>
                </div>

                <div className="col-span-1 flex justify-center">
                    <span className={cn(
                        "text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border",
                        data.intentType === 'Commercial' || data.intentType === 'Viral' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            data.intentType === 'Transactional' || data.intentType === 'Entertainment' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    )}>
                        {data.intentType}
                    </span>
                </div>

                <div className="col-span-2 flex justify-end">
                    <div className="h-10 w-24 relative overflow-hidden">
                        <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
                            <motion.path
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                d={sparklinePath}
                                fill="none"
                                stroke={data.trendDirection === 'up' ? "#00B140" : data.trendDirection === 'down' ? "#ef4444" : "#64748b"}
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

