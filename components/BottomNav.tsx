"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Folder, CreditCard, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const navItems = [
    { label: 'Research', icon: Search, href: '/dashboard' },
    { label: 'Projects', icon: Folder, href: '/projects' },
    { label: 'Pricing', icon: CreditCard, href: '/pricing' },
    { label: 'Account', icon: User, href: '/account' },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <div
            className="fixed bottom-0 left-0 right-0 bg-background/95 border-t border-primary/10 flex items-center justify-around px-2 md:hidden z-50 backdrop-blur-md"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
        >
            {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center gap-1 px-4 pt-3 pb-2 transition-colors relative min-w-[60px]",
                            isActive ? "text-primary" : "text-slate-500 hover:text-slate-300"
                        )}
                    >
                        {/* Animated top indicator */}
                        <AnimatePresence>
                            {isActive && (
                                <motion.span
                                    layoutId="bottom-nav-indicator"
                                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"
                                    initial={{ opacity: 0, scaleX: 0 }}
                                    animate={{ opacity: 1, scaleX: 1 }}
                                    exit={{ opacity: 0, scaleX: 0 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                            )}
                        </AnimatePresence>

                        {/* Icon with bounce on active */}
                        <motion.div
                            animate={isActive ? { scale: 1.2 } : { scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        >
                            <item.icon size={21} strokeWidth={isActive ? 2.5 : 1.8} />
                        </motion.div>

                        <span className={cn("text-[9px] font-black uppercase tracking-widest", isActive ? "text-primary" : "text-slate-600")}>
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </div>
    );
}
