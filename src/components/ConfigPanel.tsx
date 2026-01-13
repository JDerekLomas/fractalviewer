import { EvolutionConfig3D, evolutionPresets, defaultConfig } from '../lib/evolution3d';
import { CrossoverType, MutationType } from '../lib/breeding';

interface ConfigPanelProps {
  config: EvolutionConfig3D;
  onConfigChange: (config: Partial<EvolutionConfig3D>) => void;
  onApplyPreset: (presetName: string) => void;
  onClose: () => void;
}

const CROSSOVER_OPTIONS: { value: CrossoverType; label: string; description: string }[] = [
  { value: 'blend', label: 'Blend', description: 'Smoothly interpolates all parameters between parents (like Electric Sheep)' },
  { value: 'uniform', label: 'Uniform', description: 'Randomly picks whole transforms from each parent' },
  { value: 'parameter', label: 'Parameter', description: 'Each parameter independently chosen from either parent' },
  { value: 'single-point', label: 'Single Point', description: 'Swaps all transforms after a random crossover point' },
];

const MUTATION_OPTIONS: { value: MutationType; label: string; description: string }[] = [
  { value: 'structured', label: 'Structured', description: 'Decompose matrix into rotation/scale/shear, mutate independently' },
  { value: 'random', label: 'Random', description: 'Randomly perturb all matrix values' },
  { value: 'rotation', label: 'Rotation', description: 'Only change orientation, preserve scale' },
  { value: 'scale', label: 'Scale', description: 'Only change size, preserve orientation' },
  { value: 'translation', label: 'Translation', description: 'Only move position in space' },
  { value: 'color', label: 'Color', description: 'Only change colors' },
];

const PRESET_DESCRIPTIONS: Record<string, string> = {
  conservative: 'Slow, careful evolution. Preserves good fractals, minimal random changes.',
  exploratory: 'Fast, wild evolution. High mutation, lots of random injection.',
  balanced: 'Default balanced settings.',
  colorFocused: 'Focuses mutations on colors while preserving structure.',
  structural: 'Emphasizes changes to the number and arrangement of transforms.',
};

