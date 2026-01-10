'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface VoiceVisualizerProps {
  isActive: boolean;
  analyser: AnalyserNode | null;
  isSpeaking?: boolean;
}

export default function VoiceVisualizer({ isActive, analyser, isSpeaking }: VoiceVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !analyser || !isActive) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Set canvas size
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;

      ctx.clearRect(0, 0, width, height);

      // Draw waveform bars
      const barCount = 64;
      const barWidth = (width / barCount) - 2;
      const barSpacing = 2;
      
      for (let i = 0; i < barCount; i++) {
        // Sample from frequency data
        const dataIndex = Math.floor((i / barCount) * bufferLength);
        const value = dataArray[dataIndex] / 255;
        const barHeight = Math.max(2, value * height * 0.8);
        
        const x = i * (barWidth + barSpacing);
        const y = (height - barHeight) / 2;

        // Create gradient
        const gradient = ctx.createLinearGradient(x, y + barHeight, x, y);
        gradient.addColorStop(0, '#00d4aa');
        gradient.addColorStop(0.5, '#00ffcc');
        gradient.addColorStop(1, '#00d4aa');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();

        // Add glow effect for active bars
        if (value > 0.3) {
          ctx.shadowColor = '#00ffcc';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    };

    draw();

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resize);
    };
  }, [analyser, isActive]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-xl bg-pathrag-bg">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(0, 212, 170, 0.3) 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* Idle State Animation */}
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="relative"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border border-pathrag-accent/30"
                style={{
                  width: 60 + i * 30,
                  height: 60 + i * 30,
                  left: -(30 + i * 15),
                  top: -(30 + i * 15),
                }}
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.1, 0.3]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2, 
                  delay: i * 0.3,
                  ease: 'easeInOut'
                }}
              />
            ))}
            <div className="w-4 h-4 rounded-full bg-pathrag-accent animate-pulse" />
          </motion.div>
        </div>
      )}

      {/* Active Canvas */}
      <canvas
        ref={canvasRef}
        className={`w-full h-full transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Remove incorrect speaking indicator - audio visualization shows activity */}

      {/* Connection Status */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-pathrag-accent animate-pulse' : 'bg-pathrag-danger'}`} />
        <span className="text-[10px] font-bold text-pathrag-text-muted uppercase tracking-wider">
          {isActive ? 'Connected' : 'Disconnected'}
        </span>
      </div>
    </div>
  );
}
