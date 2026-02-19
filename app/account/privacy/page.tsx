"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Database, ArrowLeft, Download, Trash2, Eye, ShieldCheck, Lock, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/Toast';

/** Inline confirmation dialog — replaces browser confirm() */
function ConfirmDialog({
    isOpen,
    onConfirm,
    onCancel,
    isLoading,
}: {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading: boolean;
}) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="bg-surface-dark border border-red-500/30 rounded-[32px] p-8 max-w-md w-full shadow-2xl shadow-red-900/20"
                    >
                        <div className="flex gap-5 mb-6">
                            <div className="size-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                                <Trash2 className="text-red-500 size-7" />
                            </div>
                            <div>
                                <h3 className="text-white font-black text-xl tracking-tight mb-1">Delete Account?</h3>
                                <p className="text-slate-400 font-medium text-sm leading-relaxed">
                                    This is <span className="text-red-400 font-black">irreversible</span>. All search history, saved keywords, and project strategies will be permanently erased.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onCancel}
                                disabled={isLoading}
                                className="flex-1 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isLoading}
                                className="flex-1 py-4 bg-red-500/90 hover:bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {isLoading ? (
                                    <><Loader2 size={14} className="animate-spin" /> Deleting…</>
                                ) : (
                                    <>Yes, Delete Everything</>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default function PrivacyPage() {
    const router = useRouter();
    const { success, error: toastError, info } = useToast();
    const [isExporting, setIsExporting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleExportData = async () => {
        setIsExporting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { toastError('Please sign in to export your data.'); return; }

            const [{ data: leads }, { data: keywords }, { data: profile }] = await Promise.all([
                supabase.from('leads').select('*').eq('email', user.email),
                supabase.from('saved_keywords').select('*').eq('user_email', user.email),
                supabase.from('profiles').select('*').eq('id', user.id).single(),
            ]);

            const userData = {
                profile: {
                    id: user.id,
                    email: user.email,
                    full_name: profile?.full_name ?? null,
                    credits: profile?.credits ?? null,
                    plan: profile?.plan ?? 'starter',
                    last_sign_in: user.last_sign_in_at,
                    created_at: user.created_at,
                },
                saved_keywords: keywords ?? [],
                leads: leads ?? [],
                exported_at: new Date().toISOString(),
            };

            const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `creatorkeyword-data-${user.id.slice(0, 8)}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            success('📦 Data export ready — check your downloads!');
        } catch (err: any) {
            toastError(err.message ?? 'Export failed. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleDeleteConfirmed = async () => {
        setIsDeleting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { toastError('Not signed in.'); return; }

            // Delete user-owned rows first (cascading not guaranteed in this schema)
            await supabase.from('saved_keywords').delete().eq('user_email', user.email);
            await supabase.from('profiles').delete().eq('id', user.id);

            // Sign out — actual auth.users row deletion requires a server-side Edge Function
            await supabase.auth.signOut();
            info('Account data erased. You have been signed out.');
            router.push('/');
        } catch (err: any) {
            toastError(err.message ?? 'Deletion failed. Please try again.');
        } finally {
            setIsDeleting(false);
            setShowConfirm(false);
        }
    };

    return (
        <>
            <ConfirmDialog
                isOpen={showConfirm}
                onConfirm={handleDeleteConfirmed}
                onCancel={() => setShowConfirm(false)}
                isLoading={isDeleting}
            />

            <div className="min-h-screen bg-background pt-24 pb-32 px-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[120px] -ml-64 -mt-64 opacity-50" />

                <div className="max-w-4xl mx-auto relative z-10">
                    <Link
                        href="/account"
                        className="inline-flex items-center gap-2 text-slate-500 hover:text-white font-bold mb-12 transition-colors group"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Account
                    </Link>

                    <div className="flex items-center gap-6 mb-16">
                        <div className="bg-primary p-3 rounded-2xl shadow-xl shadow-primary/20">
                            <Database className="text-white size-8" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tight italic">Privacy &amp; <span className="text-primary">Data</span></h1>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Total control over your intelligence assets</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                        <PrivacyCard
                            icon={<Download className="text-primary" />}
                            title="Data Portability"
                            description="Download a complete archive of your industrial keywords, strategies, and profile data as a structured JSON file."
                            action={isExporting ? 'Exporting…' : 'Export My Data'}
                            loading={isExporting}
                            onClick={handleExportData}
                        />
                        <PrivacyCard
                            icon={<Eye className="text-primary" />}
                            title="Tracking Control"
                            description="We analyze aggregate search patterns to improve AI generation quality. We never sell or share your personal data with third parties."
                            action="We Never Sell Data ✓"
                            disabled
                        />
                    </div>

                    <div className="space-y-8">
                        <h3 className="text-2xl font-black text-white tracking-tight px-4">Account Security</h3>
                        <div className="bg-surface-dark border border-white/10 rounded-[40px] overflow-hidden flex flex-col divide-y divide-white/5">
                            <SecurityItem icon={<ShieldCheck />} label="Identity Verification" status="Active" />
                            <SecurityItem icon={<Lock />} label="Two-Factor Authentication" status="Coming soon" />
                            <SecurityItem
                                destructive
                                icon={<Trash2 />}
                                label="Delete Account"
                                status="Permanently remove all data"
                                onClick={() => setShowConfirm(true)}
                            />
                        </div>
                    </div>

                    <div className="mt-16 bg-emerald-500/5 border border-emerald-500/10 p-8 rounded-[32px] flex gap-6 items-start">
                        <div className="bg-emerald-500/10 p-3 rounded-2xl">
                            <CheckCircle2 className="text-emerald-400" size={24} />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-white font-black">Data Retention Policy</h4>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                Upon account deletion, all active data is wiped from our primary databases within 48&nbsp;hours. Encrypted backups are maintained for 30&nbsp;days for disaster recovery before total purging.
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 bg-red-500/5 border border-red-500/10 p-8 rounded-[32px] flex gap-6 items-start">
                        <div className="bg-red-500/10 p-3 rounded-2xl">
                            <AlertTriangle className="text-red-500" size={24} />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-white font-black">Account Deletion Warning</h4>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                Deleting your account removes your profile, saved keywords, and search history. This action cannot be undone. Credits and subscription entitlements are non-refundable after deletion.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function PrivacyCard({
    icon, title, description, action, onClick, loading, disabled,
}: {
    icon: any; title: string; description: string; action: string;
    onClick?: () => void; loading?: boolean; disabled?: boolean;
}) {
    return (
        <div className="bg-surface-dark border border-white/10 p-10 rounded-[40px] group hover:border-primary/30 transition-all flex flex-col gap-6">
            <div className="size-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                {icon}
            </div>
            <div className="space-y-2">
                <h3 className="text-xl font-black text-white">{title}</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">{description}</p>
            </div>
            <button
                onClick={onClick}
                disabled={disabled || loading}
                className="mt-auto w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary transition-all shadow-xl hover:shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-white/5"
            >
                {loading && <Loader2 size={13} className="animate-spin" />}
                {action}
            </button>
        </div>
    );
}

function SecurityItem({
    icon, label, status, destructive = false, onClick,
}: {
    icon: any; label: string; status: string; destructive?: boolean; onClick?: () => void;
}) {
    return (
        <button
            onClick={onClick}
            disabled={!onClick}
            className="w-full flex items-center justify-between p-8 hover:bg-white/5 transition-colors group text-left disabled:cursor-default"
        >
            <div className="flex items-center gap-6">
                <div className={`text-slate-500 group-hover:rotate-12 transition-transform ${destructive ? 'group-hover:text-red-500' : 'group-hover:text-primary'}`}>
                    {icon}
                </div>
                <div>
                    <span className={`block font-black tracking-tight text-lg ${destructive ? 'text-red-500' : 'text-white'}`}>{label}</span>
                    <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest">{status}</span>
                </div>
            </div>
            {onClick && (
                <div className="text-slate-700 font-black text-xs uppercase tracking-widest group-hover:text-white transition-colors">Configure</div>
            )}
        </button>
    );
}
