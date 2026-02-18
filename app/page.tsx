"use client";

import Link from 'next/link';
import { Search, ShieldCheck, Zap, LineChart, DollarSign, CheckCircle2, Sparkles, TrendingUp, ArrowRight, ChevronRight, BarChart3, Star, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchStore } from '@/store/searchStore';
import { supabase } from '@/lib/supabase';

/* ─── Animation variants ─────────────────────────────────────── */
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

/* ─── Data ───────────────────────────────────────────────────── */
const PLACEHOLDERS = [
  'AI side hustles 2026',
  'faceless YouTube channel',
  'ChatGPT prompts for creators',
  'passive income ideas',
  'digital products to sell',
  'YouTube automation niche',
];

const TICKER_STATS = [
  { label: 'Keywords Analysed', value: '12.4M+' },
  { label: 'Creators Served', value: '5,200+' },
  { label: 'Avg. Rank Lift', value: '+38%' },
  { label: 'Content Briefs Generated', value: '890K+' },
  { label: 'Competitor Scans', value: '340K+' },
  { label: 'Countries Covered', value: '190+' },
];

const STEPS = [
  {
    num: '01',
    title: 'Enter Any Keyword',
    desc: 'Type a topic, niche, or competitor domain. Our engine handles the rest.',
    icon: <Search className="text-primary size-6" />,
  },
  {
    num: '02',
    title: 'Get AI Intelligence',
    desc: 'Receive volume, difficulty, CPC, intent, trend direction and cluster grouping instantly.',
    icon: <Sparkles className="text-primary size-6" />,
  },
  {
    num: '03',
    title: 'Build Your Strategy',
    desc: 'One click generates a full content execution plan. Save keywords to Projects and export.',
    icon: <BarChart3 className="text-primary size-6" />,
  },
];

const TESTIMONIALS = [
  {
    name: 'Mia Chen',
    handle: '@mia.creates',
    avatar: 'https://i.pravatar.cc/100?u=mia',
    text: 'CreatorKeyword Pro completely changed how I plan content. I went from 8K to 42K subscribers in 4 months.',
    stars: 5,
  },
  {
    name: 'Jordan Blake',
    handle: '@jordanblake',
    avatar: 'https://i.pravatar.cc/100?u=jordan',
    text: 'The competitor pulse feature is insane. I can see exactly which keywords my rivals are ranking for.',
    stars: 5,
  },
  {
    name: 'Priya Nair',
    handle: '@priya.digital',
    avatar: 'https://i.pravatar.cc/100?u=priya',
    text: 'The AI strategy briefs save me hours every week. Best tool in my creator stack by far.',
    stars: 5,
  },
];

