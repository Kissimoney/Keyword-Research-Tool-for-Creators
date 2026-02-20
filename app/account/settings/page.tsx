"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Save, ArrowLeft, Camera, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function GeneralSettings() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>({
        full_name: '',
        avatar_url: '',
        preferred_language: 'English',
    });
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth');
                return;
            }
            setUser(user);

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (data) {
                setProfile({
                    full_name: data.full_name || '',
                    avatar_url: data.avatar_url || '',
                    preferred_language: data.preferred_language || 'English',
                });
            }
            setLoading(false);
        };
        fetchProfile();
    }, [router]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    full_name: profile.full_name,
                    avatar_url: profile.avatar_url,
                    preferred_language: profile.preferred_language,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-background pt-24 pb-32 px-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-2xl mx-auto relative z-10">
                <Link
                    href="/account"
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-white font-bold mb-12 transition-colors group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Account
                </Link>

                <div className="flex items-center gap-6 mb-12">
                    <div className="bg-primary p-3 rounded-2xl shadow-xl shadow-primary/20">
                        <User className="text-white size-8" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight italic">General <span className="text-primary">Settings</span></h1>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Manage your digital identity</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-8 bg-surface-dark border border-white/10 p-10 rounded-[48px] shadow-2xl backdrop-blur-xl">
                    <AnimatePresence mode="wait">
                        {message && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={`p-4 rounded-2xl text-sm font-black border ${message.type === 'success'
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                                    }`}
                            >
                                {message.text}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Avatar Section */}
                    <div className="flex flex-col items-center gap-6 pb-8 border-b border-white/5">
                        <div className="size-28 rounded-[36px] bg-white/5 border border-white/10 p-1 flex items-center justify-center relative group overflow-hidden">
                            <div className="size-full rounded-[32px] bg-surface flex items-center justify-center text-primary font-black text-3xl italic">
                                {profile.full_name ? profile.full_name[0].toUpperCase() : user.email[0].toUpperCase()}
                            </div>
                            <button
                                type="button"
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2"
                            >
                                <Camera className="text-white" size={24} />
                                <span className="text-[10px] text-white font-black uppercase tracking-widest">Change</span>
                            </button>
                        </div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest text-center">Your profile photo is visible to team members</p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Full Name</label>
                            <input
                                required
                                type="text"
                                value={profile.full_name}
                                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                placeholder="Enter your full name"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-slate-700"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Preferred Language</label>
                            <select
                                value={profile.preferred_language}
                                onChange={(e) => setProfile({ ...profile, preferred_language: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none cursor-pointer"
                            >
                                <option value="English">English</option>
                                <option value="German">German (Deutsch)</option>
                                <option value="Spanish">Spanish (Español)</option>
                                <option value="French">French (Français)</option>
                                <option value="Portuguese">Portuguese</option>
                                <option value="Italian">Italian</option>
                                <option value="Japanese">Japanese</option>
                                <option value="Chinese">Chinese</option>
                            </select>
                        </div>
                    </div>

                    <button
                        disabled={saving}
                        type="submit"
                        className="w-full bg-primary text-white py-5 rounded-3xl font-black text-lg hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 mt-4"
                    >
                        {saving ? (
                            <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save size={20} />
                                Update Profile
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
