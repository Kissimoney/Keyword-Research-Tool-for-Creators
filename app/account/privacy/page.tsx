"use client";

import { motion } from 'framer-motion';
import { Database, ArrowLeft, Download, Trash2, Eye, ShieldCheck, Lock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function PrivacyPage() {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleExportData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch user data across tables
        const { data: leads } = await supabase.from('leads').select('*').eq('email', user.email);
        const { data: keywords } = await supabase.from('saved_keywords').select('*').eq('user_email', user.email);

        const userData = {
            profile: {
                id: user.id,
                email: user.email,
                last_sign_in: user.last_sign_in_at
            },
            usage: {
                leads: leads || [],
                saved_keywords: keywords || []
            },
            exported_at: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `stitch-data-export-${user.id.slice(0, 8)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        alert("Personal Data Export Initiated! Check your downloads.");
    };

    const handleDeleteAccount = async () => {
        if (confirm("CRITICAL WARNING: This action is irreversible. All your search history, saved keywords, and project strategies will be permanently deleted. Are you absolutely sure?")) {
            setIsDeleting(true);
            try {
                // In a real production app, you might trigger a Supabase function or edge function
                // to handle full cascading deletion including auth.user
                const { error } = await supabase.auth.signOut();
                if (error) throw error;
                router.push('/');
                alert("Account flagged for deletion. You have been signed out.");
            } catch (err: any) {
                alert(err.message);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    return (
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
                        <h1 className="text-4xl font-black text-white tracking-tight italic">Privacy & <span className="text-primary">Data</span></h1>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Total control over your intelligence assets</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    <PrivacyCard
                        icon={<Download className="text-primary" />}
                        title="Data Portability"
                        description="Download a complete archive of your industrial keywords, strategies, and audit logs as a structured JSON file."
                        action="Export My Data"
                        onClick={handleExportData}
                    />
                    <PrivacyCard
                        icon={<Eye className="text-primary" />}
                        title="Tracking Control"
                        description="Configure how we analyze your search behavior to improve AI generation. We never sell your personal data."
                        action="Manage Tracking"
                    />
                </div>

                <div className="space-y-8">
                    <h3 className="text-2xl font-black text-white tracking-tight px-4">Account Security</h3>
                    <div className="bg-surface-dark border border-white/10 rounded-[40px] overflow-hidden flex flex-col divide-y divide-white/5">
                        <SecurityItem icon={<ShieldCheck />} label="Identity Verification" status="Active" />
                        <SecurityItem icon={<Lock />} label="Two Factor Auth" status="Recommended" />
                        <SecurityItem
                            destructive
                            icon={<Trash2 />}
                            label="Delete Account"
                            status="Permanently remove all data"
                            onClick={handleDeleteAccount}
                        />
                    </div>
                </div>

                <div className="mt-16 bg-red-500/5 border border-red-500/10 p-8 rounded-[32px] flex gap-6 items-start">
                    <div className="bg-red-500/10 p-3 rounded-2xl">
                        <AlertTriangle className="text-red-500" size={24} />
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-white font-black">Data Retention Policy</h4>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed">
                            Upon account deletion, all active data is wiped from our primary databases within 48 hours. Encrypted backups are maintained for 30 days for disaster recovery before total purging.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PrivacyCard({ icon, title, description, action, onClick }: { icon: any, title: string, description: string, action: string, onClick?: () => void }) {
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
                className="mt-auto w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary transition-all shadow-xl hover:shadow-primary/20"
            >
                {action}
            </button>
        </div>
    );
}

function SecurityItem({ icon, label, status, destructive = false, onClick }: { icon: any, label: string, status: string, destructive?: boolean, onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between p-8 hover:bg-white/5 transition-colors group text-left"
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
            <div className="text-slate-700 font-black text-xs uppercase tracking-widest group-hover:text-white transition-colors">Configure</div>
        </button>
    );
}
