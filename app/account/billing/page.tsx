"use client";

import { motion } from 'framer-motion';
import { CreditCard, ArrowLeft, Zap, Download, Calendar, ExternalLink, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useCreditStore } from '@/store/creditStore';

const history = [
    { date: 'Feb 15, 2026', amount: '$49.00', status: 'Paid', plan: 'Pro Monthly' },
    { date: 'Jan 15, 2026', amount: '$49.00', status: 'Paid', plan: 'Pro Monthly' },
];

export default function BillingPage() {
    const credits = useCreditStore((state) => state.credits);

    return (
        <div className="min-h-screen bg-background pt-24 pb-32 px-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] -mr-64 -mt-64" />

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
                        <CreditCard className="text-white size-8" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight italic">Billing & <span className="text-primary">Invoices</span></h1>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Manage your premium subscription</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Active Subscription Summary */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-surface-dark border border-white/10 rounded-[40px] p-10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-10 pointer-events-none opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-700">
                                <Zap size={120} className="text-primary" />
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                                <div>
                                    <span className="px-4 py-1.5 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded-full mb-4 inline-block">Pro Membership</span>
                                    <h2 className="text-4xl font-black text-white tracking-tighter">$49.00 <span className="text-slate-500 text-xl">/ mo</span></h2>
                                </div>
                                <div className="flex gap-3">
                                    <Link href="/pricing" className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-primary/20">
                                        Change Plan
                                    </Link>
                                    <button className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all">
                                        Cancel
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-white/5">
                                <SummaryStat icon={<Calendar size={18} />} label="Next Invoice" value="March 15, 2026" />
                                <SummaryStat icon={<Zap size={18} />} label="Usage Status" value="Healthy" />
                                <SummaryStat icon={<CreditCard size={18} />} label="Method" value="Visa •••• 4242" />
                            </div>
                        </div>

                        {/* Invoice History */}
                        <div className="bg-surface-dark border border-white/10 rounded-[40px] overflow-hidden">
                            <div className="p-10 border-b border-white/5 bg-white/[0.02]">
                                <h3 className="text-xl font-black text-white tracking-tight">Invoice History</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/5">
                                            <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                                            <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Plan</th>
                                            <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount</th>
                                            <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                            <th className="p-8"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {history.map((invoice, i) => (
                                            <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="p-8 text-white font-bold">{invoice.date}</td>
                                                <td className="p-8 text-slate-400 font-medium">{invoice.plan}</td>
                                                <td className="p-8 text-white font-black italic">{invoice.amount}</td>
                                                <td className="p-8">
                                                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                        {invoice.status}
                                                    </span>
                                                </td>
                                                <td className="p-8 text-right">
                                                    <button className="text-slate-600 hover:text-primary transition-colors">
                                                        <Download size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Security */}
                    <div className="space-y-8">
                        <div className="bg-primary/5 border border-primary/10 rounded-[40px] p-8 text-center flex flex-col items-center gap-6">
                            <div className="size-16 rounded-3xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                                <ShieldCheck className="text-primary size-8" />
                            </div>
                            <h4 className="text-white font-black text-lg tracking-tight">Security Guaranteed</h4>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                All payments are processed through Stripe with AES-256 encryption. We never store your full credit card details.
                            </p>
                            <Link href="#" className="text-primary text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:underline">
                                Financial Privacy <ExternalLink size={12} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SummaryStat({ icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-500">
                {icon}
                <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-white font-bold tracking-tight">{value}</p>
        </div>
    );
}
