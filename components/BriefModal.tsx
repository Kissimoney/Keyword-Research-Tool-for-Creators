"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Sparkles } from 'lucide-react';
import { KeywordResult } from '@/store/searchStore';

interface Section {
    emoji: string;
    title: string;
    bullets: { label: string; detail: string }[];
    color: {
        accent: string;
        icon_bg: string;
        dot: string;
    };
}

const SECTION_COLORS = [
    { accent: 'from-emerald-500/60 to-primary/40', icon_bg: 'bg-primary/10 border-primary/20', dot: 'bg-primary' },
    { accent: 'from-blue-500/60 to-cyan-400/40', icon_bg: 'bg-blue-500/10 border-blue-500/20', dot: 'bg-blue-400' },
    { accent: 'from-violet-500/60 to-purple-400/40', icon_bg: 'bg-violet-500/10 border-violet-500/20', dot: 'bg-violet-400' },
    { accent: 'from-amber-500/60 to-orange-400/40', icon_bg: 'bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-400' },
    { accent: 'from-rose-500/60 to-pink-400/40', icon_bg: 'bg-rose-500/10 border-rose-500/20', dot: 'bg-rose-400' },
];

function parseSections(markdown: string): Section[] {
    return markdown.split('##').slice(1).map((section, idx) => {
        const lines = section.trim().split('\n').filter(l => l.trim());
        const titleLine = lines[0]?.trim() ?? '';

        // Extract leading emoji (unicode ranges for common emojis)
        const emojiMatch = titleLine.match(/^([\u{1F300}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|🚀|🔥|🛠️|💸|📈|🎯|⚡|💡|🏆|📊|🔑)/u);
        const emoji = emojiMatch ? emojiMatch[0] : '◆';
        const title = titleLine.replace(/^[^\s]+\s*/, '').replace(/[*#]/g, '').trim();

        const bullets: { label: string; detail: string }[] = [];
        lines.slice(1).forEach(line => {
            const cleaned = line.replace(/^[\s*\-•]+/, '').trim();
            if (!cleaned) return;
            // Bold label pattern: **Label:** detail  or  **Label**: detail
            const boldMatch = cleaned.match(/^\*{1,2}([^*:]+)\*{0,2}:(.+)$/);
            if (boldMatch) {
                bullets.push({ label: boldMatch[1].trim(), detail: boldMatch[2].trim() });
                return;
            }
            // Plain colon split (short label)
            const colonIdx = cleaned.indexOf(':');
            if (colonIdx > 0 && colonIdx < 55) {
                const label = cleaned.slice(0, colonIdx).replace(/\*+/g, '').trim();
                const detail = cleaned.slice(colonIdx + 1).trim();
                if (label && detail) {
                    bullets.push({ label, detail });
                    return;
                }
            }
            const text = cleaned.replace(/\*+/g, '').trim();
            if (text) bullets.push({ label: '', detail: text });
        });

        return { emoji, title, bullets, color: SECTION_COLORS[idx % SECTION_COLORS.length] };
    });
}

export default function BriefModal({ keyword, onClose }: { keyword: KeywordResult; onClose: () => void }) {
    const [brief, setBrief] = useState<string | null>(null);
    const [fullPlan, setFullPlan] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isBuilding, setIsBuilding] = useState(false);

    useEffect(() => {
        const fetchBrief = async () => {
            try {
                const resp = await fetch('/api/keywords/brief', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ keyword: keyword.keyword }),
                });
                const data = await resp.json();
                setBrief(data.brief);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchBrief();
    }, [keyword]);

    const handleBuildStrategy = async () => {
        setIsBuilding(true);
        try {
            const resp = await fetch('/api/keywords/build', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyword: keyword.keyword, brief }),
            });
            const data = await resp.json();
            if (resp.ok) setFullPlan(data.plan);
            else alert('Failed to construct detailed roadmap.');
        } catch (err) {
            console.error(err);
        } finally {
            setIsBuilding(false);
        }
    };

    const activeContent = fullPlan ?? brief;
    const sections = activeContent ? parseSections(activeContent) : [];
    const isBusy = loading || isBuilding;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center sm:justify-end bg-black/80 backdrop-blur-md sm:p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                className="w-full sm:max-w-2xl h-[94vh] sm:h-[95vh] rounded-t-[32px] sm:rounded-[40px] shadow-2xl border border-white/10 overflow-hidden flex flex-col"
                style={{ background: '#0a1628' }}
                onClick={e => e.stopPropagation()}
            >
                {/* ── HEADER ── */}
                <div className="shrink-0 px-5 pt-4 pb-4 sm:px-8 sm:pt-7 sm:pb-6 border-b border-white/5" style={{ background: '#0d1e35' }}>
                    {/* Mobile drag handle */}
                    <div className="w-10 h-1 rounded-full mx-auto mb-4 sm:hidden" style={{ background: 'rgba(255,255,255,0.15)' }} />

                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            {/* Badge */}
                            <div className="flex items-center gap-2 mb-2.5">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
                                    style={{ background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.2)' }}>
                                    <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                                    <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">
                                        {fullPlan ? 'Master Execution Plan' : 'A.I. Strategy Brief'}
                                    </span>
                                </span>
                            </div>

                            {/* Keyword title */}
                            <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-tight line-clamp-2 pr-2">
                                {keyword.keyword}
                            </h2>

                            {/* Meta pills */}
                            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                                {[
                                    `Vol ${keyword.searchVolume.toLocaleString()}`,
                                    `Diff ${keyword.competitionScore}`,
                                    keyword.intentType,
                                ].map(tag => (
                                    <span key={tag} className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-2 py-0.5 rounded-md"
                                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                            {fullPlan && (
                                <button
                                    onClick={() => setFullPlan(null)}
                                    className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 transition-all hover:text-white"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
                                >
                                    ← Brief
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2.5 rounded-2xl text-slate-400 hover:text-white transition-all"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── BODY ── */}
                <div className="flex-1 overflow-y-auto overscroll-contain">
                    {isBusy ? (
                        /* Loading state */
                        <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-8">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                className="size-16 rounded-3xl flex items-center justify-center"
                                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
                            >
                                <Sparkles className="text-primary size-8" />
                            </motion.div>
                            <div>
                                <p className="text-lg font-black text-white mb-2">
                                    {isBuilding ? 'Building Strategic Roadmap...' : 'Analyzing Market Gaps...'}
                                </p>
                                <p className="text-sm font-medium text-slate-500">
                                    Crafting your competitive intelligence report
                                </p>
                                <div className="flex items-center justify-center gap-1.5 mt-5">
                                    {[0, 0.2, 0.4].map((delay, i) => (
                                        <motion.span
                                            key={i}
                                            className="size-2 rounded-full bg-primary"
                                            animate={{ opacity: [0.3, 1, 0.3] }}
                                            transition={{ duration: 1.2, repeat: Infinity, delay }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : sections.length > 0 ? (
                        /* Sections */
                        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                            {sections.map((section, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.06 }}
                                    className="rounded-[22px] overflow-hidden shadow-lg"
                                    style={{ background: '#0f2035', border: '1px solid rgba(255,255,255,0.07)' }}
                                >
                                    {/* Colour accent bar */}
                                    <div className={`h-[3px] w-full bg-gradient-to-r ${section.color.accent}`} />

                                    {/* Section title */}
                                    <div className="px-4 sm:px-5 py-3.5 flex items-center gap-3">
                                        <div
                                            className={`size-9 sm:size-10 rounded-xl ${section.color.icon_bg} border flex items-center justify-center text-base sm:text-lg shrink-0`}
                                        >
                                            {section.emoji}
                                        </div>
                                        <h3 className="font-black text-white text-[11px] sm:text-xs tracking-widest uppercase leading-tight">
                                            {section.title}
                                        </h3>
                                    </div>

                                    {/* Bullet items */}
                                    <div className="px-3 sm:px-4 pb-4 space-y-2">
                                        {section.bullets.map((bullet, bIdx) => (
                                            <div
                                                key={bIdx}
                                                className="flex gap-3 rounded-xl px-3.5 py-3"
                                                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}
                                            >
                                                <span className={`mt-[7px] size-1.5 rounded-full ${section.color.dot} shrink-0 opacity-80`} />
                                                <p className="text-sm leading-relaxed">
                                                    {bullet.label ? (
                                                        <>
                                                            <span className="font-black text-white">{bullet.label}:</span>
                                                            {' '}
                                                            <span className="font-medium text-slate-400">{bullet.detail}</span>
                                                        </>
                                                    ) : (
                                                        <span className="font-medium text-slate-400">{bullet.detail}</span>
                                                    )}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}

                            {/* Attribution footer */}
                            <div className="flex items-center justify-center gap-2 py-4">
                                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                                <p className="text-[9px] font-black uppercase tracking-[0.25em]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                                    CreatorKeyword Pro · AI Intelligence Engine
                                </p>
                                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                            No content available.
                        </div>
                    )}
                </div>

                {/* ── FOOTER CTA ── */}
                <div className="shrink-0 p-4 sm:p-6 border-t border-white/5" style={{ background: '#0d1e35' }}>
                    {!fullPlan ? (
                        <button
                            onClick={handleBuildStrategy}
                            disabled={isBusy}
                            className="w-full bg-primary text-white py-4 sm:py-5 rounded-2xl font-black hover:brightness-110 active:scale-[0.98] transition-all uppercase tracking-widest text-xs sm:text-sm shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-40"
                        >
                            <Zap size={17} />
                            Build Full Execution Plan
                        </button>
                    ) : (
                        <button
                            onClick={onClose}
                            className="w-full text-slate-300 py-4 sm:py-5 rounded-2xl font-black hover:text-white active:scale-[0.98] transition-all uppercase tracking-widest text-xs sm:text-sm"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            Close Report
                        </button>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
