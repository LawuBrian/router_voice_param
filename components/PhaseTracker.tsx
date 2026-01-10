'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { DiagnosticPhase, PHASE_LABELS } from '@/lib/types';
import { 
  Plug, 
  Wifi, 
  LogIn, 
  Globe, 
  Wrench, 
  CheckCircle, 
  AlertTriangle,
  Play,
  FileCheck
} from 'lucide-react';

interface PhaseTrackerProps {
  currentPhase: DiagnosticPhase;
  progress: number;
  status: 'active' | 'resolved' | 'escalated' | 'abandoned';
}

const PHASE_ICONS: Record<DiagnosticPhase, React.ReactNode> = {
  [DiagnosticPhase.ENTRY]: <Play className="w-4 h-4" />,
  [DiagnosticPhase.PHYSICAL_LAYER]: <Plug className="w-4 h-4" />,
  [DiagnosticPhase.LOCAL_NETWORK]: <Wifi className="w-4 h-4" />,
  [DiagnosticPhase.ROUTER_LOGIN]: <LogIn className="w-4 h-4" />,
  [DiagnosticPhase.WAN_INSPECTION]: <Globe className="w-4 h-4" />,
  [DiagnosticPhase.CORRECTIVE_ACTIONS]: <Wrench className="w-4 h-4" />,
  [DiagnosticPhase.VERIFICATION]: <CheckCircle className="w-4 h-4" />,
  [DiagnosticPhase.ESCALATION]: <AlertTriangle className="w-4 h-4" />,
  [DiagnosticPhase.POST_SESSION]: <FileCheck className="w-4 h-4" />,
};

const PHASE_ORDER = [
  DiagnosticPhase.ENTRY,
  DiagnosticPhase.PHYSICAL_LAYER,
  DiagnosticPhase.LOCAL_NETWORK,
  DiagnosticPhase.ROUTER_LOGIN,
  DiagnosticPhase.WAN_INSPECTION,
  DiagnosticPhase.CORRECTIVE_ACTIONS,
  DiagnosticPhase.VERIFICATION,
];

export default function PhaseTracker({ currentPhase, progress, status }: PhaseTrackerProps) {
  const currentIndex = PHASE_ORDER.indexOf(currentPhase);

  return (
    <div className="bg-pathrag-surface border border-pathrag-border rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xs font-bold text-pathrag-text-muted uppercase tracking-widest">
          Diagnostic Progress
        </h3>
        <div className="flex items-center gap-2">
          <span className={`
            px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider
            ${status === 'active' ? 'bg-pathrag-accent/20 text-pathrag-accent' : ''}
            ${status === 'resolved' ? 'bg-green-500/20 text-green-400' : ''}
            ${status === 'escalated' ? 'bg-pathrag-warning/20 text-pathrag-warning' : ''}
            ${status === 'abandoned' ? 'bg-pathrag-danger/20 text-pathrag-danger' : ''}
          `}>
            {status}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-pathrag-surface-alt rounded-full mb-6 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-pathrag-accent to-pathrag-accent-glow rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        <div 
          className="absolute inset-y-0 left-0 bg-pathrag-accent/30 rounded-full animate-pulse"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Phase Steps */}
      <div className="space-y-2">
        {PHASE_ORDER.map((phase, index) => {
          const isActive = phase === currentPhase;
          const isCompleted = index < currentIndex;
          const isPending = index > currentIndex;

          return (
            <motion.div
              key={phase}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg transition-all
                ${isActive ? 'bg-pathrag-accent/10 border border-pathrag-accent/30' : ''}
                ${isCompleted ? 'opacity-60' : ''}
                ${isPending ? 'opacity-30' : ''}
              `}
            >
              {/* Icon */}
              <div className={`
                w-8 h-8 rounded-lg flex items-center justify-center transition-all
                ${isActive ? 'bg-pathrag-accent text-pathrag-bg' : ''}
                ${isCompleted ? 'bg-pathrag-accent/30 text-pathrag-accent' : ''}
                ${isPending ? 'bg-pathrag-surface-alt text-pathrag-text-muted' : ''}
              `}>
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  PHASE_ICONS[phase]
                )}
              </div>

              {/* Label */}
              <div className="flex-1 min-w-0">
                <p className={`
                  text-sm font-medium truncate
                  ${isActive ? 'text-pathrag-accent' : 'text-pathrag-text'}
                `}>
                  {PHASE_LABELS[phase]}
                </p>
              </div>

              {/* Status Indicator */}
              {isActive && (
                <motion.div
                  className="w-2 h-2 rounded-full bg-pathrag-accent"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Escalation indicator */}
      {(currentPhase === DiagnosticPhase.ESCALATION || status === 'escalated') && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-pathrag-warning/10 border border-pathrag-warning/30 rounded-lg"
        >
          <div className="flex items-center gap-2 text-pathrag-warning">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Escalation Required</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
