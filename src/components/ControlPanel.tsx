interface GenomeWithRating {
  rating?: 'up' | 'down';
}

interface ControlPanelProps {
  population: GenomeWithRating[];
  generation: number;
  onEvolve: () => void;
  onReset: () => void;
}

export function ControlPanel({ population, generation, onEvolve, onReset }: ControlPanelProps) {
  const selectedCount = population.filter(g => g.rating === 'up').length;

  return (
    <div className="flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800">
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-bold text-white">Fractal Evolver 3D</h1>
        <div className="text-zinc-400 text-sm">
          Generation <span className="text-white font-mono text-lg">{generation}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
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

        <button
          onClick={onReset}
          className="px-4 py-2 rounded-lg font-medium bg-zinc-700 hover:bg-zinc-600 text-zinc-300"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
