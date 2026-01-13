import { FractalGrid3D } from './components/FractalGrid3D';
import { ControlPanel } from './components/ControlPanel';
import { FeedbackPanel3D } from './components/FeedbackPanel3D';
import { ConfigPanel } from './components/ConfigPanel';
import { useEvolution3D } from './hooks/useEvolution3D';

function App() {
  const {
    population,
    generation,
    comment,
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
        />
      </div>

      <FeedbackPanel3D
        population={population}
        generation={generation}
        comment={comment}
        onCommentChange={setComment}
      />

      <div className="p-2 text-center text-zinc-600 text-xs">
        Click to select favorites. X to reject. Drag to rotate. Click gear icon for evolution settings.
      </div>

      {showConfig && (
        <ConfigPanel
          config={config}
          onConfigChange={setConfig}
          onApplyPreset={applyPreset}
          onClose={() => setShowConfig(false)}
        />
      )}
    </div>
  );
}

export default App;
