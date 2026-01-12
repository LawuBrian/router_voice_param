'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RouterAsset } from '@/lib/types';
import { getPlaceholderSvg } from '@/lib/assets';
import { 
  Image as ImageIcon, 
  ZoomIn, 
  ZoomOut, 
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface AssetViewerProps {
  assets: RouterAsset[];
  nodeId: string;
}

export default function AssetViewer({ assets, nodeId }: AssetViewerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  // Reset selectedIndex when assets change and index is out of bounds
  React.useEffect(() => {
    if (selectedIndex >= assets.length) {
      setSelectedIndex(0);
    }
  }, [assets, selectedIndex]);

  if (!assets || assets.length === 0) {
    return (
      <div className="bg-pathrag-surface border border-pathrag-border rounded-xl p-6 flex flex-col items-center justify-center min-h-[200px]">
        <div className="w-12 h-12 rounded-xl bg-pathrag-surface-alt flex items-center justify-center mb-3">
          <ImageIcon className="w-6 h-6 text-pathrag-text-muted" />
        </div>
        <p className="text-sm text-pathrag-text-muted">No visual guides for this step</p>
      </div>
    );
  }

  // Ensure we have a valid index
  const safeIndex = Math.min(selectedIndex, assets.length - 1);
  const currentAsset = assets[safeIndex];

  // Guard against undefined asset
  if (!currentAsset) {
    return (
      <div className="bg-pathrag-surface border border-pathrag-border rounded-xl p-6 flex flex-col items-center justify-center min-h-[200px]">
        <div className="w-12 h-12 rounded-xl bg-pathrag-surface-alt flex items-center justify-center mb-3">
          <ImageIcon className="w-6 h-6 text-pathrag-text-muted" />
        </div>
        <p className="text-sm text-pathrag-text-muted">Loading visual guide...</p>
      </div>
    );
  }

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : assets.length - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev < assets.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="bg-pathrag-surface border border-pathrag-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-pathrag-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-pathrag-accent" />
          <h3 className="text-xs font-bold text-pathrag-text-muted uppercase tracking-widest">
            Reference Guide
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {assets.length > 1 && (
            <span className="text-xs text-pathrag-text-muted">
              {selectedIndex + 1} / {assets.length}
            </span>
          )}
          <button
            onClick={() => setIsZoomed(true)}
            className="p-1.5 rounded-lg hover:bg-pathrag-surface-alt transition-colors text-pathrag-text-muted hover:text-pathrag-text"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Asset Display */}
      <div className="relative aspect-video bg-pathrag-bg">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentAsset.asset_id || 'asset'}
            src={currentAsset.url || getPlaceholderSvg(currentAsset.alt_text || 'Router guide')}
            alt={currentAsset.alt_text || 'Router guide'}
            className="w-full h-full object-contain p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = getPlaceholderSvg(currentAsset.alt_text);
            }}
          />
        </AnimatePresence>

        {/* Navigation Arrows */}
        {assets.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-pathrag-surface/80 backdrop-blur-sm border border-pathrag-border hover:bg-pathrag-surface-alt transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-pathrag-text" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-pathrag-surface/80 backdrop-blur-sm border border-pathrag-border hover:bg-pathrag-surface-alt transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-pathrag-text" />
            </button>
          </>
        )}

        {/* Landmarks Overlay */}
        {currentAsset.landmarks && currentAsset.landmarks.length > 0 && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex flex-wrap gap-1">
              {currentAsset.landmarks.map((landmark, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-pathrag-accent/20 text-pathrag-accent text-[10px] font-medium rounded"
                >
                  {landmark.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Asset Info */}
      <div className="px-4 py-3 border-t border-pathrag-border">
        <p className="text-sm text-pathrag-text leading-relaxed">
          {currentAsset.alt_text}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] font-medium text-pathrag-text-muted uppercase tracking-wider">
            {currentAsset.vendor}
          </span>
          {currentAsset.firmware && (
            <>
              <span className="text-pathrag-border">•</span>
              <span className="text-[10px] font-medium text-pathrag-text-muted uppercase tracking-wider">
                {currentAsset.firmware}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Thumbnail Strip */}
      {assets.length > 1 && (
        <div className="px-4 py-3 border-t border-pathrag-border">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {assets.map((asset, index) => (
              <button
                key={asset.asset_id}
                onClick={() => setSelectedIndex(index)}
                className={`
                  relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all
                  ${index === selectedIndex 
                    ? 'border-pathrag-accent' 
                    : 'border-transparent hover:border-pathrag-border'
                  }
                `}
              >
                <img
                  src={asset.url || getPlaceholderSvg(asset.alt_text || 'Guide')}
                  alt={asset.alt_text || 'Guide'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getPlaceholderSvg(asset.alt_text || 'Guide');
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Zoom Modal */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setIsZoomed(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={currentAsset.url || getPlaceholderSvg(currentAsset.alt_text || 'Guide')}
                alt={currentAsset.alt_text || 'Guide'}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getPlaceholderSvg(currentAsset.alt_text || 'Guide');
                }}
              />
              <button
                onClick={() => setIsZoomed(false)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-pathrag-surface/80 backdrop-blur-sm border border-pathrag-border hover:bg-pathrag-surface-alt transition-colors"
              >
                <X className="w-5 h-5 text-pathrag-text" />
              </button>
              <div className="absolute bottom-4 left-4 right-4 p-3 bg-pathrag-surface/80 backdrop-blur-sm rounded-lg border border-pathrag-border">
                <p className="text-sm text-pathrag-text">{currentAsset.alt_text || 'Router guide'}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
