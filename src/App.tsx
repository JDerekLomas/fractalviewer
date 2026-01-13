import { useState } from 'react';
import { FractalGrid3D } from './components/FractalGrid3D';
import { ControlPanel } from './components/ControlPanel';
import { FeedbackPanel3D } from './components/FeedbackPanel3D';
import { ExpandedViewer } from './components/ExpandedViewer';
import { useEvolution3D } from './hooks/useEvolution3D';
import { FractalGenome3D } from './lib/types3d';

function App() {
  const { population, generation, comment, select, reject, setComment, evolve, reset } = useEvolution3D();
  const [expandedGenome, setExpandedGenome] = useState<FractalGenome3D | null>(null);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <ControlPanel
        population={population}
        generation={generation}
        onEvolve={evolve}
        onReset={reset}
      />

      <div className="flex-1 overflow-auto">
        <FractalGrid3D
          population={population}
          onSelect={select}
          onReject={reject}
          onExpand={setExpandedGenome}
        />
      </div>

      <FeedbackPanel3D
        population={population}
        generation={generation}
        comment={comment}
        onCommentChange={setComment}
      />

      <div className="p-2 text-center text-zinc-600 text-xs">
        Click to select • ⛶ to expand • X to reject • Drag to rotate
      </div>

      {expandedGenome && (
        <ExpandedViewer
          genome={expandedGenome}
          onClose={() => setExpandedGenome(null)}
        />
      )}
    </div>
  );
}

export default App;
