"use client";

import { motion } from 'framer-motion';
import { Check, Zap, Crown, Rocket, Sparkles } from 'lucide-react';
import Link from 'next/link';

const tiers = [
    {
        name: 'Starter',
        price: '0',
        description: 'Perfect for individual explorers.',
        features: ['100 Monthly Credits', 'Basic Web Search', 'CSV Exports', 'Community Support'],
        cta: 'Current Plan',
        current: true,
    },
    {
        name: 'Pro',
        price: '49',
        description: 'For power creators and SEO leads.',
        features: ['5,000 Monthly Credits', 'Competitor Pulse Access', 'Master execution plans', 'Priority Support', 'Full API Access'],
        cta: 'Upgrade to Pro',
        highlight: true,
    },
    {
        name: 'Elite',
        price: '99',
        description: 'Industrial scale keyword intelligence.',
        features: ['Unlimited Credits', 'Team Workspaces', 'White-label Reports', 'Dedicated Account Manager'],
        cta: 'Contact Sales',
    }
];

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-background py-20 sm:py-32 px-4 relative overflow-hidden pb-28 md:pb-20">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-primary/10 rounded-full blur-[160px] opacity-20" />

            <div className="max-w-7xl mx-auto text-center relative z-10">
                <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-primary text-xs font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-4 sm:mb-6 block"
                >
                    Elite Intelligence Plans
                </motion.span>
                <h1 className="text-white text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter mb-5 sm:mb-8 italic leading-tight">
                    Scale Your <span className="text-primary italic">Impact</span>
                </h1>
                <p className="text-slate-500 text-base sm:text-xl font-medium mb-12 sm:mb-24 max-w-2xl mx-auto px-2">
                    Simple, transparent pricing for creators who demand the best data in the industry.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
                    {tiers.map((tier, idx) => (
                        <motion.div
                            key={tier.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`relative bg-surface-dark border ${tier.highlight ? 'border-primary shadow-2xl shadow-primary/10 sm:col-span-2 lg:col-span-1' : 'border-white/5'} p-7 sm:p-10 rounded-[36px] sm:rounded-[48px] flex flex-col items-start gap-6 sm:gap-8 group`}
                        >
                            {tier.highlight && (
                                <div className="absolute top-0 right-8 -translate-y-1/2 bg-primary text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                                    Best Value
                                </div>
                            )}

                            <div className="space-y-1 sm:space-y-2 w-full">
                                <h3 className="text-white text-xl sm:text-2xl font-black tracking-tight">{tier.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-white text-4xl sm:text-5xl font-black tracking-tighter">${tier.price}</span>
                                    <span className="text-slate-500 font-bold">/mo</span>
                                </div>
                            </div>

                            <p className="text-slate-400 font-medium text-left text-sm sm:text-base">{tier.description}</p>

                            <div className="space-y-3 sm:space-y-4 w-full text-left">
                                {tier.features.map(feature => (
                                    <div key={feature} className="flex items-center gap-3">
                                        <div className="size-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                            <Check className="text-primary size-3" strokeWidth={4} />
                                        </div>
                                        <span className="text-slate-300 font-bold text-sm tracking-tight">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button className={`mt-auto w-full py-4 sm:py-5 rounded-2xl sm:rounded-3xl font-black uppercase tracking-[0.15em] text-xs transition-all ${tier.highlight
                                ? 'bg-primary text-white hover:scale-[1.02] shadow-xl shadow-primary/20 hover:brightness-110'
                                : tier.current
                                    ? 'bg-white/5 border border-white/10 text-slate-500 cursor-default'
                                    : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                                }`}>
                                {tier.cta}
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
