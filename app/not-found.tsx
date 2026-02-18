"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative z-10 text-center max-w-lg mx-auto"
            >
                {/* Glitchy 404 */}
                <motion.div
                    animate={{ opacity: [1, 0.8, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="text-[120px] sm:text-[180px] font-black tracking-tighter leading-none text-white/5 select-none mb-2"
                    style={{ textShadow: '0 0 80px rgba(var(--primary-rgb), 0.15)' }}
                >
                    404
                </motion.div>

                {/* Icon */}
                <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.15 }}
                    className="size-20 bg-primary/10 border border-primary/20 rounded-[28px] flex items-center justify-center mx-auto mb-8 -mt-8 shadow-2xl shadow-primary/10"
                >
                    <Search className="text-primary size-9" />
                </motion.div>

                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
                    Page Not Found
                </h1>
                <p className="text-slate-500 font-medium text-base mb-10 max-w-sm mx-auto leading-relaxed">
                    Looks like this keyword doesn&apos;t rank anywhere. Let&apos;s get you back to the intelligence dashboard.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-8 py-4 bg-primary text-white font-black rounded-2xl hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-primary/20 text-sm uppercase tracking-widest"
                    >
                        <Home size={16} />
                        Go Home
                    </Link>
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-slate-300 font-black rounded-2xl hover:bg-white/10 active:scale-95 transition-all text-sm uppercase tracking-widest"
                    >
                        <ArrowLeft size={16} />
                        Dashboard
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
