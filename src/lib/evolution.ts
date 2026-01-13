import { FractalGenome } from './types';
import { mutate, crossover, createRandomGenome } from './genome';

export interface EvolutionConfig {
  populationSize: number;
  mutationRate: number;
  crossoverRate: number;
  eliteCount: number;
  randomInjection: number;
}

const defaultConfig: EvolutionConfig = {
  populationSize: 16,
  mutationRate: 0.8,
  crossoverRate: 0.6,
  eliteCount: 2,
  randomInjection: 1,
};

function selectParent(population: FractalGenome[]): FractalGenome {
  // Weighted selection: thumbs up = 3x weight, neutral = 1x, thumbs down = 0.1x
  const weights = population.map(g => {
    if (g.rating === 'up') return 3;
    if (g.rating === 'down') return 0.1;
    return 1;
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * totalWeight;

  for (let i = 0; i < population.length; i++) {
    r -= weights[i];
    if (r <= 0) return population[i];
  }

  return population[population.length - 1];
}

export function evolveGeneration(
  population: FractalGenome[],
  config: Partial<EvolutionConfig> = {}
): FractalGenome[] {
  const cfg = { ...defaultConfig, ...config };
  const newPopulation: FractalGenome[] = [];
  const generation = Math.max(...population.map(g => g.generation)) + 1;

  // Sort by rating for elite selection
  const sorted = [...population].sort((a, b) => {
    const scoreA = a.rating === 'up' ? 2 : a.rating === 'down' ? 0 : 1;
    const scoreB = b.rating === 'up' ? 2 : b.rating === 'down' ? 0 : 1;
    return scoreB - scoreA;
  });

  // Keep elites (mutated slightly to add variety)
  for (let i = 0; i < cfg.eliteCount && i < sorted.length; i++) {
    if (sorted[i].rating === 'up') {
      const elite = mutate(sorted[i], 0.05); // Light mutation
      elite.generation = generation;
      newPopulation.push(elite);
    }
  }

  // Add some random fractals to maintain diversity
  for (let i = 0; i < cfg.randomInjection; i++) {
    newPopulation.push(createRandomGenome(generation));
  }

  // Fill rest through breeding
  while (newPopulation.length < cfg.populationSize) {
    const parent1 = selectParent(population);

    if (Math.random() < cfg.crossoverRate) {
      // Crossover
      const parent2 = selectParent(population);
      let child = crossover(parent1, parent2);

      if (Math.random() < cfg.mutationRate) {
        child = mutate(child);
      }
      child.generation = generation;
      newPopulation.push(child);
    } else {
      // Mutation only
      const child = mutate(parent1);
      child.generation = generation;
      newPopulation.push(child);
    }
  }

  return newPopulation;
}
