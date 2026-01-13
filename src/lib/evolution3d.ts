import { FractalGenome3D } from './types3d';
import { createRandomGenome3D } from './genome3d';
import {
  CrossoverType,
  MutationType,
  crossover,
  mutateTransform,
  calculateFitness,
  enforceContractivity,
} from './breeding';
import { AffineTransform3D } from './types3d';

// ============================================
// EVOLUTION CONFIGURATION
// ============================================

export interface EvolutionConfig3D {
  // Population settings
  populationSize: number;

  // Mutation settings
  mutationRate: number;        // Probability of mutation after crossover
  mutationStrength: number;    // How much to mutate (0-1)
  mutationType: MutationType;  // Type of mutation operator

  // Crossover settings
  crossoverRate: number;       // Probability of crossover vs pure mutation
  crossoverType: CrossoverType; // Type of crossover operator

  // Selection settings
  eliteCount: number;          // Number of top-rated to preserve
  randomInjection: number;     // Number of random fractals per generation
  tournamentSize: number;      // Size of tournament for selection

  // Advanced settings
  enforceContractivity: boolean;  // Ensure transforms converge
  allowStructuralMutation: boolean; // Allow adding/removing transforms
  structuralMutationRate: number;   // Rate of adding/removing transforms
}

export const defaultConfig: EvolutionConfig3D = {
  populationSize: 16,
  mutationRate: 0.8,
  mutationStrength: 0.12,
  mutationType: 'structured',
  crossoverRate: 0.6,
  crossoverType: 'blend',
  eliteCount: 2,
  randomInjection: 1,
  tournamentSize: 3,
  enforceContractivity: true,
  allowStructuralMutation: true,
  structuralMutationRate: 0.08,
};

// Preset configurations for different evolution styles
export const evolutionPresets: Record<string, Partial<EvolutionConfig3D>> = {
  conservative: {
    mutationRate: 0.5,
    mutationStrength: 0.08,
    crossoverType: 'blend',
    eliteCount: 4,
    randomInjection: 0,
    structuralMutationRate: 0.02,
  },
  exploratory: {
    mutationRate: 0.95,
    mutationStrength: 0.2,
    crossoverType: 'parameter',
    eliteCount: 1,
    randomInjection: 3,
    structuralMutationRate: 0.15,
  },
  balanced: {
    ...defaultConfig,
  },
  colorFocused: {
    mutationRate: 0.9,
    mutationType: 'color',
    mutationStrength: 0.3,
    crossoverType: 'blend',
    structuralMutationRate: 0.02,
  },
  structural: {
    mutationRate: 0.7,
    mutationType: 'structured',
    crossoverType: 'single-point',
    structuralMutationRate: 0.2,
    randomInjection: 2,
  },
};

// ============================================
// SELECTION OPERATORS
// ============================================

/**
 * Fitness-proportionate selection (roulette wheel)
 */
function fitnessProportionateSelect(population: FractalGenome3D[]): FractalGenome3D {
  const fitnesses = population.map(g => calculateFitness(g));
  const totalFitness = fitnesses.reduce((a, b) => a + b, 0);

  let r = Math.random() * totalFitness;
  for (let i = 0; i < population.length; i++) {
    r -= fitnesses[i];
    if (r <= 0) return population[i];
  }

  return population[population.length - 1];
}

/**
 * Tournament selection - pick best from random subset
 */
function tournamentSelect(
  population: FractalGenome3D[],
  tournamentSize: number = 3
): FractalGenome3D {
  const tournament: FractalGenome3D[] = [];

  for (let i = 0; i < tournamentSize; i++) {
    const idx = Math.floor(Math.random() * population.length);
    tournament.push(population[idx]);
  }

  // Return the fittest in the tournament
  return tournament.reduce((best, current) =>
    calculateFitness(current) > calculateFitness(best) ? current : best
  );
}

/**
 * Select a parent using the configured method
 */
function selectParent(
  population: FractalGenome3D[],
  config: EvolutionConfig3D
): FractalGenome3D {
  if (config.tournamentSize > 1) {
    return tournamentSelect(population, config.tournamentSize);
  }
  return fitnessProportionateSelect(population);
}

// ============================================
// GENOME MUTATION
// ============================================

let idCounter = 0;

