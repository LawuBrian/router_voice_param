'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { DiagnosticNode, DiagnosticPhase, PHASE_LABELS } from '@/lib/types';
import { 
  MessageCircle, 
  ArrowRight,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Mic
} from 'lucide-react';

interface DiagnosticPanelProps {
  currentNode: DiagnosticNode | null;
  isConnected: boolean;
  onQuickResponse?: (response: string) => void;
}

export default function DiagnosticPanel({ 
  currentNode, 
  isConnected,
  onQuickResponse 
}: DiagnosticPanelProps) {
  if (!currentNode) {
    return (
      <div className="bg-pathrag-surface border border-pathrag-border rounded-xl p-6 flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-16 h-16 rounded-2xl bg-pathrag-surface-alt flex items-center justify-center mb-4">
          <HelpCircle className="w-8 h-8 text-pathrag-text-muted" />
        </div>
        <h3 className="text-lg font-semibold text-pathrag-text mb-2">
          No Active Diagnosis
        </h3>
        <p className="text-sm text-pathrag-text-muted text-center max-w-xs">
          Start a voice session to begin the guided diagnostic process.
        </p>
      </div>
    );
  }

  const expectedAnswers = Object.keys(currentNode.expected_answers);
  const isEscalation = currentNode.phase === DiagnosticPhase.ESCALATION;

  return (
    <motion.div
      key={currentNode.node_id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-pathrag-surface border border-pathrag-border rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className={`
        px-5 py-4 border-b border-pathrag-border flex items-center justify-between
        ${isEscalation ? 'bg-pathrag-warning/10' : 'bg-pathrag-accent/5'}
      `}>
        <div className="flex items-center gap-3">
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center
            ${isEscalation ? 'bg-pathrag-warning/20' : 'bg-pathrag-accent/20'}
          `}>
            {isEscalation ? (
              <AlertTriangle className="w-5 h-5 text-pathrag-warning" />
            ) : (
              <MessageCircle className="w-5 h-5 text-pathrag-accent" />
            )}
          </div>
          <div>
            <h3 className={`text-sm font-bold ${isEscalation ? 'text-pathrag-warning' : 'text-pathrag-accent'}`}>
              {PHASE_LABELS[currentNode.phase]}
            </h3>
            <p className="text-[10px] text-pathrag-text-muted uppercase tracking-wider">
              {currentNode.node_id}
            </p>
          </div>
        </div>
        
        {isConnected && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-pathrag-accent/10 rounded-full">
            <Mic className="w-3 h-3 text-pathrag-accent" />
            <span className="text-[10px] font-bold text-pathrag-accent uppercase tracking-wider">
              Listening
            </span>
          </div>
        )}
      </div>

      {/* Question */}
      <div className="p-5">
        <p className="text-xl font-semibold text-pathrag-text mb-2">
          {currentNode.question}
        </p>
        <p className="text-sm text-pathrag-text-muted leading-relaxed">
          {currentNode.voice_instruction}
        </p>
      </div>

      {/* Expected Answers / Quick Actions */}
      {expectedAnswers.length > 0 && (
        <div className="px-5 pb-5">
          <p className="text-[10px] font-bold text-pathrag-text-muted uppercase tracking-widest mb-3">
            Expected Responses
          </p>
          <div className="flex flex-wrap gap-2">
            {expectedAnswers.slice(0, 6).map((answer) => (
              <button
                key={answer}
                onClick={() => onQuickResponse?.(answer)}
                disabled={!isConnected}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  border border-pathrag-border
                  ${isConnected
                    ? 'hover:bg-pathrag-accent hover:text-pathrag-bg hover:border-pathrag-accent cursor-pointer'
                    : 'opacity-50 cursor-not-allowed'
                  }
                  bg-pathrag-surface-alt text-pathrag-text
                `}
              >
                {formatAnswerLabel(answer)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions Allowed */}
      {currentNode.actions_allowed.length > 0 && (
        <div className="px-5 pb-5 border-t border-pathrag-border pt-4">
          <p className="text-[10px] font-bold text-pathrag-text-muted uppercase tracking-widest mb-3">
            Available Actions
          </p>
          <div className="flex flex-wrap gap-2">
            {currentNode.actions_allowed.map((action) => (
              <span
                key={action}
                className="px-3 py-1.5 bg-pathrag-accent/10 border border-pathrag-accent/30 rounded-lg text-xs font-medium text-pathrag-accent"
              >
                {formatActionLabel(action)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Escalation Warning */}
      {currentNode.escalation_conditions.user_uncertain && !isEscalation && (
        <div className="px-5 pb-5">
          <div className="p-3 bg-pathrag-warning/5 border border-pathrag-warning/20 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-pathrag-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-pathrag-warning">
                Escalation Available
              </p>
              <p className="text-xs text-pathrag-text-muted mt-1">
                If you're uncertain or the screen doesn't match, say "I'm not sure" to escalate.
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function formatAnswerLabel(answer: string): string {
  const labels: Record<string, string> = {
    'yes': 'Yes',
    'no': 'No',
    'green': 'Green Light',
    'red': 'Red Light',
    'orange': 'Orange Light',
    'blinking': 'Blinking',
    'off': 'Off / No Light',
    'connected': 'Connected',
    'disconnected': 'Disconnected',
    'done': 'Done',
    'wifi': 'WiFi',
    'ethernet': 'Ethernet Cable',
  };
  return labels[answer] || answer.charAt(0).toUpperCase() + answer.slice(1).replace(/_/g, ' ');
}

function formatActionLabel(action: string): string {
  const labels: Record<string, string> = {
    'RECONNECT_SESSION': 'Reconnect',
    'SAVE_APPLY': 'Save & Apply',
    'SOFT_REBOOT': 'Reboot Router',
    'RESEAT_CABLE': 'Reseat Cable',
    'POWER_CYCLE': 'Power Cycle',
    'RESET_CREDENTIALS': 'Reset Login',
  };
  return labels[action] || action.replace(/_/g, ' ');
}
