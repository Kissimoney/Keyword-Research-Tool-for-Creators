"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Sparkles, Zap, ChevronRight, CheckCircle2 } from 'lucide-react';

const STORAGE_KEY = 'ckp-onboarding-done';

const STEPS = [
    {
        icon: <Globe className="size-10 text-primary" />,
        bg: 'bg-primary/15',
        label: 'Step 1 of 3',
        title: 'Web Intelligence',
        subtitle: 'Discover high-value keywords',
        body: 'Enter any topic or phrase and get 20 AI-curated keywords with search volume, competition score, CPC value, and a tailored strategy — all in seconds.',
        tip: '💡 Try: "AI Side Hustles" or "Passive Income 2026"',
    },
    {
        icon: <Sparkles className="size-10 text-purple-400" />,
        bg: 'bg-purple-500/15',
        label: 'Step 2 of 3',
        title: 'Video Mode',
        subtitle: 'Dominate YouTube & TikTok',
        body: 'Switch to Video mode to get platform-optimised keywords, viral hooks, and content ideas tuned for YouTube and TikTok algorithms.',
        tip: '💡 Try: "YouTube Automation" or "Faceless Channel"',
    },
    {
        icon: <Zap className="size-10 text-amber-400" />,
        bg: 'bg-amber-500/15',
        label: 'Step 3 of 3',
        title: 'Competitor Pulse',
        subtitle: 'Reverse-engineer any competitor',
        body: 'Enter a competitor\'s domain URL and we\'ll analyse their keyword footprint — revealing gaps you can exploit and direct threats to outrank.',
        tip: '💡 Try: "neilpatel.com" or "backlinko.com"',
    },
];

export default function OnboardingModal() {
    const [visible, setVisible] = useState(false);
    const [step, setStep] = useState(0);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const done = localStorage.getItem(STORAGE_KEY);
            if (!done) setVisible(true);
        }
    }, []);

    const dismiss = () => {
        localStorage.setItem(STORAGE_KEY, '1');
        setVisible(false);
    };

    const next = () => {
        if (step < STEPS.length - 1) {
            setStep(s => s + 1);
        } else {
            dismiss();
        }
    };

    if (!visible) return null;

    const current = STEPS[step];

    return (
        <AnimatePresence>
            <motion.div
                key="onboarding-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4 sm:p-6"
                style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
                onClick={dismiss}
            >
                <motion.div
                    key={`step-${step}`}
                    initial={{ opacity: 0, y: 40, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.96 }}
                    transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                    onClick={e => e.stopPropagation()}
                    className="relative w-full max-w-sm bg-[#0a1628] border border-white/10 rounded-[32px] p-7 shadow-[0_40px_80px_rgba(0,0,0,0.6)] overflow-hidden"
                >
                    {/* Glow */}
                    <div className="absolute -top-20 -right-20 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                    {/* Close */}
                    <button
                        onClick={dismiss}
                        className="absolute top-5 right-5 text-slate-600 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>

                    {/* Step label */}
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-5 block">
                        {current.label}
                    </span>

                    {/* Icon */}
                    <div className={`size-20 ${current.bg} rounded-3xl flex items-center justify-center mb-6 rotate-3`}>
                        {current.icon}
                    </div>

                    {/* Text */}
                    <h2 className="text-2xl font-black text-white tracking-tight mb-1">{current.title}</h2>
                    <p className="text-primary text-xs font-black uppercase tracking-[0.2em] mb-4">{current.subtitle}</p>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed mb-5">{current.body}</p>

                    {/* Tip */}
                    <div className="bg-white/5 border border-white/5 rounded-2xl px-4 py-3 mb-7">
                        <p className="text-slate-400 text-xs font-semibold">{current.tip}</p>
                    </div>

                    {/* Step dots */}
                    <div className="flex items-center gap-2 mb-6">
                        {STEPS.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setStep(i)}
                                className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-primary' : 'w-1.5 bg-white/20'}`}
                            />
                        ))}
                    </div>

                    {/* CTA */}
                    <button
                        onClick={next}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white font-black rounded-2xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 text-sm tracking-wide"
                    >
                        {step < STEPS.length - 1 ? (
                            <>Next <ChevronRight size={16} /></>
                        ) : (
                            <>Start Researching <CheckCircle2 size={16} /></>
                        )}
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
