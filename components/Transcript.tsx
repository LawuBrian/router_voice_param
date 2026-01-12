'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TranscriptEntry } from '@/lib/types';
import { User, Bot, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface TranscriptProps {
  entries: TranscriptEntry[];
}

// Number of recent messages to always show
const RECENT_COUNT = 5;

export default function Transcript({ entries }: TranscriptProps) {
  const [showOldLogs, setShowOldLogs] = useState(false);

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

  // Reverse entries so newest is at top
  const reversedEntries = [...entries].reverse();
  
  // Split into recent and old
  const recentEntries = reversedEntries.slice(0, RECENT_COUNT);
  const oldEntries = reversedEntries.slice(RECENT_COUNT);
  const hasOldLogs = oldEntries.length > 0;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Recent messages - always visible, newest at top */}
      <div className="flex-shrink-0 p-4 space-y-4">
        <AnimatePresence initial={false}>
          {recentEntries.map((entry, index) => (
            <TranscriptMessage key={`${entry.timestamp}-${index}`} entry={entry} />
          ))}
        </AnimatePresence>
      </div>

      {/* Expand old logs button */}
      {hasOldLogs && (
        <div className="flex-shrink-0 px-4 py-2 border-t border-pathrag-border">
          <button
            onClick={() => setShowOldLogs(!showOldLogs)}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-pathrag-surface-alt hover:bg-pathrag-border transition-colors text-sm text-pathrag-text-muted"
          >
            {showOldLogs ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide older messages ({oldEntries.length})
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show older messages ({oldEntries.length})
              </>
            )}
          </button>
        </div>
      )}

      {/* Old logs - scrollable section */}
      <AnimatePresence>
        {showOldLogs && hasOldLogs && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-hidden"
          >
            <div className="h-full max-h-64 overflow-y-auto p-4 space-y-4 border-t border-pathrag-border bg-pathrag-bg/50 scrollbar-thin scrollbar-thumb-pathrag-border scrollbar-track-transparent">
              {oldEntries.map((entry, index) => (
                <TranscriptMessage 
                  key={`old-${entry.timestamp}-${index}`} 
                  entry={entry} 
                  isOld 
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Individual message component
function TranscriptMessage({ entry, isOld = false }: { entry: TranscriptEntry; isOld?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: isOld ? 0.7 : 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
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
