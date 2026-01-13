import { FractalGenome3D } from './types3d';
import { mutate3D, crossover3D, createRandomGenome3D } from './genome3d';

export interface EvolutionConfig3D {
  populationSize: number;
  mutationRate: number;
  crossoverRate: number;
  eliteCount: number;
  randomInjection: number;
}

const defaultConfig: EvolutionConfig3D = {
  populationSize: 16,
  mutationRate: 0.8,
  crossoverRate: 0.6,
  eliteCount: 2,
  randomInjection: 1,
};

function selectParent(population: FractalGenome3D[]): FractalGenome3D {
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

export function evolveGeneration3D(
  population: FractalGenome3D[],
  config: Partial<EvolutionConfig3D> = {}
): FractalGenome3D[] {
  const cfg = { ...defaultConfig, ...config };
  const newPopulation: FractalGenome3D[] = [];
  const generation = Math.max(...population.map(g => g.generation)) + 1;

  // Sort by rating for elite selection
  const sorted = [...population].sort((a, b) => {
    const scoreA = a.rating === 'up' ? 2 : a.rating === 'down' ? 0 : 1;
    const scoreB = b.rating === 'up' ? 2 : b.rating === 'down' ? 0 : 1;
    return scoreB - scoreA;
  });

  // Keep elites (mutated slightly)
  for (let i = 0; i < cfg.eliteCount && i < sorted.length; i++) {
    if (sorted[i].rating === 'up') {
      const elite = mutate3D(sorted[i], 0.05);
      elite.generation = generation;
      newPopulation.push(elite);
    }
  }

  // Add random fractals for diversity
  for (let i = 0; i < cfg.randomInjection; i++) {
    newPopulation.push(createRandomGenome3D(generation));
  }

  // Fill rest through breeding
  while (newPopulation.length < cfg.populationSize) {
    const parent1 = selectParent(population);

    if (Math.random() < cfg.crossoverRate) {
      const parent2 = selectParent(population);
      let child = crossover3D(parent1, parent2);

      if (Math.random() < cfg.mutationRate) {
        child = mutate3D(child);
      }
      child.generation = generation;
      newPopulation.push(child);
    } else {
      const child = mutate3D(parent1);
      child.generation = generation;
      newPopulation.push(child);
    }
  }

  return newPopulation;
}
