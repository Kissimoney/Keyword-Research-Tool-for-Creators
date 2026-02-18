"use client";

import { useEffect, useState, createContext, useContext, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextValue {
    toast: (message: string, type?: ToastType, duration?: number) => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
    return ctx;
}

// ─── Individual Toast Item ────────────────────────────────────────────────────

const ICONS: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 size={17} />,
    error: <XCircle size={17} />,
    warning: <AlertCircle size={17} />,
    info: <Info size={17} />,
};

const STYLES: Record<ToastType, { bar: string; icon: string; border: string }> = {
    success: { bar: 'bg-primary', icon: 'text-primary', border: 'border-primary/20' },
    error: { bar: 'bg-red-500', icon: 'text-red-400', border: 'border-red-500/20' },
    warning: { bar: 'bg-amber-500', icon: 'text-amber-400', border: 'border-amber-500/20' },
    info: { bar: 'bg-blue-500', icon: 'text-blue-400', border: 'border-blue-500/20' },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
    const style = STYLES[toast.type];
    const duration = toast.duration ?? 3500;
    const [progress, setProgress] = useState(100);
    const startRef = useRef<number>(Date.now());
    const rafRef = useRef<number>(0);

    useEffect(() => {
        const tick = () => {
            const elapsed = Date.now() - startRef.current;
            const pct = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(pct);
            if (pct > 0) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                onDismiss(toast.id);
            }
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [toast.id, duration, onDismiss]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
            className={`relative w-full max-w-sm overflow-hidden rounded-2xl border ${style.border} shadow-2xl`}
            style={{ background: '#0f2035' }}
        >
            {/* Progress bar */}
            <div
                className={`absolute top-0 left-0 h-[2px] ${style.bar} transition-none`}
                style={{ width: `${progress}%` }}
            />

            <div className="flex items-start gap-3 px-4 py-3.5 pr-10">
                <span className={`mt-0.5 shrink-0 ${style.icon}`}>{ICONS[toast.type]}</span>
                <p className="text-sm font-semibold text-slate-200 leading-snug">{toast.message}</p>
            </div>

            <button
                onClick={() => onDismiss(toast.id)}
                className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors"
            >
                <X size={14} />
            </button>
        </motion.div>
    );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const dismiss = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((message: string, type: ToastType = 'info', duration = 3500) => {
        const id = `${Date.now()}-${Math.random()}`;
        setToasts(prev => [...prev.slice(-4), { id, message, type, duration }]);
    }, []);

    const value: ToastContextValue = {
        toast: addToast,
        success: (msg, dur) => addToast(msg, 'success', dur),
        error: (msg, dur) => addToast(msg, 'error', dur),
        warning: (msg, dur) => addToast(msg, 'warning', dur),
        info: (msg, dur) => addToast(msg, 'info', dur),
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            {/* Toast stack — bottom-right on desktop, bottom-centre on mobile */}
            <div className="fixed bottom-24 md:bottom-6 right-0 md:right-4 left-0 md:left-auto z-[200] flex flex-col gap-2 items-center md:items-end px-4 md:px-0 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map(t => (
                        <div key={t.id} className="pointer-events-auto w-full md:w-auto">
                            <ToastItem toast={t} onDismiss={dismiss} />
                        </div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}
