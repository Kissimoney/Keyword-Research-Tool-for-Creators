"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Sparkles, Wand2, Type, List, Save,
    ArrowLeft, Share2, Eye, Code, Zap,
    MoreVertical, Trash2, Check, Loader2,
    RotateCcw, Maximize2, Layers, Twitter, Linkedin, Mail, Play, MessageSquare, Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ContentProject } from '@/store/projectStore';
import { useProjectStore } from '@/store/projectStore';
import { useToast } from '@/components/Toast';

interface AIEditorProps {
    project: ContentProject;
    onClose: () => void;
}

export default function AIEditor({ project, onClose }: AIEditorProps) {
    const [title, setTitle] = useState(project.keyword);
    const [content, setContent] = useState(project.draft || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiMenuPos, setAiMenuPos] = useState<{ x: number, y: number } | null>(null);
    const [selectedText, setSelectedText] = useState('');
    const [multiplierResult, setMultiplierResult] = useState<{ platform: string, content: string } | null>(null);
    const [isMultiplying, setIsMultiplying] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);
    const { updateProject } = useProjectStore();
    const { success, error } = useToast();

    // Auto-save logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (content !== project.draft) {
                handleSave(true);
            }
        }, 5000);
        return () => clearTimeout(timer);
    }, [content]);

    const handleSave = async (silent = false) => {
        if (!silent) setIsSaving(true);
        try {
            await updateProject(project.id, {
                draft: content,
                updated_at: new Date().toISOString()
            });
            if (!silent) success('Changes saved to cloud');
        } catch (err) {
            if (!silent) error('Save failed');
        } finally {
            if (!silent) setIsSaving(false);
        }
    };

    const handleTextSelection = () => {
        const selection = window.getSelection();
        const text = selection?.toString().trim();

        if (text && text.length > 0) {
            const range = selection?.getRangeAt(0);
            const rect = range?.getBoundingClientRect();

            if (rect) {
                setAiMenuPos({
                    x: rect.left + rect.width / 2,
                    y: rect.top - 10
                });
                setSelectedText(text);
            }
        } else {
            setAiMenuPos(null);
        }
    };

    const runAIAction = async (action: 'rewrite' | 'expand' | 'simplify' | 'summarize') => {
        if (!selectedText) return;
        setIsGenerating(true);
        setAiMenuPos(null);

        try {
            const res = await fetch('/api/keywords/draft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    keyword: project.keyword,
                    brief: `Context: ${content.substring(0, 1000)}\n\nAction: ${action} this specific text: ${selectedText}`,
                    language: 'English' // Could use store language
                })
            });
            const data = await res.json();

            if (data.draft) {
                // Replace selection with AI output (simplistic implementation)
                const newContent = content.replace(selectedText, data.draft);
                setContent(newContent);
                success(`AI ${action} complete!`);
            }
        } catch (err) {
            error('AI generation failed');
        } finally {
            setIsGenerating(false);
        }
    };

    const runMultiply = async (platform: string) => {
        setIsMultiplying(true);
        try {
            const res = await fetch('/api/keywords/multiply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: content || project.draft,
                    platform,
                    keyword: project.keyword,
                    language: 'English' // Use global language eventually
                })
            });
            const data = await res.json();
            if (data.transformedContent) {
                setMultiplierResult({ platform, content: data.transformedContent });
                success(`Generated ${platform} multiplier!`);
            }
        } catch (err) {
            error('Repurposing failed');
        } finally {
            setIsMultiplying(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-[100] bg-background flex flex-col pt-20"
        >
            {/* Header / Toolbar */}
            <div className="h-16 border-b border-white/5 bg-surface/50 backdrop-blur-xl flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            handleSave(true);
                            onClose();
                        }}
                        className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="h-4 w-px bg-white/10" />
                    <div>
                        <h2 className="text-sm font-black text-white italic uppercase tracking-widest leading-none">
                            Editing <span className="text-primary">{project.keyword}</span>
                        </h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mt-1 flex items-center gap-2">
                            {isSaving ? (
                                <><Loader2 size={8} className="animate-spin" /> Saving...</>
                            ) : (
                                <><Check size={8} className="text-emerald-500" /> Cloud Synced</>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden lg:flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                        {[
                            { id: 'linkedin', icon: <Linkedin size={14} />, label: 'LinkedIn' },
                            { id: 'twitter', icon: <Twitter size={14} />, label: 'X/Threads' },
                            { id: 'newsletter', icon: <Mail size={14} />, label: 'Email' },
                            { id: 'script', icon: <Play size={14} />, label: 'Shorts' }
                        ].map(p => (
                            <button
                                key={p.id}
                                onClick={() => runMultiply(p.id)}
                                disabled={isMultiplying}
                                className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-primary transition-all flex items-center gap-2 group relative"
                                title={`Multiply for ${p.label}`}
                            >
                                {p.icon}
                                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">{p.label}</span>
                            </button>
                        ))}
                    </div>
                    <div className="h-4 w-px bg-white/10 hidden lg:block" />
                    <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:text-white transition-all">
                        <Eye size={14} /> Preview
                    </button>
                    <button
                        onClick={() => handleSave()}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
                    >
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Save
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-y-auto bg-[#050b14] relative py-12">
                <div className="max-w-3xl mx-auto px-6">
                    {/* Floating Formatting / AI Status */}
                    <AnimatePresence>
                        {isGenerating && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="fixed top-24 left-1/2 -translate-x-1/2 bg-primary/20 border border-primary/50 text-primary px-6 py-3 rounded-full backdrop-blur-xl flex items-center gap-3 z-50 shadow-2xl"
                            >
                                <Sparkles size={16} className="animate-pulse" />
                                <span className="text-xs font-black uppercase tracking-widest">AI Content Architect is working...</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Multiplier Result Modal */}
                    <AnimatePresence>
                        {multiplierResult && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 sm:p-8"
                                onClick={() => setMultiplierResult(null)}
                            >
                                <motion.div
                                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                    className="w-full max-w-2xl bg-surface-dark border border-primary/20 rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-[20px] bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                                                <Layers size={24} />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black text-white italic">The <span className="text-primary">Multiplier</span> Output</h2>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                    Repurposed for <span className="text-white font-black">{multiplierResult.platform}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <button onClick={() => setMultiplierResult(null)} className="p-3 bg-white/5 hover:bg-rose-500/10 hover:text-rose-500 rounded-2xl transition-all">
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="p-8 sm:p-12 overflow-y-auto flex-1">
                                        <div className="space-y-4 text-slate-300 leading-relaxed font-medium">
                                            {multiplierResult.content.split('\n').map((line, i) => (
                                                <p key={i} className={cn(line.startsWith('#') ? "text-xl font-black text-white mt-6 mb-4" : "text-sm")}>
                                                    {line}
                                                </p>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-8 border-t border-white/5 bg-white/[0.02] flex items-center justify-between shrink-0">
                                        <div className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Powered by Omnichannel Engine</div>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(multiplierResult.content);
                                                success("Copied to clipboard!");
                                            }}
                                            className="px-8 py-4 bg-primary text-white rounded-[20px] font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-3"
                                        >
                                            <Copy size={16} />
                                            Copy Multiplied Content
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* AI Slash/Selection Menu */}
                    <AnimatePresence>
                        {aiMenuPos && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                style={{
                                    left: aiMenuPos.x,
                                    top: aiMenuPos.y,
                                    transform: 'translateX(-50%) translateY(-100%)'
                                }}
                                className="fixed z-[120] bg-surface-dark border border-white/10 p-1.5 rounded-2xl shadow-2xl shadow-black h-12 flex items-center gap-1 backdrop-blur-2xl"
                            >
                                {[
                                    { id: 'rewrite', label: 'Rewrite', icon: <RotateCcw size={14} /> },
                                    { id: 'expand', label: 'Expand', icon: <Maximize2 size={14} /> },
                                    { id: 'summarize', label: 'Summary', icon: <Sparkles size={14} /> }
                                ].map(btn => (
                                    <button
                                        key={btn.id}
                                        onClick={() => runAIAction(btn.id as any)}
                                        className="px-3 h-full flex items-center gap-2 hover:bg-primary/20 hover:text-primary rounded-xl text-slate-400 text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                        {btn.icon}
                                        {btn.label}
                                    </button>
                                ))}
                                <div className="w-px h-6 bg-white/10 mx-1" />
                                <button className="p-2 text-slate-500 hover:text-white transition-all"><MoreVertical size={14} /></button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* The Canvas */}
                    <div className="space-y-8">
                        <textarea
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Page Title..."
                            className="w-full bg-transparent border-none text-4xl sm:text-5xl font-black text-white italic placeholder:text-slate-800 outline-none resize-none leading-tight"
                            rows={1}
                        />

                        <div
                            ref={editorRef}
                            contentEditable
                            onMouseUp={handleTextSelection}
                            onKeyUp={handleTextSelection}
                            onInput={(e) => setContent(e.currentTarget.innerText)}
                            dangerouslySetInnerHTML={{ __html: project.draft || 'Start writing your strategic content here...' }}
                            className="w-full min-h-[60vh] text-lg text-slate-300 outline-none leading-relaxed prose prose-invert prose-p:text-slate-300 prose-headings:text-white max-w-none pb-40"
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Stats */}
            <div className="h-10 border-t border-white/5 bg-surface/80 px-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Words: {content.split(/\s+/).filter(Boolean).length}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Status: {project.status || 'Drafting'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Workspace Online</span>
                </div>
            </div>
        </motion.div>
    );
}
