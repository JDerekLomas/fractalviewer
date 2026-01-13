import { useState, useCallback } from 'react';
import { FractalGenome3D } from '../lib/types3d';
import { createInitialPopulation3D, generateRandomSeed } from '../lib/genome3d';
import {
  evolveGeneration3D,
  EvolutionConfig3D,
  defaultConfig,
  evolutionPresets,
  getGenerationStats,
  GenerationStats,
} from '../lib/evolution3d';

const POPULATION_SIZE = 16;
const STORAGE_KEY = 'fractal-evolver-3d-state';
const CONFIG_STORAGE_KEY = 'fractal-evolver-3d-config';

interface EvolutionState3D {
  population: FractalGenome3D[];
  generation: number;
  comment: string;
  seed: number;
}

function loadState(): EvolutionState3D | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        comment: parsed.comment ?? '',
        seed: parsed.seed ?? generateRandomSeed(),
      };
    }
  } catch (e) {
    console.error('Failed to load 3D state:', e);
  }
  return null;
}

function saveState(state: EvolutionState3D): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save 3D state:', e);
  }
}

function loadConfig(): Partial<EvolutionConfig3D> {
  try {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load config:', e);
  }
  return {};
}

function saveConfig(config: Partial<EvolutionConfig3D>): void {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save config:', e);
  }
}

export function useEvolution3D() {
  const [state, setState] = useState<EvolutionState3D>(() => {
    const saved = loadState();
    if (saved) return saved;

    const seed = generateRandomSeed();
    return {
      population: createInitialPopulation3D(POPULATION_SIZE, seed),
      generation: 0,
      comment: '',
      seed,
    };
  });

  const [config, setConfigState] = useState<EvolutionConfig3D>(() => ({
    ...defaultConfig,
    ...loadConfig(),
  }));

  const [showConfig, setShowConfig] = useState(false);

  const select = useCallback((id: string) => {
    setState(prev => {
      const genome = prev.population.find(g => g.id === id);
      const newRating: 'up' | undefined = genome?.rating === 'up' ? undefined : 'up';

      const newState: EvolutionState3D = {
        ...prev,
        population: prev.population.map(g =>
          g.id === id ? { ...g, rating: newRating } : g
        ),
      };
      saveState(newState);
      return newState;
    });
  }, []);

  const reject = useCallback((id: string) => {
    setState(prev => {
      const genome = prev.population.find(g => g.id === id);
      const newRating: 'down' | undefined = genome?.rating === 'down' ? undefined : 'down';

      const newState: EvolutionState3D = {
        ...prev,
        population: prev.population.map(g =>
          g.id === id ? { ...g, rating: newRating } : g
        ),
      };
      saveState(newState);
      return newState;
    });
  }, []);

  const setComment = useCallback((comment: string) => {
    setState(prev => {
      const newState = { ...prev, comment };
      saveState(newState);
      return newState;
    });
  }, []);

  const evolve = useCallback(() => {
    setState(prev => {
      const newPopulation = evolveGeneration3D(prev.population, {
        ...config,
        populationSize: POPULATION_SIZE,
      });

      const newState = {
        population: newPopulation,
        generation: prev.generation + 1,
        comment: '',
        seed: prev.seed,
      };
      saveState(newState);
      return newState;
    });
  }, [config]);

  const reset = useCallback((newSeed?: number) => {
    const seed = newSeed ?? generateRandomSeed();
    const newState = {
      population: createInitialPopulation3D(POPULATION_SIZE, seed),
      generation: 0,
      comment: '',
      seed,
    };
    saveState(newState);
    setState(newState);
  }, []);

  const setConfig = useCallback((newConfig: Partial<EvolutionConfig3D>) => {
    setConfigState(prev => {
      const updated = { ...prev, ...newConfig };
      saveConfig(newConfig);
      return updated;
    });
  }, []);

  const applyPreset = useCallback((presetName: string) => {
    const preset = evolutionPresets[presetName];
    if (preset) {
      const updated = { ...defaultConfig, ...preset };
      saveConfig(preset);
      setConfigState(updated);
    }
  }, []);

  const getStats = useCallback((): GenerationStats => {
    return getGenerationStats(state.population);
  }, [state.population]);

  return {
    population: state.population,
    generation: state.generation,
    comment: state.comment,
    seed: state.seed,
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
    getStats,
  };
}