/* ─── Page ───────────────────────────────────────────────────── */
export default function LandingPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const setStoreQuery = useSearchStore((state) => state.setQuery);

  // Rotate placeholder every 3 s
  useEffect(() => {
    const id = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      setStoreQuery(keyword);
      router.push('/dashboard');
    }
  };

  return (
    <div className="relative overflow-hidden bg-background">
      {/* ── Dynamic Background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute -top-[10%] -left-[10%] w-[70%] h-[70%] bg-primary rounded-full blur-[160px]"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 15, repeat: Infinity, delay: 2 }}
          className="absolute -bottom-[10%] -right-[10%] w-[70%] h-[70%] bg-primary/40 rounded-full blur-[160px]"
        />
      </div>

      {/* ── Hero ── */}
      <section className="relative px-4 pt-24 pb-16 z-10 sm:pt-32 sm:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-5xl mx-auto text-center flex flex-col items-center"
        >
          <motion.span
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="group cursor-default bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] px-4 sm:px-6 py-2 rounded-full mb-8 border border-primary/20 flex items-center gap-2 hover:bg-primary/20 transition-all"
          >
            <Sparkles size={12} className="animate-pulse" />
            Empowering Modern Content Creators
          </motion.span>

          <h1 className="text-white text-5xl font-black leading-[1.05] tracking-tighter mb-6 sm:text-7xl md:text-8xl lg:text-[100px] sm:mb-8">
            Master the{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-emerald-400 to-primary animate-gradient">
              Algorithm
            </span>
          </h1>

          <p className="text-slate-400 text-base sm:text-xl font-medium leading-relaxed mb-10 max-w-2xl mx-auto sm:mb-16 px-2">
            The next generation of keyword intelligence. Data-backed strategies to dominate search results and grow your audience.
          </p>

          {/* Search Interface */}
          <motion.form
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            onSubmit={handleSearch}
            className="w-full max-w-3xl mb-8 sm:mb-12"
          >
            <div className="relative group p-1.5 bg-white/5 backdrop-blur-3xl rounded-[24px] sm:rounded-[32px] border border-white/10 shadow-2xl">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-emerald-500 rounded-[24px] sm:rounded-[32px] blur opacity-20 group-focus-within:opacity-40 transition duration-1000" />
              <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-surface-dark border border-white/10 rounded-[20px] sm:rounded-[26px] overflow-hidden p-3 gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="pl-3 sm:pl-6 text-slate-500 shrink-0">
                    <Search size={20} strokeWidth={2.5} />
                  </div>
                  <div className="relative flex-1 h-12 sm:h-14 overflow-hidden">
                    <input
                      className="absolute inset-0 bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-500 w-full text-base sm:text-xl font-bold py-0"
                      type="text"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder=""
                    />
                    {/* Animated placeholder */}
                    {!keyword && (
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={placeholderIdx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.35 }}
                          className="absolute inset-0 flex items-center text-slate-500 font-bold text-base sm:text-xl pointer-events-none select-none"
                        >
                          {PLACEHOLDERS[placeholderIdx]}
                        </motion.span>
                      </AnimatePresence>
                    )}
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-primary text-white px-8 h-12 sm:h-14 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/20 whitespace-nowrap w-full sm:w-auto"
                >
                  Analyze
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-5 sm:mt-8 justify-center sm:justify-start">
              <Link
                href="/dashboard"
                className="text-slate-400 hover:text-white font-bold text-sm transition-colors flex items-center gap-2 group"
              >
                Go to Dashboard
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.form>

          <LeadForm />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-4 sm:gap-8"
          >
            <div className="flex -space-x-3 sm:-space-x-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-background bg-slate-800 flex items-center justify-center text-[10px] font-black text-white overflow-hidden ring-2 ring-primary/20">
                  <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" />
                </div>
              ))}
            </div>
            <p className="text-slate-500 text-xs sm:text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="text-primary size-4 sm:size-5" />
              Trusted by 5,000+ creators
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Live Stats Ticker ── */}
      <div className="relative z-10 border-y border-white/5 bg-black/30 py-4 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...TICKER_STATS, ...TICKER_STATS].map((stat, i) => (
            <div key={i} className="inline-flex items-center gap-3 mx-10 shrink-0">
              <span className="text-primary font-black text-lg">{stat.value}</span>
              <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">{stat.label}</span>
              <span className="text-white/10 text-xl">·</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features Grid ── */}
      <section className="px-4 py-16 sm:py-32 bg-black/40 border-b border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col justify-between items-center sm:items-end mb-12 sm:mb-20 gap-6 text-center">
            <div>
              <h3 className="text-primary text-xs font-black uppercase tracking-[0.4em] mb-3 sm:mb-4">Intelligence Platform</h3>
              <h2 className="text-white text-3xl sm:text-5xl font-black tracking-tighter">Tools to help you scale.</h2>
            </div>
            <p className="text-slate-400 max-w-sm font-medium text-sm sm:text-base">
              From deep search insights to AI-driven strategy briefs, we provide everything you need to reach #1.
            </p>
          </div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-8"
          >
            <FeatureCard icon={<TrendingUp className="text-primary" />} title="Real-time Volume" description="Get ultra-precise search data synchronized across Google, YouTube, and TikTok algorithms." />
            <FeatureCard icon={<ShieldCheck className="text-primary" />} title="Difficulty Matrix" description="Know your probability of ranking before you hit publish with our proprietary difficulty score." />
            <FeatureCard icon={<Sparkles className="text-primary" />} title="AI Content Briefs" description="Click any keyword to generate a complete content roadmap including titles, headers, and semantic tags." />
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="px-4 py-16 sm:py-32 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-20">
            <h3 className="text-primary text-xs font-black uppercase tracking-[0.4em] mb-3">Simple Process</h3>
            <h2 className="text-white text-3xl sm:text-5xl font-black tracking-tighter">From idea to strategy in seconds.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-12 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

            {STEPS.map((step, idx) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className="relative bg-surface-dark border border-white/5 rounded-[28px] p-8 flex flex-col gap-5 hover:border-primary/30 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {step.icon}
                  </div>
                  <span className="text-4xl font-black text-white/5 tracking-tighter">{step.num}</span>
                </div>
                <div>
                  <h4 className="text-white font-black text-xl mb-2 tracking-tight">{step.title}</h4>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-center mt-12">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-3 bg-primary text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:brightness-110 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
            >
              <Play size={16} />
              Start for Free
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="px-4 py-16 sm:py-24 bg-black/40 border-y border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h3 className="text-primary text-xs font-black uppercase tracking-[0.4em] mb-3">Creator Stories</h3>
            <h2 className="text-white text-3xl sm:text-5xl font-black tracking-tighter">Loved by creators worldwide.</h2>
          </div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-8"
          >
            {TESTIMONIALS.map((t) => (
              <motion.div
                key={t.name}
                variants={item}
                whileHover={{ y: -4 }}
                className="bg-surface-dark border border-white/5 rounded-[28px] p-8 flex flex-col gap-5 hover:border-primary/20 transition-all"
              >
                <div className="flex gap-1">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} size={14} className="text-primary fill-primary" />
                  ))}
                </div>
                <p className="text-slate-300 font-medium text-sm leading-relaxed flex-1">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="size-10 rounded-full ring-2 ring-primary/20" />
                  <div>
                    <p className="text-white font-black text-sm">{t.name}</p>
                    <p className="text-slate-500 text-xs font-bold">{t.handle}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Social Proof Logos ── */}
      <section className="py-16 sm:py-24 px-4 overflow-hidden relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <h4 className="text-slate-500 text-xs font-black uppercase tracking-[0.5em] mb-8 sm:mb-12">Built for growth on</h4>
          <div className="flex flex-wrap justify-center gap-8 sm:gap-24 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
            <span className="text-white text-lg sm:text-xl font-black tracking-tighter">YouTube</span>
            <span className="text-white text-lg sm:text-xl font-black tracking-tighter">Google</span>
            <span className="text-white text-lg sm:text-xl font-black tracking-tighter">TikTok</span>
            <span className="text-white text-lg sm:text-xl font-black tracking-tighter">Meta</span>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-4 py-20 sm:py-32 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center bg-surface-dark border border-primary/20 rounded-[40px] p-10 sm:p-16 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-primary/5 rounded-[40px]" />
          <div className="absolute -top-20 -right-20 size-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-4 block">Get Started Today</span>
            <h2 className="text-white text-4xl sm:text-6xl font-black tracking-tighter mb-6">
              Your next viral keyword<br />is one search away.
            </h2>
            <p className="text-slate-400 font-medium mb-10 max-w-md mx-auto">
              Join 5,000+ creators who use CreatorKeyword Pro to find untapped opportunities every day.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-3 bg-primary text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:brightness-110 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-primary/30"
            >
              Start Researching Free
              <ArrowRight size={18} />
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────── */
function LeadForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const { error } = await supabase.from('leads').insert([{ email }]);
      if (error) throw error;
      setStatus('success');
      setEmail('');
    } catch (err: any) {
      console.error(err);
      setStatus(err.code === '23505' ? 'success' : 'error');
    }
  };

  return (
    <div className="w-full max-w-md mb-10 sm:mb-16 relative px-0">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="relative flex-1 w-full">
            <input
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 h-13 sm:h-14 py-4 text-white placeholder:text-slate-600 font-bold focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm sm:text-base"
              placeholder="Join early access"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full sm:w-auto px-6 sm:px-8 h-13 sm:h-14 py-4 rounded-2xl font-black text-slate-900 bg-white hover:bg-primary hover:text-white transition-all disabled:opacity-50 whitespace-nowrap text-sm sm:text-base"
          >
            {status === 'loading' ? 'Joining...' : 'Claim Access'}
          </button>
        </div>
      </form>
      <AnimatePresence>
        {status === 'success' && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-primary text-xs font-black mt-4 tracking-widest uppercase flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={14} /> You're in! Check your inbox soon.
          </motion.p>
        )}
        {status === 'error' && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-xs font-black mt-4 tracking-widest uppercase flex items-center justify-center gap-2"
          >
            Something went wrong — try again.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div
      variants={item}
      whileHover={{ y: -6 }}
      className="bg-surface-dark border border-white/5 p-8 sm:p-12 rounded-[32px] sm:rounded-[40px] flex flex-col items-start gap-6 sm:gap-8 hover:border-primary/40 transition-all group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
      <div className="bg-primary/10 p-4 sm:p-5 rounded-2xl group-hover:scale-110 transition-transform duration-500 ring-1 ring-primary/20">
        {icon}
      </div>
      <div>
        <h4 className="text-white font-black text-xl sm:text-2xl mb-3 sm:mb-4 tracking-tight">{title}</h4>
        <p className="text-slate-400 text-base sm:text-lg leading-relaxed font-medium">{description}</p>
      </div>
    </motion.div>
  );
}
