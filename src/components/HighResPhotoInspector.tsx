import React, { useState } from 'react';
import { 
  RefreshCw, 
  Sparkles, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  X
} from 'lucide-react';
import { formatImageUrl } from '../utils/imageUtils';

interface HighResPhotoInspectorProps {
  images: string[];
  title: string;
  serialNumber: string;
  metalPurity: string;
  hasStones: boolean;
  primaryStoneType?: string;
  authenticityHash?: string;
}

export const HighResPhotoInspector: React.FC<HighResPhotoInspectorProps> = ({
  images,
  title,
  serialNumber
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const photoList = images.length > 0 ? images : [''];
  const currentPhoto = photoList[selectedImageIndex] || photoList[0];

  const handlePrevPhoto = () => {
    setSelectedImageIndex(prev => (prev - 1 + photoList.length) % photoList.length);
  };

  const handleNextPhoto = () => {
    setSelectedImageIndex(prev => (prev + 1) % photoList.length);
  };

  return (
    <div 
      className="relative flex flex-col bg-zinc-950 border border-amber-900/40 rounded-2xl overflow-hidden shadow-2xl group"
      id="high-res-photo-inspector-card"
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 bg-zinc-900/90 border-b border-amber-900/30 text-xs">
        <div className="flex items-center gap-2 text-amber-300 font-semibold">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Fotografia em Alta Resolução</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono text-[10px]">
            HD {selectedImageIndex + 1}/{photoList.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Fullscreen Modal Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-300 transition-colors border border-zinc-700"
            title="Expandir Foto em Tela Cheia"
            id="inspector-btn-fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Reset View */}
          <button
            type="button"
            onClick={() => {
              setZoomLevel(1);
            }}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-300 transition-colors border border-zinc-700"
            title="Redefinir Zoom"
            id="inspector-btn-reset"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Display Stage */}
      <div 
        className="relative min-h-[380px] sm:min-h-[460px] flex items-center justify-center bg-radial from-zinc-900 via-zinc-950 to-black select-none overflow-hidden"
        id="high-res-inspector-stage"
      >
        {/* Ambient lighting filter layer */}
        <div className="absolute inset-0 pointer-events-none transition-all duration-500 bg-gradient-to-tr from-amber-500/10 via-transparent to-cyan-400/10 mix-blend-soft-light" />

        {/* Studio pedestal ring simulation */}
        <div className="absolute bottom-6 w-72 h-20 rounded-full bg-gradient-to-t from-amber-500/10 to-transparent blur-md border-t border-amber-500/20 pointer-events-none transform rotate-x-60" />

        {/* Photo Navigation Overlay Arrows */}
        {photoList.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevPhoto}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-zinc-900/80 hover:bg-amber-500 hover:text-zinc-950 text-amber-300 border border-amber-500/40 backdrop-blur-md shadow-xl transition-all"
              title="Foto Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNextPhoto}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-zinc-900/80 hover:bg-amber-500 hover:text-zinc-950 text-amber-300 border border-amber-500/40 backdrop-blur-md shadow-xl transition-all"
              title="Próxima Foto"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Main High-Res Image */}
        <div 
          className="relative transition-transform duration-200 ease-out flex items-center justify-center p-6 w-full h-full"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <img
            src={formatImageUrl(currentPhoto)}
            alt={title}
            className="max-h-[340px] sm:max-h-[410px] w-auto object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)] rounded-xl pointer-events-none"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Control Bar Below */}
      <div className="p-4 bg-zinc-900/90 border-t border-amber-900/30 flex items-center justify-end gap-4 text-xs">

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.max(1, prev - 0.25))}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-amber-300 transition-colors"
            title="Reduzir Zoom"
            id="inspector-zoom-out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 font-mono text-[11px] text-amber-300">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.25))}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-amber-300 transition-colors"
            title="Aumentar Zoom"
            id="inspector-zoom-in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Fullscreen Lightbox Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-200">
          {/* Lightbox Header */}
          <div className="w-full max-w-6xl flex items-center justify-between text-amber-100 pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="font-semibold text-sm sm:text-base">{title}</span>
              <span className="text-xs text-zinc-400 font-mono">({serialNumber})</span>
            </div>
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-amber-300 border border-zinc-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lightbox Stage */}
          <div className="relative flex-1 w-full max-w-5xl flex items-center justify-center p-4">
            <img
              src={formatImageUrl(currentPhoto)}
              alt={title}
              className="max-h-[80vh] max-w-full object-contain drop-shadow-2xl rounded-2xl"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Lightbox Footer Navigation */}
          <div className="w-full max-w-xl flex items-center justify-between gap-4 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={handlePrevPhoto}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-amber-500 hover:text-zinc-950 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-all flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>
            <span className="text-xs font-mono text-amber-200">
              {selectedImageIndex + 1} de {photoList.length}
            </span>
            <button
              type="button"
              onClick={handleNextPhoto}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-amber-500 hover:text-zinc-950 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-all flex items-center gap-1"
            >
              Próxima
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
