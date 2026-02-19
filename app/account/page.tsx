"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    User,
    CreditCard,
    Mail,
    Shield,
    Bell,
    Settings,
    LogOut,
    ChevronRight,
    Database,
    Zap,
    Crown
} from 'lucide-react';
import { useCreditStore } from '@/store/creditStore';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { useSyncCredits } from '@/hooks/use-sync-credits';

export default function AccountPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const credits = useCreditStore((state) => state.credits);
    const { success } = useToast();
    useSyncCredits(); // Load real balance from Supabase on mount

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth');
            } else {
                setUser(user);
            }
            setLoading(false);
        };
        checkUser();
    }, [router]);


    const handleSignOut = async () => {
        await supabase.auth.signOut();
        success('Signed out successfully. See you next time!');
        router.push('/');
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
    );

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background pt-6 sm:pt-12 pb-32 px-4 overflow-hidden relative font-sans">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-64 -mt-64" />

            <div className="max-w-5xl mx-auto space-y-12 relative z-10">
                {/* Header Profile */}
                <header className="flex items-center gap-5 sm:gap-8">
                    <div className="size-20 sm:size-32 rounded-[28px] sm:rounded-[40px] bg-primary/10 border border-primary/20 p-1 flex items-center justify-center relative group shrink-0">
                        <div className="absolute inset-0 bg-primary/20 rounded-[28px] sm:rounded-[40px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="size-full rounded-[24px] sm:rounded-[36px] bg-surface flex items-center justify-center border border-white/5 overflow-hidden">
                            <span className="text-3xl sm:text-5xl font-black text-primary select-none">
                                {(user.email?.[0] ?? '?').toUpperCase()}
                            </span>
                        </div>
                        <div className="absolute -bottom-2 -right-2 size-8 sm:size-10 rounded-xl sm:rounded-2xl bg-primary flex items-center justify-center shadow-lg border-4 border-background">
                            <Crown className="text-white size-4 sm:size-5" />
                        </div>
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tighter mb-1 sm:mb-2 truncate">
                            {user.email?.split('@')[0] || 'Explorer'}
                        </h1>
                        <div className="flex items-center gap-3">
                            <span className="text-primary text-[10px] sm:text-xs font-black uppercase tracking-[0.2em]">
                                Member Since {user.created_at
                                    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                    : 'Recently'}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Account Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
                    {/* Active Plan Card */}
                    <div className="bg-surface-dark border border-white/10 rounded-[28px] sm:rounded-[40px] p-6 sm:p-10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />

                        <div className="flex items-center justify-between mb-10">
                            <h3 className="text-2xl font-black text-white tracking-tight">Active Plan</h3>
                            <span className="px-4 py-1.5 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">Pro</span>
                        </div>

                        <div className="space-y-6 mb-10">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500 font-bold text-sm">Credits Remaining</span>
                                <span className="text-white font-black text-3xl tracking-tighter">
                                    {credits.toLocaleString()} <span className="text-slate-600 text-xl">/ 5,000</span>
                                </span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(credits / 5000) * 100}%` }}
                                    className="h-full bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]"
                                />
                            </div>
                        </div>

                        <Link href="/pricing" className="block w-full text-center bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-[1.02] text-white py-5 rounded-[24px] font-black tracking-widest text-xs uppercase transition-all">
                            Manage Billing
                        </Link>
                    </div>

                    {/* Account Details Card */}
                    <div className="bg-surface-dark border border-white/10 rounded-[28px] sm:rounded-[40px] p-6 sm:p-10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors" />
                        <h3 className="text-2xl font-black text-white tracking-tight mb-8">Account Details</h3>

                        <div className="space-y-8">
                            <DetailRow icon={<Mail className="text-slate-500" />} label="Email" value={user.email} />
                            <DetailRow
                                icon={<Shield className="text-slate-500" />}
                                label="Auth Provider"
                                value={user.app_metadata?.provider === 'google' ? 'Google OAuth' : 'Email & Password'}
                            />
                            <DetailRow
                                icon={<Bell className="text-slate-500" />}
                                label="Joined"
                                value={user.created_at
                                    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                                    : 'Recently'}
                            />
                        </div>
                    </div>
                </div>

                {/* Settings Section */}
                <div className="space-y-6">
                    <h3 className="text-2xl font-black text-white tracking-tight px-4">Settings</h3>
                    <div className="bg-surface-dark border border-white/10 rounded-[28px] sm:rounded-[40px] overflow-hidden flex flex-col divide-y divide-white/5">
                        <Link href="/account/settings" className="block">
                            <SettingsItem icon={<Settings />} label="General Settings" />
                        </Link>
                        <Link href="/account/billing" className="block">
                            <SettingsItem icon={<CreditCard />} label="Payment Methods" />
                        </Link>
                        <Link href="/account/privacy" className="block">
                            <SettingsItem icon={<Database />} label="Privacy & Data" />
                        </Link>
                        <SettingsItem
                            icon={<LogOut />}
                            label="Sign Out"
                            className="text-red-500 hover:bg-red-500/5 group-last:border-none"
                            onClick={handleSignOut}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}

function DetailRow({ icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="flex items-center justify-between group/row">
            <div className="flex items-center gap-4">
                <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover/row:border-white/10 transition-all shadow-inner">
                    {icon}
                </div>
                <span className="text-slate-400 font-bold">{label}</span>
            </div>
            <span className="text-white font-black text-sm tracking-tight">{value}</span>
        </div>
    );
}

function SettingsItem({ icon, label, className = "", onClick }: { icon: any, label: string, className?: string, onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between p-5 sm:p-8 hover:bg-white/5 transition-all group ${className}`}
        >
            <div className="flex items-center gap-6">
                <div className="text-slate-500 group-hover:text-primary transition-colors group-hover:scale-110 duration-500">
                    {icon}
                </div>
                <span className="font-black tracking-tight text-base sm:text-lg">{label}</span>
            </div>
            <ChevronRight className="text-slate-600 group-hover:text-white transition-all group-hover:translate-x-1" size={20} />
        </button>
    );
}
