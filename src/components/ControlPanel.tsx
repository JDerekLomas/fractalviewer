import { useState } from 'react';

interface GenomeWithRating {
  rating?: 'up' | 'down';
}

interface ControlPanelProps {
  population: GenomeWithRating[];
  generation: number;
  seed: number;
  onEvolve: () => void;
  onReset: (seed?: number) => void;
  onOpenSettings?: () => void;
  crossoverType?: string;
  mutationType?: string;
}

export function ControlPanel({
  population,
  generation,
  seed,
  onEvolve,
  onReset,
  onOpenSettings,
  crossoverType,
  mutationType,
}: ControlPanelProps) {
  const selectedCount = population.filter(g => g.rating === 'up').length;
  const [seedInput, setSeedInput] = useState('');
  const [showSeedInput, setShowSeedInput] = useState(false);

  const handleSeedSubmit = () => {
    const parsed = parseInt(seedInput, 10);
    if (!isNaN(parsed)) {
      onReset(parsed);
    }
    setSeedInput('');
    setShowSeedInput(false);
  };

  return (
    <div className="flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800">
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-bold text-white">Fractal Breeder</h1>
        <div className="text-zinc-400 text-sm">
          Generation <span className="text-white font-mono text-lg">{generation}</span>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(seed.toString());
          }}
          className="text-zinc-500 text-xs font-mono hover:text-zinc-300 transition-colors"
          title="Click to copy seed"
        >
          Seed: {seed}
        </button>
        {crossoverType && mutationType && (
          <div className="hidden md:flex items-center gap-2 text-xs">
            <span className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded">
              {crossoverType}
            </span>
            <span className="px-2 py-1 bg-purple-900/50 text-purple-300 rounded">
              {mutationType}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="text-sm text-zinc-400">
          <span className="text-green-400 font-medium">{selectedCount}</span> selected
        </div>

        <button
          onClick={onEvolve}
          disabled={selectedCount === 0}
          className={`
            px-6 py-2 rounded-lg font-medium transition-all
            ${selectedCount > 0
              ? 'bg-green-600 hover:bg-green-500 text-white'
              : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'}
          `}
        >
          Breed Selected
        </button>

        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="px-3 py-2 rounded-lg font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
            title="Evolution Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}

        {showSeedInput ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
              placeholder="Enter seed..."
              className="w-32 px-2 py-1 text-sm bg-zinc-800 border border-zinc-600 rounded text-white font-mono"
              onKeyDown={(e) => e.key === 'Enter' && handleSeedSubmit()}
              autoFocus
            />
            <button
              onClick={handleSeedSubmit}
              className="px-2 py-1 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded"
            >
              Go
            </button>
            <button
              onClick={() => setShowSeedInput(false)}
              className="px-2 py-1 text-sm bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded"
            >
              X
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowSeedInput(true)}
            className="px-3 py-2 rounded-lg font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
            title="Enter a specific seed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
          </button>
        )}

        <button
          onClick={() => onReset()}
          className="px-4 py-2 rounded-lg font-medium bg-zinc-700 hover:bg-zinc-600 text-zinc-300"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
