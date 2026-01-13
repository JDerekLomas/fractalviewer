import { useState } from 'react';
import { FractalGrid3D } from './components/FractalGrid3D';
import { ControlPanel } from './components/ControlPanel';
import { FeedbackPanel3D } from './components/FeedbackPanel3D';
import { ConfigPanel } from './components/ConfigPanel';
import { FractalDetailModal } from './components/FractalDetailModal';
import { useEvolution3D } from './hooks/useEvolution3D';
import { FractalGenome3D } from './lib/types3d';

function App() {
  const [detailGenome, setDetailGenome] = useState<FractalGenome3D | null>(null);
  const {
    population,
    generation,
    comment,
    seed,
    config,
    showConfig,
    select,
    reject,
    setComment,
    evolve,
    reset,
    setConfig,
    applyPreset,
    setShowConfig,
  } = useEvolution3D();

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <ControlPanel
        population={population}
        generation={generation}
        seed={seed}
        onEvolve={evolve}
        onReset={reset}
        onOpenSettings={() => setShowConfig(true)}
        crossoverType={config.crossoverType}
        mutationType={config.mutationType}
      />

      <div className="flex-1 overflow-auto">
        <FractalGrid3D
          population={population}
          onSelect={select}
          onReject={reject}
          onViewDetail={(genome) => setDetailGenome(genome)}
        />
      </div>

      <FeedbackPanel3D
        population={population}
        generation={generation}
        comment={comment}
        onCommentChange={setComment}
      />

      <div className="p-2 text-center text-zinc-600 text-xs">
        Click to select. Double-click or magnifier to enlarge. X to reject. Drag to rotate.
      </div>

      {showConfig && (
        <ConfigPanel
          config={config}
          onConfigChange={setConfig}
          onApplyPreset={applyPreset}
          onClose={() => setShowConfig(false)}
        />
      )}

      {detailGenome && (
        <FractalDetailModal
          genome={detailGenome}
          onClose={() => setDetailGenome(null)}
        />
      )}
    </div>
  );
}

export default App;