export function ConfigPanel({ config, onConfigChange, onApplyPreset, onClose }: ConfigPanelProps) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-zinc-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-700 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Evolution Settings</h2>
            <p className="text-zinc-400 text-sm">Configure how fractals breed and mutate</p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-white"
          >
            Close
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Presets */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-3">Quick Presets</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {Object.keys(evolutionPresets).map(presetName => (
                <button
                  key={presetName}
                  onClick={() => onApplyPreset(presetName)}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white text-sm capitalize transition-colors"
                  title={PRESET_DESCRIPTIONS[presetName]}
                >
                  {presetName}
                </button>
              ))}
            </div>
            <p className="text-zinc-500 text-xs mt-2">Hover for descriptions. Click to apply.</p>
          </section>

          {/* How It Works */}
          <section className="bg-zinc-800/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">How Evolution Works</h3>
            <div className="text-zinc-300 text-sm space-y-2">
              <p>
                <strong className="text-green-400">1. Selection:</strong> Fractals you thumbs-up get 3x higher chance
                of being chosen as parents. Thumbs-down get 0.1x chance.
              </p>
              <p>
                <strong className="text-blue-400">2. Crossover:</strong> Two parents combine their "genetic code"
                (transform matrices) to create offspring. Different crossover types mix genes differently.
              </p>
              <p>
                <strong className="text-purple-400">3. Mutation:</strong> Random changes are applied to offspring.
                This introduces new variations that weren't in either parent.
              </p>
              <p>
                <strong className="text-yellow-400">4. Elitism:</strong> Top-rated fractals are preserved (with slight
                mutations) to ensure good traits aren't lost.
              </p>
            </div>
          </section>

          {/* Crossover Settings */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-3">Crossover (Breeding)</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-zinc-300 text-sm mb-2">Crossover Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {CROSSOVER_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => onConfigChange({ crossoverType: opt.value })}
                      className={`p-3 rounded-lg text-left transition-colors ${
                        config.crossoverType === opt.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      <div className="font-medium">{opt.label}</div>
                      <div className="text-xs opacity-75">{opt.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 text-sm mb-2">
                  Crossover Rate: {Math.round(config.crossoverRate * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.crossoverRate * 100}
                  onChange={e => onConfigChange({ crossoverRate: parseInt(e.target.value) / 100 })}
                  className="w-full accent-blue-500"
                />
                <p className="text-zinc-500 text-xs mt-1">
                  Higher = more offspring from two parents. Lower = more offspring from single parent mutation.
                </p>
              </div>
            </div>
          </section>

          {/* Mutation Settings */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-3">Mutation</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-zinc-300 text-sm mb-2">Mutation Type</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {MUTATION_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => onConfigChange({ mutationType: opt.value })}
                      className={`p-3 rounded-lg text-left transition-colors ${
                        config.mutationType === opt.value
                          ? 'bg-purple-600 text-white'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      <div className="font-medium">{opt.label}</div>
                      <div className="text-xs opacity-75">{opt.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 text-sm mb-2">
                  Mutation Rate: {Math.round(config.mutationRate * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.mutationRate * 100}
                  onChange={e => onConfigChange({ mutationRate: parseInt(e.target.value) / 100 })}
                  className="w-full accent-purple-500"
                />
                <p className="text-zinc-500 text-xs mt-1">
                  Probability that offspring get mutated after crossover.
                </p>
              </div>

              <div>
                <label className="block text-zinc-300 text-sm mb-2">
                  Mutation Strength: {Math.round(config.mutationStrength * 100)}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={config.mutationStrength * 100}
                  onChange={e => onConfigChange({ mutationStrength: parseInt(e.target.value) / 100 })}
                  className="w-full accent-purple-500"
                />
                <p className="text-zinc-500 text-xs mt-1">
                  How much each mutation changes the fractal. Higher = more dramatic changes.
                </p>
              </div>
            </div>
          </section>

          {/* Selection Settings */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-3">Selection & Diversity</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-zinc-300 text-sm mb-2">
                  Elite Count: {config.eliteCount}
                </label>
                <input
                  type="range"
                  min="0"
                  max="8"
                  value={config.eliteCount}
                  onChange={e => onConfigChange({ eliteCount: parseInt(e.target.value) })}
                  className="w-full accent-green-500"
                />
                <p className="text-zinc-500 text-xs mt-1">
                  Top-rated fractals preserved each generation
                </p>
              </div>

              <div>
                <label className="block text-zinc-300 text-sm mb-2">
                  Random Injection: {config.randomInjection}
                </label>
                <input
                  type="range"
                  min="0"
                  max="8"
                  value={config.randomInjection}
                  onChange={e => onConfigChange({ randomInjection: parseInt(e.target.value) })}
                  className="w-full accent-yellow-500"
                />
                <p className="text-zinc-500 text-xs mt-1">
                  New random fractals added each generation
                </p>
              </div>

              <div>
                <label className="block text-zinc-300 text-sm mb-2">
                  Tournament Size: {config.tournamentSize}
                </label>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={config.tournamentSize}
                  onChange={e => onConfigChange({ tournamentSize: parseInt(e.target.value) })}
                  className="w-full accent-orange-500"
                />
                <p className="text-zinc-500 text-xs mt-1">
                  Larger = stronger selection pressure for fit parents
                </p>
              </div>
            </div>
          </section>

          {/* Advanced Settings */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-3">Advanced</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enforceContractivity}
                  onChange={e => onConfigChange({ enforceContractivity: e.target.checked })}
                  className="w-5 h-5 rounded accent-blue-500"
                />
                <div>
                  <div className="text-zinc-300">Enforce Contractivity</div>
                  <div className="text-zinc-500 text-xs">
                    Ensure transforms converge to bounded attractors (prevents NaN/Infinity)
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.allowStructuralMutation}
                  onChange={e => onConfigChange({ allowStructuralMutation: e.target.checked })}
                  className="w-5 h-5 rounded accent-blue-500"
                />
                <div>
                  <div className="text-zinc-300">Allow Structural Mutation</div>
                  <div className="text-zinc-500 text-xs">
                    Randomly add or remove transforms (changes fractal complexity)
                  </div>
                </div>
              </label>

              {config.allowStructuralMutation && (
                <div className="ml-8">
                  <label className="block text-zinc-300 text-sm mb-2">
                    Structural Mutation Rate: {Math.round(config.structuralMutationRate * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={config.structuralMutationRate * 100}
                    onChange={e => onConfigChange({ structuralMutationRate: parseInt(e.target.value) / 100 })}
                    className="w-full accent-blue-500"
                  />
                </div>
              )}
            </div>
          </section>

          {/* Reset to Defaults */}
          <section className="border-t border-zinc-700 pt-4">
            <button
              onClick={() => onConfigChange(defaultConfig)}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-white text-sm"
            >
              Reset to Default Settings
            </button>
          </section>

          {/* IFS Explainer */}
          <section className="bg-zinc-800/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">What is an IFS Fractal?</h3>
            <div className="text-zinc-300 text-sm space-y-2">
              <p>
                An <strong>Iterated Function System (IFS)</strong> fractal is defined by a set of
                <strong> affine transformations</strong> - mathematical functions that scale, rotate,
                shear, and translate points in space.
              </p>
              <p>
                The fractal is generated using the <strong>chaos game</strong>: start with a random point,
                randomly pick a transform, apply it, plot the result, and repeat millions of times.
                The points converge to a unique shape called the <strong>attractor</strong>.
              </p>
              <p>
                Each fractal's "DNA" is its set of transformation matrices. When fractals breed,
                their matrices are combined and mutated to create offspring with traits from both parents.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
