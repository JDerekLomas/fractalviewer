import { useEffect, useRef } from 'react';
import { FractalGenome } from '../lib/types';
import { renderFractal } from '../lib/ifs';

interface FractalCardProps {
  genome: FractalGenome;
  index: number;
  onSelect: (id: string) => void;
  onReject: (id: string) => void;
  size?: number;
}

export function FractalCard({ genome, index, onSelect, onReject, size = 180 }: FractalCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      renderFractal(genome, canvasRef.current, {
        width: size,
        height: size,
        iterations: 40000,
      });
    }
  }, [genome, size]);

  const isSelected = genome.rating === 'up';
  const isRejected = genome.rating === 'down';

  return (
    <div className="relative group">
      {/* Index number */}
      <div className="absolute top-2 left-2 z-10 w-6 h-6 rounded bg-black/60 text-zinc-400 text-xs flex items-center justify-center font-mono">
        {index + 1}
      </div>

      {/* Reject button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onReject(genome.id);
        }}
        className={`
          absolute top-2 right-2 z-10 w-6 h-6 rounded text-xs flex items-center justify-center
          transition-all
          ${isRejected
            ? 'bg-red-500 text-white'
            : 'bg-black/60 text-zinc-500 opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:text-white'}
        `}
        title="Thumbs down"
      >
        X
      </button>

      {/* Main clickable area */}
      <div
        onClick={() => onSelect(genome.id)}
        className={`
          cursor-pointer rounded-lg overflow-hidden border-4 transition-all
          ${isSelected ? 'border-green-500 shadow-lg shadow-green-500/40 scale-105' : ''}
          ${isRejected ? 'border-red-500/30 opacity-40 grayscale' : ''}
          ${!isSelected && !isRejected ? 'border-transparent hover:border-zinc-600' : ''}
        `}
      >
        <canvas
          ref={canvasRef}
          className="bg-zinc-900"
          style={{ width: size, height: size }}
        />
      </div>

      {/* Selected checkmark */}
      {isSelected && (
        <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-lg font-bold">
          ✓
        </div>
      )}
    </div>
  );
}
