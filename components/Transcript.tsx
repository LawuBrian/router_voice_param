'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TranscriptEntry } from '@/lib/types';
import { User, Bot, AlertCircle } from 'lucide-react';

interface TranscriptProps {
  entries: TranscriptEntry[];
}

export default function Transcript({ entries }: TranscriptProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new entries are added
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-pathrag-surface-alt flex items-center justify-center mb-4">
          <Bot className="w-8 h-8 text-pathrag-accent" />
        </div>
        <h3 className="text-lg font-semibold text-pathrag-text mb-2">
          Akili Assistant
        </h3>
        <p className="text-sm text-pathrag-text-muted max-w-xs">
          Start a voice session to begin the guided router diagnosis. 
          I'll walk you through each step.
        </p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="h-full overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-pathrag-border scrollbar-track-transparent"
    >
      <AnimatePresence initial={false}>
        {entries.map((entry, index) => (
          <motion.div
            key={`${entry.timestamp}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex gap-3 ${entry.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div className={`
              w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center
              ${entry.role === 'user' ? 'bg-blue-500/20' : ''}
              ${entry.role === 'model' ? 'bg-pathrag-accent/20' : ''}
              ${entry.role === 'system' ? 'bg-pathrag-warning/20' : ''}
            `}>
              {entry.role === 'user' && <User className="w-4 h-4 text-blue-400" />}
              {entry.role === 'model' && <Bot className="w-4 h-4 text-pathrag-accent" />}
              {entry.role === 'system' && <AlertCircle className="w-4 h-4 text-pathrag-warning" />}
            </div>

            {/* Message Bubble */}
            <div className={`
              max-w-[80%] rounded-xl px-4 py-3
              ${entry.role === 'user' 
                ? 'bg-blue-500/10 border border-blue-500/20' 
                : entry.role === 'model'
                ? 'bg-pathrag-surface-alt border border-pathrag-border'
                : 'bg-pathrag-warning/10 border border-pathrag-warning/20'
              }
            `}>
              <p className={`
                text-sm leading-relaxed
                ${entry.role === 'user' ? 'text-blue-100' : 'text-pathrag-text'}
              `}>
                {entry.text}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-pathrag-text-muted">
                  {formatTimestamp(entry.timestamp)}
                </span>
                {entry.node_id && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-pathrag-bg rounded text-pathrag-text-muted">
                    {entry.node_id}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Typing Indicator - can be enabled when needed */}
      {false && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-pathrag-accent/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-pathrag-accent" />
          </div>
          <div className="bg-pathrag-surface-alt border border-pathrag-border rounded-xl px-4 py-3">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-pathrag-accent"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
}
