"use client";

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Maximize2, Minimize2, Share2,
    Network, Binary, Layers, Sparkles,
    MousePointer2, ZoomIn, ZoomOut, RefreshCw
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { KeywordResult } from '@/store/searchStore';
import { cn } from '@/lib/utils';

export default function TopicMap() {
    const { savedKeywords } = useProjectStore();
    const [viewMode, setViewMode] = useState<'cluster' | 'intent'>('cluster');
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    // Grouping logic
    const clusters = useMemo(() => {
        const groups: Record<string, KeywordResult[]> = {};
        savedKeywords.forEach(k => {
            const key = viewMode === 'cluster' ? (k.cluster || 'Uncategorized') : (k.intentType || 'Mixed');
            if (!groups[key]) groups[key] = [];
            groups[key].push(k);
        });
        return groups;
    }, [savedKeywords, viewMode]);

    const clusterKeys = Object.keys(clusters);

    // Layout Calculation (Hub & Spoke)
    const nodes = useMemo(() => {
        const centerX = 500;
        const centerY = 400;
        const radius = 280;
        const result: any[] = [];

        clusterKeys.forEach((key, i) => {
            const angle = (i / clusterKeys.length) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            result.push({
                id: `cluster-${key}`,
                type: 'cluster',
                label: key,
                x, y,
                itemCount: clusters[key].length,
                color: `hsl(${i * (360 / clusterKeys.length)}, 70%, 60%)`
            });

            // Minor nodes around the cluster
            clusters[key].forEach((k, j) => {
                const subAngle = angle + (j - (clusters[key].length - 1) / 2) * 0.15;
                const subRadius = radius + 100;
                result.push({
                    id: `keyword-${k.keyword}`,
                    type: 'keyword',
                    label: k.keyword,
                    parentId: `cluster-${key}`,
                    x: centerX + Math.cos(subAngle) * subRadius,
                    y: centerY + Math.sin(subAngle) * subRadius,
                    volume: k.searchVolume,
                    color: `hsl(${i * (360 / clusterKeys.length)}, 70%, 60%)`
                });
            });
        });

        return result;
    }, [clusterKeys, clusters]);

    if (savedKeywords.length === 0) {
        return (
            <div className="h-[600px] rounded-[40px] border border-white/10 bg-surface/50 flex flex-col items-center justify-center p-12 text-center">
                <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6 animate-pulse">
                    <Network size={40} />
                </div>
                <h3 className="text-xl font-black text-white italic">The Neural Map is Empty</h3>
                <p className="text-slate-500 text-sm max-w-xs mt-2 uppercase font-bold tracking-widest">
                    Save some keywords to visualize your strategic topic clusters.
                </p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-[800px] bg-[#050b14] rounded-[48px] border border-white/5 overflow-hidden group shadow-2xl">
            {/* Legend & Controls */}
            <div className="absolute top-8 left-8 z-10 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                        <Network size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-white uppercase tracking-tighter leading-none italic">
                            Visual <span className="text-primary">Neuro-Map</span>
                        </h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Niche Authority Structure</p>
                    </div>
                </div>

                <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 backdrop-blur-xl">
                    <button
                        onClick={() => setViewMode('cluster')}
                        className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", viewMode === 'cluster' ? "bg-primary text-white shadow-lg" : "text-slate-500 hover:text-white")}
                    >
                        Cluster
                    </button>
                    <button
                        onClick={() => setViewMode('intent')}
                        className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", viewMode === 'intent' ? "bg-primary text-white shadow-lg" : "text-slate-500 hover:text-white")}
                    >
                        Intent
                    </button>
                </div>
            </div>

            <div className="absolute top-8 right-8 z-10 flex gap-2">
                <button className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all backdrop-blur-xl"><Share2 size={16} /></button>
                <button className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all backdrop-blur-xl"><RefreshCw size={16} /></button>
            </div>

            {/* Neural Canvas */}
            <svg viewBox="0 0 1000 800" className="w-full h-full cursor-grab active:cursor-grabbing">
                <defs>
                    <radialGradient id="hubGradient">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                    </radialGradient>
                </defs>

                {/* Connections (Edges) */}
                <g className="opacity-20">
                    {nodes.filter(n => n.type === 'keyword').map(node => {
                        const parent = nodes.find(p => p.id === node.parentId);
                        if (!parent) return null;
                        const isHovered = hoveredNode === node.id || hoveredNode === parent.id;
                        return (
                            <motion.line
                                key={`edge-${node.id}`}
                                x1={parent.x} y1={parent.y}
                                x2={node.x} y2={node.y}
                                stroke={node.color}
                                strokeWidth={isHovered ? 2 : 1}
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{
                                    pathLength: 1,
                                    opacity: isHovered ? 0.8 : 0.4,
                                    stroke: isHovered ? '#8b5cf6' : node.color
                                }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                        );
                    })}
                </g>

                {/* Central Root Node */}
                <circle cx="500" cy="400" r="120" fill="url(#hubGradient)" />
                <motion.circle
                    cx="500" cy="400" r="12"
                    fill="#8b5cf6"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                />

                {/* Interaction Layer */}
                {nodes.map(node => (
                    <motion.g
                        key={node.id}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onHoverStart={() => setHoveredNode(node.id)}
                        onHoverEnd={() => setHoveredNode(null)}
                        className="cursor-pointer"
                    >
                        {node.type === 'cluster' ? (
                            <>
                                <circle
                                    cx={node.x} cy={node.y}
                                    r={30 + node.itemCount * 2}
                                    fill={node.color}
                                    className="opacity-20 blur-xl"
                                />
                                <circle
                                    cx={node.x} cy={node.y}
                                    r={15}
                                    fill={node.color}
                                    stroke="white"
                                    strokeWidth="2"
                                />
                                <text
                                    x={node.x} y={node.y + 45}
                                    className="text-[12px] font-black fill-white uppercase tracking-widest text-center"
                                    textAnchor="middle"
                                >
                                    {node.label}
                                </text>
                                <text
                                    x={node.x} y={node.y + 60}
                                    className="text-[8px] font-black fill-slate-500 uppercase tracking-widest text-center"
                                    textAnchor="middle"
                                >
                                    {node.itemCount} NODES
                                </text>
                            </>
                        ) : (
                            <>
                                <circle
                                    cx={node.x} cy={node.y}
                                    r={4}
                                    fill={hoveredNode === node.id ? '#fff' : node.color}
                                />
                                <text
                                    x={node.x + 10} y={node.y + 4}
                                    className={cn(
                                        "text-[9px] font-bold fill-slate-400 uppercase tracking-tighter transition-all",
                                        hoveredNode === node.id && "fill-white text-[11px] font-black"
                                    )}
                                >
                                    {node.label}
                                </text>
                            </>
                        )}
                    </motion.g>
                ))}
            </svg>

            {/* Backdrop Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Authority Cluster</span>
                    </div>
                </div>
                <div className="bg-black/40 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full pointer-events-auto">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-4">
                        <span className="flex items-center gap-2"><div className="size-2 rounded-full bg-primary" /> Core Hub</span>
                        <span className="flex items-center gap-2"><div className="size-2 rounded-full bg-slate-600" /> Strategic Nodes</span>
                        <span className="flex items-center gap-2"><MousePointer2 size={10} /> Hover to Isolate</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
