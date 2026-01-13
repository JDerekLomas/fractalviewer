import { useState, useCallback } from 'react';
import { FractalGenome } from '../lib/types';
import { createInitialPopulation } from '../lib/genome';
import { evolveGeneration } from '../lib/evolution';

const POPULATION_SIZE = 16;
const STORAGE_KEY = 'fractal-evolver-state';

interface EvolutionState {
  population: FractalGenome[];
  generation: number;
  comment: string;
}

function loadState(): EvolutionState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure comment field exists (migration from old state)
      return {
        ...parsed,
        comment: parsed.comment ?? '',
      };
    }
  } catch (e) {
    console.error('Failed to load state:', e);
  }
  return null;
}

function saveState(state: EvolutionState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

export function useEvolution() {
  const [state, setState] = useState<EvolutionState>(() => {
    const saved = loadState();
    if (saved) return saved;

    return {
      population: createInitialPopulation(POPULATION_SIZE),
      generation: 0,
      comment: '',
    };
  });

  const select = useCallback((id: string) => {
    setState(prev => {
      const genome = prev.population.find(g => g.id === id);
      const newRating: 'up' | undefined = genome?.rating === 'up' ? undefined : 'up';

      const newState: EvolutionState = {
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

      const newState: EvolutionState = {
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
      const newPopulation = evolveGeneration(prev.population, {
        populationSize: POPULATION_SIZE,
      });

      const newState = {
        population: newPopulation,
        generation: prev.generation + 1,
        comment: '', // Clear comment for new generation
      };
      saveState(newState);
      return newState;
    });
  }, []);

  const reset = useCallback(() => {
    const newState = {
      population: createInitialPopulation(POPULATION_SIZE),
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
