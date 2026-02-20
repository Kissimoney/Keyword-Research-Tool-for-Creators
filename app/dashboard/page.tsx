"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Search, TrendingUp, DollarSign, ExternalLink, Save, ArrowDown, Database, Check, X, FileText, Sparkles, TrendingDown, Minus, Shield, Globe, Zap, Download, FileJson, FileCode, Copy, Share2, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchStore, KeywordResult, SearchHistoryEntry } from '@/store/searchStore';
import { useCreditStore } from '@/store/creditStore';
import { useProjectStore, ContentProject } from '@/store/projectStore';
import { groupHistoryByTime, GroupedHistory } from '@/lib/historyUtils';
import { cn } from '@/lib/utils';
import { useMounted } from '@/hooks/use-mounted';
import { useSyncCredits } from '@/hooks/use-sync-credits';
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
    const {
        query, setQuery, results, setResults, isLoading, setIsLoading,
        history, addToHistory, language, setLanguage, isLiveMode, setIsLiveMode
    } = useSearchStore();
    const { credits, useCredits } = useCreditStore();
    const { persistCredits } = useSyncCredits();
    const { saveKeyword, savedKeywords, fetchKeywords: fetchSaved } = useProjectStore();
    const { success, error: toastError, info } = useToast();

    const [searchInput, setSearchInput] = useState(query);
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [bulkInput, setBulkInput] = useState('');
    const [bulkProgress, setBulkProgress] = useState(0);
    const [isBatchProcessing, setIsBatchProcessing] = useState(false);
    const [batchStatus, setBatchStatus] = useState('');
    const [selectedKeyword, setSelectedKeyword] = useState<KeywordResult | null>(null);
    const [mode, setMode] = useState<'web' | 'video' | 'competitor'>('web');
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [collapsedClusters, setCollapsedClusters] = useState<Set<string>>(new Set());
    const mounted = useMounted();
    const router = useRouter();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const bulkInputRef = useRef<HTMLTextAreaElement>(null);
    const [recapContent, setRecapContent] = useState<string | null>(null);
    const [isRecapping, setIsRecapping] = useState(false);
    const [refreshingItems, setRefreshingItems] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<'research' | 'workspace'>('research');
    const [workspaceSearch, setWorkspaceSearch] = useState('');
    const [workspaceFilter, setWorkspaceFilter] = useState<'all' | 'draft' | 'outlining' | 'published' | 'archived'>('all');
    const [isSendingToNotion, setIsSendingToNotion] = useState<string | null>(null);
    const { contentProjects, fetchProjects, removeProject, updateProject } = useProjectStore();

    const filteredProjects = useMemo(() => {
        return contentProjects.filter(p => {
            const matchesSearch = p.keyword.toLowerCase().includes(workspaceSearch.toLowerCase());
            const matchesFilter = workspaceFilter === 'all' || p.status === workspaceFilter;
            return matchesSearch && matchesFilter;
        });
    }, [contentProjects, workspaceSearch, workspaceFilter]);

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
                body: JSON.stringify({ keyword: kw, mode: currentMode, language, isLiveMode }),
            });
            const data = await resp.json();

            if (resp.ok) {
                setResults(data);
                const spent = useCredits(1);
                if (spent) persistCredits(credits - 1);
                addToHistory({ query: kw, mode: currentMode, timestamp: Date.now(), resultCount: data.length, results: data });
            } else {
                toastError(`Analysis failed: ${data.error}`);
            }
        } catch (err) {
            console.error(err);
            toastError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [credits, setIsLoading, setResults, useCredits, persistCredits, mode, addToHistory, toastError, language, isLiveMode]);

    const handleSearchSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (isBulkMode) {
            handleBulkSearch();
        } else {
            if (!searchInput.trim()) return;
            setQuery(searchInput);
            fetchKeywords(searchInput);
        }
    };

    const handleBulkSearch = async () => {
        const lines = bulkInput.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length === 0) {
            toastError('Please enter at least one keyword.');
            return;
        }

        if (credits < lines.length) {
            toastError(`Insufficient credits. You need ${lines.length} credits for this batch.`);
            return;
        }

        setIsBatchProcessing(true);
        setBulkProgress(0);
        setBatchStatus(`Starting batch of ${lines.length} keywords…`);
        setResults([]); // Clear results for new batch

        let allResults: KeywordResult[] = [];
        let completed = 0;

        for (const kw of lines) {
            setBatchStatus(`Stitching keyword: "${kw}" (${completed + 1}/${lines.length})`);
            try {
                const resp = await fetch('/api/keywords', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ keyword: kw, mode, language, isLiveMode }),
                });
                const data = await resp.json();

                if (resp.ok) {
                    allResults = [...allResults, ...data];
                    const spent = useCredits(1);
                    if (spent) persistCredits(useCreditStore.getState().credits); // Sync actual state
                    addToHistory({ query: kw, mode, timestamp: Date.now(), resultCount: data.length, results: data });
                } else {
                    console.error(`Failed ${kw}:`, data.error);
                }
            } catch (err) {
                console.error(`Error processing ${kw}:`, err);
            }
            completed++;
            setBulkProgress((completed / lines.length) * 100);
        }

        setResults(allResults);
        setIsBatchProcessing(false);
        setBatchStatus('');
        setBulkProgress(0);
        success(`Batch complete! ${allResults.length} keywords analyzed.`);
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
            if (link.parentNode === document.body) {
                document.body.removeChild(link);
            }
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
            if (link.parentNode === document.body) {
                document.body.removeChild(link);
            }
            URL.revokeObjectURL(url);
            setShowExportMenu(false);
            success('JSON exported successfully!');
        }, 100);
    };

    const handleSendToNotion = async (project: ContentProject) => {
        setIsSendingToNotion(project.id);
        try {
            const res = await fetch('/api/integrations/notion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: project.keyword,
                    brief: project.brief,
                    draft: project.draft,
                    format: project.format
                })
            });
            const data = await res.json();
            if (data.success) {
                success('Sent to Notion! Check your parent page.');
                if (data.url) window.open(data.url, '_blank');
            } else {
                toastError(data.error || 'Failed to send to Notion');
            }
        } catch (err) {
            toastError('Connection error');
        } finally {
            setIsSendingToNotion(null);
        }
    };

    const copyToNotion = () => {
        const text = results.map(r => `| ${r.keyword} | ${r.searchVolume.toLocaleString()} | ${r.competitionScore}% | ${r.intentType} | [View](${window.location.origin}/dashboard?q=${encodeURIComponent(r.keyword)}) |`).join('\n');
        const table = `### 🎯 Keyword Intelligence Report: ${query}\n\n| Keyword | Volume | Difficulty | Intent | Action |\n|---|---|---|---|---|\n${text}\n\n*Generated by **Stitch Creator Intelligence** • ${new Date().toLocaleDateString()}*`;

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
                if (textArea.parentNode === document.body) {
                    document.body.removeChild(textArea);
                }
                success('Markdown table copied!');
                setShowExportMenu(false);
            }
        };
        doCopy(table);
    };

    const handleSessionRecap = async (title: string, items: SearchHistoryEntry[]) => {
        setIsRecapping(true);
        try {
            const keywords = items.map(i => i.query);
            const resp = await fetch('/api/keywords/session-recap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, keywords, isLiveMode }),
            });
            const data = await resp.json();
            if (resp.ok) {
                setRecapContent(data.recap);
            } else {
                toastError('Recap failed: ' + data.error);
            }
        } catch (err) {
            console.error(err);
            toastError('Network error during recap');
        } finally {
            setIsRecapping(false);
        }
    };

    const reScanKeyword = async (h: SearchHistoryEntry) => {
        setRefreshingItems(prev => new Set(prev).add(`${h.query}-${h.timestamp}`));
        try {
            // Re-fetch using the query and mode
            await fetchKeywords(h.query, h.mode);
            success(`Data refreshed for "${h.query}"`);
        } catch (err) {
            toastError('Refresh failed');
        } finally {
            setRefreshingItems(prev => {
                const next = new Set(prev);
                next.delete(`${h.query}-${h.timestamp}`);
                return next;
            });
        }
    };


    const hasFetchedRef = useRef(false);
    useEffect(() => {
        if (mounted && !hasFetchedRef.current && query) {
            hasFetchedRef.current = true;
            if (results.length === 0) fetchKeywords(query);
            fetchSaved();
            fetchProjects();
        }
    }, [mounted, query, results.length, fetchKeywords, fetchSaved, fetchProjects]);

    useEffect(() => {
        if (activeTab === 'workspace') {
            fetchProjects();
        } else {
            fetchSaved();
        }
    }, [activeTab, fetchProjects, fetchSaved]);

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
                        language={language}
                        isLiveMode={isLiveMode}
                    />
                )}
            </AnimatePresence>

            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="max-w-7xl mx-auto px-3 sm:px-4 pt-6 sm:pt-12 pb-4 sm:pb-6"
            >
                <div className="flex flex-col gap-3 bg-surface p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-white/10 shadow-2xl backdrop-blur-xl">
                    {/* Tab Switcher */}
                    <div className="flex items-center gap-1 p-1 bg-black/20 rounded-2xl border border-white/5 w-fit mb-4">
                        <button
                            onClick={() => setActiveTab('research')}
                            className={cn(
                                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                activeTab === 'research' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            Research
                        </button>
                        <button
                            onClick={() => setActiveTab('workspace')}
                            className={cn(
                                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                activeTab === 'workspace' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            Workspace
                        </button>
                    </div>

                    {activeTab === 'research' && (
                        <>
                            {/* Search input row */}
                            <form onSubmit={handleSearchSubmit} className="w-full relative group">
                                {isBulkMode ? (
                                    <FileText className="absolute left-4 sm:left-6 top-6 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                                ) : mode === 'competitor' ? (
                                    <Globe className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-primary animate-pulse" size={18} />
                                ) : (
                                    <Search className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                                )}

                                {isBulkMode ? (
                                    <textarea
                                        ref={bulkInputRef}
                                        className="w-full bg-surface-dark border border-white/5 rounded-2xl pl-12 sm:pl-16 pr-4 sm:pr-6 py-4 text-white placeholder:text-slate-600 font-bold focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm sm:text-base resize-none scrollbar-hide"
                                        placeholder="Paste keywords (one per line)..."
                                        value={bulkInput}
                                        onChange={(e) => setBulkInput(e.target.value)}
                                        disabled={isLoading || isBatchProcessing}
                                        rows={4}
                                    />
                                ) : (
                                    <input
                                        ref={searchInputRef}
                                        className="w-full bg-surface-dark border border-white/5 rounded-2xl pl-12 sm:pl-16 pr-4 sm:pr-6 py-3.5 sm:py-4 text-white placeholder:text-slate-600 font-bold focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm sm:text-base"
                                        placeholder={mode === 'competitor' ? "Competitor domain (e.g. apple.com)" : "Enter keyword or phrase... (⌘K)"}
                                        type="text"
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        disabled={isLoading || isBatchProcessing}
                                    />
                                )}
                            </form>

                            {/* Mode + Analyze row */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
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
                                    onClick={() => setIsBulkMode(!isBulkMode)}
                                    className={cn(
                                        "px-3 sm:px-4 py-2 rounded-lg font-black text-[11px] transition-all flex items-center gap-1.5 whitespace-nowrap border",
                                        isBulkMode
                                            ? "bg-purple-500/10 border-purple-500/30 text-purple-400"
                                            : "bg-surface-dark border-white/5 text-slate-500 hover:text-slate-300"
                                    )}
                                >
                                    <FileText size={13} />
                                    {isBulkMode ? "Bulk Active" : "Bulk Mode"}
                                </button>

                                <div className="relative group">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors z-10" size={13} />
                                    <select
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        className="bg-surface-dark border border-white/5 rounded-lg pl-9 pr-4 py-2 text-[11px] font-black text-slate-300 uppercase tracking-widest outline-none hover:bg-white/10 transition-all cursor-pointer appearance-none"
                                    >
                                        {['English', 'Spanish', 'French', 'German', 'Japanese', 'Chinese', 'Portuguese', 'Italian'].map(lang => (
                                            <option key={lang} value={lang}>{lang}</option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    onClick={() => setIsLiveMode(!isLiveMode)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border shrink-0",
                                        isLiveMode
                                            ? "bg-primary text-white border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] animate-pulse"
                                            : "bg-surface-dark text-slate-500 border-white/5 hover:border-white/20"
                                    )}
                                    title={isLiveMode ? "Live Google Search Enabled" : "Enable Live Search Grounding"}
                                >
                                    <Zap size={13} className={isLiveMode ? "fill-current" : ""} />
                                    {isLiveMode ? "Live" : "Static"}
                                </button>
                            </div>

                            <button
                                onClick={() => handleSearchSubmit()}
                                disabled={isLoading || isBatchProcessing || (!isBulkMode && !searchInput.trim()) || (isBulkMode && !bulkInput.trim())}
                                className="flex-1 py-3 sm:py-4 bg-primary text-white font-black rounded-xl sm:rounded-2xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                            >
                                {isLoading || isBatchProcessing ? (
                                    <>
                                        <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        {isBatchProcessing ? 'Batching...' : mode === 'competitor' ? 'Scanning...' : 'Analyzing...'}
                                    </>
                                ) : (
                                    mode === 'competitor' ? 'Deep Scan' : 'Analyze'
                                )}
                            </button>

                            {/* Progress Bar for Bulk Mode */}
                            <AnimatePresence>
                                {isBatchProcessing && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="mt-2 bg-surface-dark border border-white/5 p-4 rounded-xl shadow-inner">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Sparkles className="text-primary size-3 animate-pulse" />
                                                    <span className="text-[10px] font-bold text-slate-300 tracking-tight italic">{batchStatus}</span>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{Math.round(bulkProgress)}%</span>
                                            </div>
                                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${bulkProgress}%` }}
                                                    className="h-full bg-gradient-to-r from-primary to-purple-500"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </>
                    )}
                </div>
            </motion.div >

            {activeTab === 'research' ? (
                <>
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
                                        <div className="space-y-8">
                                            {groupHistoryByTime(history).map((group: GroupedHistory) => (
                                                <div key={group.title} className="space-y-3">
                                                    <div className="flex items-center justify-between px-1">
                                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                                            <div className="size-1 rounded-full bg-primary/40" />
                                                            {group.title}
                                                        </div>
                                                        <button
                                                            onClick={() => handleSessionRecap(group.title, group.items)}
                                                            disabled={isRecapping}
                                                            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20 disabled:opacity-50"
                                                        >
                                                            <Sparkles size={10} />
                                                            {isRecapping ? 'Recapping...' : 'Magic Recap'}
                                                        </button>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {group.items.map((h: SearchHistoryEntry) => (
                                                            <div
                                                                key={`${h.query}-${h.timestamp}`}
                                                                onClick={() => {
                                                                    setSearchInput(h.query);
                                                                    setQuery(h.query);
                                                                    setMode(h.mode);
                                                                    if (h.results && h.results.length > 0) {
                                                                        setResults(h.results);
                                                                    } else {
                                                                        fetchKeywords(h.query, h.mode);
                                                                    }
                                                                }}
                                                                role="button"
                                                                tabIndex={0}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                                        setSearchInput(h.query);
                                                                        setQuery(h.query);
                                                                        setMode(h.mode);
                                                                        if (h.results && h.results.length > 0) {
                                                                            setResults(h.results);
                                                                        } else {
                                                                            fetchKeywords(h.query, h.mode);
                                                                        }
                                                                    }
                                                                }}
                                                                className="w-full flex items-center justify-between px-4 py-3 bg-white/3 border border-white/5 rounded-2xl hover:bg-white/8 hover:border-white/10 transition-all group cursor-pointer"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="size-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5 group-hover:border-primary/30 transition-all">
                                                                        {h.mode === 'video' ? <Zap size={14} className="text-purple-400" /> :
                                                                            h.mode === 'competitor' ? <Database size={14} className="text-primary" /> :
                                                                                <Globe size={14} className="text-slate-400" />}
                                                                    </div>
                                                                    <div className="flex flex-col items-start min-w-0">
                                                                        <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors truncate w-full">{h.query}</span>
                                                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{h.mode}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-[10px] text-slate-600 font-bold">{h.resultCount} kwds</span>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            reScanKeyword(h);
                                                                        }}
                                                                        disabled={refreshingItems.has(`${h.query}-${h.timestamp}`)}
                                                                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-600 hover:text-primary transition-all disabled:opacity-50"
                                                                        title="Refresh data"
                                                                    >
                                                                        <Clock size={14} className={cn(refreshingItems.has(`${h.query}-${h.timestamp}`) && "animate-spin")} />
                                                                    </button>
                                                                    <ChevronRight size={14} className="text-slate-700 group-hover:text-primary transition-colors" />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    </main>

                    <AnimatePresence>
                        {results.length > 0 && activeTab === 'research' && (
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
                    {/* Recap Modal */}
                    <AnimatePresence>
                        {recapContent && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                                onClick={() => setRecapContent(null)}
                            >
                                <motion.div
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.95, opacity: 0 }}
                                    className="w-full max-w-xl bg-[#0a1628] rounded-[32px] border border-white/10 overflow-hidden shadow-2xl"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <div className="p-6 sm:p-8 bg-[#0d1e35] border-b border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                                <Sparkles className="text-primary" size={20} />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black text-white tracking-tight uppercase tracking-widest text-sm">Intelligence Recap</h2>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Macro-Strategic Overview</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setRecapContent(null)}
                                            className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-all"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>

                                    <div className="p-6 sm:p-10 max-h-[60vh] overflow-y-auto">
                                        <div className="prose prose-invert max-w-none">
                                            {recapContent.split('\n').map((line, i) => {
                                                if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-black mb-6 text-white tracking-tight">{line.replace('# ', '')}</h1>;
                                                if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-black mt-8 mb-3 text-primary uppercase tracking-widest">{line.replace('## ', '')}</h2>;
                                                if (line.startsWith('### ')) return <h3 key={i} className="text-md font-bold mt-5 mb-2 text-white">{line.replace('### ', '')}</h3>;
                                                if (line.trim() === '') return <div key={i} className="h-4" />;
                                                return <p key={i} className="text-slate-300 mb-4 leading-relaxed font-medium text-sm">{line}</p>;
                                            })}
                                        </div>
                                    </div>

                                    <div className="p-6 bg-white/2 border-t border-white/5 flex justify-end">
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(recapContent);
                                                success('Recap copied to clipboard!');
                                            }}
                                            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
                                        >
                                            <Copy size={14} />
                                            Copy Recap
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            ) : (
                /* Workspace View */
                <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight uppercase tracking-widest text-sm">Content Workspace</h1>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Manage your persisted drafts & strategies</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative group min-w-[240px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search projects..."
                                    value={workspaceSearch}
                                    onChange={(e) => setWorkspaceSearch(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                                />
                            </div>
                            <select
                                value={workspaceFilter}
                                onChange={(e) => setWorkspaceFilter(e.target.value as any)}
                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-black text-slate-300 uppercase tracking-widest outline-none hover:bg-white/10 transition-all cursor-pointer appearance-none"
                            >
                                <option value="all">All Status</option>
                                <option value="draft">Drafts</option>
                                <option value="outlining">Outlining</option>
                                <option value="published">Published</option>
                                <option value="archived">Archived</option>
                            </select>
                            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl">
                                <Database size={14} className="text-primary" />
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{filteredProjects.length} Projects</span>
                            </div>
                        </div>
                    </div>

                    {filteredProjects.length === 0 ? (
                        <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.01]">
                            <FileText className="mx-auto text-slate-600 mb-4" size={40} />
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No projects found</p>
                            <p className="text-[10px] text-slate-600 mt-2 uppercase tracking-tight">Try adjusting your search or filters</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredProjects.map(p => (
                                <div key={p.id} className="group p-6 rounded-[32px] bg-[#0d1e35] border border-white/5 hover:border-primary/30 transition-all">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="px-2.5 py-1 rounded-lg bg-primary/5 border border-primary/10">
                                            <span className="text-[9px] font-black text-primary uppercase tracking-widest">{p.format}</span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const nextStatus: Record<string, string> = {
                                                    'draft': 'outlining',
                                                    'outlining': 'published',
                                                    'published': 'archived',
                                                    'archived': 'draft'
                                                };
                                                updateProject(p.id, { status: nextStatus[p.status] as any });
                                            }}
                                            className={cn(
                                                "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg transition-all hover:scale-105 active:scale-95",
                                                p.status === 'draft' ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" :
                                                    p.status === 'published' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                                        p.status === 'outlining' ? "bg-primary/10 text-primary border border-primary/20" :
                                                            "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                                            )}
                                        >
                                            {p.status}
                                        </button>
                                    </div>
                                    <h3 className="text-lg font-black text-white mb-2 line-clamp-1">{p.keyword}</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-6">{new Date(p.created_at).toLocaleDateString()}</p>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                // Map the project back to a KeywordResult-like object to use the BriefModal
                                                // This is a bit of a hack but works for now
                                                setSelectedKeyword({
                                                    keyword: p.keyword,
                                                    searchVolume: 0,
                                                    competitionScore: 0,
                                                    cpcValue: 0,
                                                    intentType: 'Informational',
                                                    trendDirection: 'neutral',
                                                    updatedAt: p.created_at,
                                                });
                                            }}
                                            className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white transition-all border border-white/5"
                                        >
                                            View
                                        </button>
                                        <button
                                            onClick={() => handleSendToNotion(p)}
                                            disabled={isSendingToNotion === p.id}
                                            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-primary transition-all border border-white/5 disabled:opacity-50"
                                            title="Send directly to Notion"
                                        >
                                            {isSendingToNotion === p.id ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
                                        </button>
                                        <button
                                            onClick={() => removeProject(p.id)}
                                            className="p-2.5 rounded-xl bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 transition-all border border-rose-500/10"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )
            }
        </div >
    );
}

function KeywordRow({ data, isSaved, onSave, onClick, mode }: { data: KeywordResult; isSaved: boolean; onSave: () => void; onClick: () => void; mode: string }) {
    const [saving, setSaving] = useState(false);
    const difficultyColor = data.competitionScore > 70 ? 'text-red-500' : data.competitionScore > 30 ? 'text-orange-500' : 'text-primary';

    const handleSave = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isSaved) return;
        setSaving(true);
        await onSave();
        setSaving(false);
    };

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