function generateId(): string {
  return `fractal3d-${Date.now()}-${idCounter++}`;
}

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomColor(): [number, number, number] {
  const h = Math.random() * 360;
  const s = randomRange(0.6, 1);
  const l = randomRange(0.4, 0.7);

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

function createRandomTransform(): AffineTransform3D {
  const scale = randomRange(0.2, 0.6);
  const angleX = randomRange(0, Math.PI * 2);
  const angleY = randomRange(0, Math.PI * 2);
  const angleZ = randomRange(0, Math.PI * 2);

  const cx = Math.cos(angleX), sx = Math.sin(angleX);
  const cy = Math.cos(angleY), sy = Math.sin(angleY);
  const cz = Math.cos(angleZ), sz = Math.sin(angleZ);

  return {
    m: [
      scale * cy * cz,
      scale * (sx * sy * cz - cx * sz),
      scale * (cx * sy * cz + sx * sz),
      scale * cy * sz,
      scale * (sx * sy * sz + cx * cz),
      scale * (cx * sy * sz - sx * cz),
      scale * -sy,
      scale * sx * cy,
      scale * cx * cy,
    ],
    tx: randomRange(-0.5, 0.5),
    ty: randomRange(-0.5, 0.5),
    tz: randomRange(-0.5, 0.5),
    probability: randomRange(0.3, 1),
    color: randomColor(),
  };
}

/**
 * Mutate an entire genome
 */
export function mutateGenome(
  genome: FractalGenome3D,
  config: EvolutionConfig3D
): FractalGenome3D {
  let transforms = genome.transforms.map(t =>
    mutateTransform(t, config.mutationType, config.mutationStrength)
  );

  // Enforce contractivity if enabled
  if (config.enforceContractivity) {
    transforms = transforms.map(t => ({
      ...t,
      m: enforceContractivity(t.m, 0.85) as AffineTransform3D['m'],
    }));
  }

  // Structural mutations (add/remove transforms)
  if (config.allowStructuralMutation) {
    if (Math.random() < config.structuralMutationRate && transforms.length > 2) {
      // Remove a random transform
      const idx = Math.floor(Math.random() * transforms.length);
      transforms.splice(idx, 1);
    } else if (Math.random() < config.structuralMutationRate && transforms.length < 8) {
      // Add a new transform
      transforms.push(createRandomTransform());
    }
  }

  return {
    id: generateId(),
    transforms,
    generation: genome.generation + 1,
    parentIds: [genome.id],
  };
}

// ============================================
// MAIN EVOLUTION FUNCTION
// ============================================

export function evolveGeneration3D(
  population: FractalGenome3D[],
  config: Partial<EvolutionConfig3D> = {}
): FractalGenome3D[] {
  const cfg = { ...defaultConfig, ...config };
  const newPopulation: FractalGenome3D[] = [];
  const generation = Math.max(...population.map(g => g.generation)) + 1;

  // Sort by fitness for elite selection
  const sorted = [...population].sort((a, b) =>
    calculateFitness(b) - calculateFitness(a)
  );

  // Keep elites (slightly mutated to maintain diversity)
  for (let i = 0; i < cfg.eliteCount && i < sorted.length; i++) {
    if (sorted[i].rating === 'up') {
      const elite = mutateGenome(sorted[i], {
        ...cfg,
        mutationStrength: cfg.mutationStrength * 0.3, // Light mutation for elites
        structuralMutationRate: 0, // No structural changes for elites
      });
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
    const parent1 = selectParent(population, cfg);

    if (Math.random() < cfg.crossoverRate) {
      // Crossover + mutation
      const parent2 = selectParent(population, cfg);
      let childTransforms = crossover(parent1, parent2, cfg.crossoverType);

      // Enforce contractivity after crossover
      if (cfg.enforceContractivity) {
        childTransforms = childTransforms.map(t => ({
          ...t,
          m: enforceContractivity(t.m, 0.85) as AffineTransform3D['m'],
        }));
      }

      let child: FractalGenome3D = {
        id: generateId(),
        transforms: childTransforms,
        generation,
        parentIds: [parent1.id, parent2.id],
      };

      // Apply mutation
      if (Math.random() < cfg.mutationRate) {
        child = mutateGenome(child, cfg);
        child.generation = generation;
      }

      newPopulation.push(child);
    } else {
      // Pure mutation (no crossover)
      const child = mutateGenome(parent1, cfg);
      child.generation = generation;
      newPopulation.push(child);
    }
  }

  return newPopulation;
}

// ============================================
// EVOLUTION STATISTICS
// ============================================

export interface GenerationStats {
  generation: number;
  upvoted: number;
  downvoted: number;
  neutral: number;
  avgTransforms: number;
  avgContractivity: number;
  fitnessRange: { min: number; max: number; avg: number };
}

export function getGenerationStats(population: FractalGenome3D[]): GenerationStats {
  const fitnesses = population.map(g => calculateFitness(g));
  const transformCounts = population.map(g => g.transforms.length);

  return {
    generation: Math.max(...population.map(g => g.generation)),
    upvoted: population.filter(g => g.rating === 'up').length,
    downvoted: population.filter(g => g.rating === 'down').length,
    neutral: population.filter(g => !g.rating).length,
    avgTransforms: transformCounts.reduce((a, b) => a + b, 0) / transformCounts.length,
    avgContractivity: 0, // TODO: calculate from transforms
    fitnessRange: {
      min: Math.min(...fitnesses),
      max: Math.max(...fitnesses),
      avg: fitnesses.reduce((a, b) => a + b, 0) / fitnesses.length,
    },
  };
}
