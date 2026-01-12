'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Router, Zap, Github } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-pathrag-bg/80 backdrop-blur-xl border-b border-pathrag-border">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <motion.div
            className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-pathrag-accent to-pathrag-accent-glow flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Router className="w-5 h-5 text-pathrag-bg" />
            <motion.div
              className="absolute -inset-1 rounded-xl bg-pathrag-accent/30"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          </motion.div>
          <div>
            <h1 className="text-lg font-bold text-pathrag-text tracking-tight flex items-center gap-2">
              Akili
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-pathrag-accent/20 text-pathrag-accent rounded uppercase tracking-wider">
                Beta
              </span>
            </h1>
            <p className="text-[10px] text-pathrag-text-muted uppercase tracking-widest">
              Voice Router Diagnosis
            </p>
          </div>
        </div>

        {/* Center - Status Indicators */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-pathrag-accent animate-pulse" />
            <span className="text-xs text-pathrag-text-muted">System Active</span>
          </div>
          <div className="h-4 w-px bg-pathrag-border" />
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-pathrag-accent" />
            <span className="text-xs text-pathrag-text-muted">Akili Voice Engine</span>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-pathrag-surface-alt transition-colors text-pathrag-text-muted hover:text-pathrag-text"
          >
            <Github className="w-5 h-5" />
          </a>
          <div className="hidden sm:block h-4 w-px bg-pathrag-border" />
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-pathrag-surface rounded-lg border border-pathrag-border">
            <span className="text-[10px] font-bold text-pathrag-text-muted uppercase tracking-wider">
              v2.2
            </span>
          </div>
        </div>
      </div>

      {/* Scan Line Effect */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pathrag-accent to-transparent"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ repeat: Infinity, duration: 3 }}
      />
    </header>
  );
}
