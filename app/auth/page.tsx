"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Mail, Lock, ArrowRight, Eye, EyeOff, Chrome } from 'lucide-react';
import Link from 'next/link';

export default function AuthPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [oauthLoading, setOauthLoading] = useState(false);
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const router = useRouter();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setMessage({ type: 'success', text: 'Check your email for the confirmation link!' });
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                router.push('/dashboard');
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        setOauthLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) {
            setMessage({ type: 'error', text: error.message });
            setOauthLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
            {/* Background */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-blue-500/10 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo */}
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
                        <div className="bg-primary p-2.5 rounded-2xl group-hover:rotate-12 transition-transform shadow-xl shadow-primary/20">
                            <BarChart3 className="text-white size-6" />
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-xl font-black text-white tracking-tight leading-none">CreatorKeyword</span>
                            <span className="text-[8px] font-black text-primary uppercase tracking-[0.3em]">Pro</span>
                        </div>
                    </Link>
                    <h2 className="text-4xl font-black text-white tracking-tight mb-3">
                        {mode === 'signin' ? 'Welcome Back' : 'Join the Alpha'}
                    </h2>
                    <p className="text-slate-500 font-medium">
                        {mode === 'signin'
                            ? 'Enter your credentials to access your dashboard.'
                            : 'Start discovering high-potential keyword gaps today.'}
                    </p>
                </div>

                <div className="bg-surface border border-white/10 rounded-[32px] p-8 shadow-2xl backdrop-blur-xl">
                    {/* Message banner */}
                    <AnimatePresence mode="wait">
                        {message && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className={`mb-6 p-4 rounded-2xl text-sm font-bold border ${message.type === 'success'
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                                    }`}
                            >
                                {message.text}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Google OAuth */}
                    <button
                        onClick={handleGoogleAuth}
                        disabled={oauthLoading}
                        className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all mb-6 disabled:opacity-50"
                    >
                        {oauthLoading ? (
                            <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Chrome size={20} />
                        )}
                        Continue with Google
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 h-px bg-white/5" />
                        <span className="text-slate-600 text-xs font-black uppercase tracking-widest">or</span>
                        <div className="flex-1 h-px bg-white/5" />
                    </div>

                    {/* Email / Password form */}
                    <form onSubmit={handleAuth} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                                <input
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="alex@example.com"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white font-bold focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-slate-700"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                                <input
                                    required
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-white font-bold focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-slate-700"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="text-center mt-8 pt-6 border-t border-white/5">
                        <button
                            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage(null); }}
                            className="text-slate-400 hover:text-white font-bold text-sm transition-colors"
                        >
                            {mode === 'signin'
                                ? "Don't have an account? Sign up free"
                                : 'Already have an account? Sign in'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
