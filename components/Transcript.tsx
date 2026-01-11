'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TranscriptEntry } from '@/lib/types';
import { User, Bot, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface TranscriptProps {
  entries: TranscriptEntry[];
}

// Number of recent messages to always show
const RECENT_MESSAGE_COUNT = 6;

export default function Transcript({ entries }: TranscriptProps) {
  const [showHistory, setShowHistory] = useState(false);

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

  // Reverse entries so newest is first
  const reversedEntries = [...entries].reverse();
  
  // Split into recent and history
  const recentEntries = reversedEntries.slice(0, RECENT_MESSAGE_COUNT);
  const historyEntries = reversedEntries.slice(RECENT_MESSAGE_COUNT);
  const hasHistory = historyEntries.length > 0;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Recent Messages - Always visible, scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-pathrag-border scrollbar-track-transparent">
        <AnimatePresence initial={false}>
          {recentEntries.map((entry, index) => (
            <MessageBubble 
              key={`${entry.timestamp}-${index}`} 
              entry={entry} 
              isLatest={index === 0}
            />
          ))}
        </AnimatePresence>

        {/* Expand History Button */}
        {hasHistory && (
          <div className="pt-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full py-2 px-4 rounded-lg bg-pathrag-surface-alt border border-pathrag-border 
                         hover:bg-pathrag-border transition-colors flex items-center justify-center gap-2
                         text-sm text-pathrag-text-muted"
            >
              {showHistory ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Hide older messages
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show {historyEntries.length} older message{historyEntries.length > 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        )}

        {/* History Messages - Collapsible */}
        <AnimatePresence>
          {showHistory && historyEntries.map((entry, index) => (
            <motion.div
              key={`history-${entry.timestamp}-${index}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 0.7, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageBubble entry={entry} isLatest={false} isHistory />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  entry: TranscriptEntry;
  isLatest: boolean;
  isHistory?: boolean;
}

function MessageBubble({ entry, isLatest, isHistory = false }: MessageBubbleProps) {
  return (
    <motion.div
      initial={isLatest ? { opacity: 0, y: -10 } : { opacity: 1, y: 0 }}
      animate={{ opacity: isHistory ? 0.7 : 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${entry.role === 'user' ? 'flex-row-reverse' : ''} ${isHistory ? 'opacity-70' : ''}`}
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
        ${isLatest ? 'ring-2 ring-pathrag-accent/30' : ''}
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
          {isLatest && (
            <span className="text-[10px] px-1.5 py-0.5 bg-pathrag-accent/20 rounded text-pathrag-accent">
              Latest
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
