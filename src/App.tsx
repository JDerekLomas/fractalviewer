import { FractalGrid3D } from './components/FractalGrid3D';
import { ControlPanel } from './components/ControlPanel';
import { FeedbackPanel3D } from './components/FeedbackPanel3D';
import { useEvolution3D } from './hooks/useEvolution3D';

function App() {
  const { population, generation, comment, select, reject, setComment, evolve, reset } = useEvolution3D();

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
        />
      </div>

      <FeedbackPanel3D
        population={population}
        generation={generation}
        comment={comment}
        onCommentChange={setComment}
      />

      <div className="p-2 text-center text-zinc-600 text-xs">
        Click to select favorites. X to reject. Drag to rotate. Comments and selections export below.
      </div>
    </div>
  );
}

export default App;
