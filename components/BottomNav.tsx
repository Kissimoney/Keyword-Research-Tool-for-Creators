"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Folder, CreditCard, User } from 'lucide-react';
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
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 border-t border-primary/10 flex items-center justify-around px-2 py-2 md:hidden z-50 pb-safe backdrop-blur-md">
            {navItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        "flex flex-col items-center gap-1 p-2 transition-colors",
                        pathname === item.href ? "text-primary" : "text-slate-400"
                    )}
                >
                    <item.icon size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
                </Link>
            ))}
        </div>
    );
}
