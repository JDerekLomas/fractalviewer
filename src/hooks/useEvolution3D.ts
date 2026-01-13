import { useState, useCallback } from 'react';
import { FractalGenome3D } from '../lib/types3d';
import { createInitialPopulation3D } from '../lib/genome3d';
import { evolveGeneration3D } from '../lib/evolution3d';

const POPULATION_SIZE = 16;
const STORAGE_KEY = 'fractal-evolver-3d-state';

interface EvolutionState3D {
  population: FractalGenome3D[];
  generation: number;
  comment: string;
}

function loadState(): EvolutionState3D | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        comment: parsed.comment ?? '',
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

export function useEvolution3D() {
  const [state, setState] = useState<EvolutionState3D>(() => {
    const saved = loadState();
    if (saved) return saved;

    return {
      population: createInitialPopulation3D(POPULATION_SIZE),
      generation: 0,
      comment: '',
    };
  });

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
        populationSize: POPULATION_SIZE,
      });

      const newState = {
        population: newPopulation,
        generation: prev.generation + 1,
        comment: '',
      };
      saveState(newState);
      return newState;
    });
  }, []);

  const reset = useCallback(() => {
    const newState = {
      population: createInitialPopulation3D(POPULATION_SIZE),
      generation: 0,
      comment: '',
    };
    saveState(newState);
    setState(newState);
  }, []);

  return {
    population: state.population,
    generation: state.generation,
    comment: state.comment,
    select,
    reject,
    setComment,
    evolve,
    reset,
  };
}
