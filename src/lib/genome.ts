import { AffineTransform, FractalGenome } from './types';

let idCounter = 0;

function generateId(): string {
  return `fractal-${Date.now()}-${idCounter++}`;
}

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomColor(): [number, number, number] {
  // Generate vibrant colors by using HSL and converting to RGB
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

function createRandomTransform(): AffineTransform {
  // Generate transforms that are more likely to produce interesting fractals
  // Use contractive mappings (determinant < 1) for convergence
  const scale = randomRange(0.2, 0.7);
  const rotation = randomRange(0, Math.PI * 2);
  const shear = randomRange(-0.3, 0.3);

  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  return {
    a: scale * cos + shear * sin,
    b: -scale * sin + shear * cos,
    c: scale * sin,
    d: scale * cos,
    e: randomRange(-1, 1),
    f: randomRange(-1, 1),
    probability: randomRange(0.3, 1),
    color: randomColor(),
  };
}

export function createRandomGenome(generation: number = 0): FractalGenome {
  const numTransforms = Math.floor(randomRange(2, 6));
  const transforms: AffineTransform[] = [];

  for (let i = 0; i < numTransforms; i++) {
    transforms.push(createRandomTransform());
  }

  return {
    id: generateId(),
    transforms,
    generation,
    parentIds: [],
  };
}

export function mutate(genome: FractalGenome, strength: number = 0.15): FractalGenome {
  const transforms = genome.transforms.map(t => {
    const mutated = { ...t, color: [...t.color] as [number, number, number] };

    // Mutate matrix values
    if (Math.random() < 0.7) mutated.a += randomRange(-strength, strength);
    if (Math.random() < 0.7) mutated.b += randomRange(-strength, strength);
    if (Math.random() < 0.7) mutated.c += randomRange(-strength, strength);
    if (Math.random() < 0.7) mutated.d += randomRange(-strength, strength);
    if (Math.random() < 0.5) mutated.e += randomRange(-strength * 2, strength * 2);
    if (Math.random() < 0.5) mutated.f += randomRange(-strength * 2, strength * 2);

    // Occasionally mutate color
    if (Math.random() < 0.2) {
      mutated.color = [
        Math.max(0, Math.min(255, mutated.color[0] + randomRange(-30, 30))),
        Math.max(0, Math.min(255, mutated.color[1] + randomRange(-30, 30))),
        Math.max(0, Math.min(255, mutated.color[2] + randomRange(-30, 30))),
      ];
    }

    // Occasionally mutate probability
    if (Math.random() < 0.3) {
      mutated.probability = Math.max(0.1, mutated.probability + randomRange(-0.2, 0.2));
    }

    return mutated;
  });

  // Occasionally add or remove a transform
  if (Math.random() < 0.1 && transforms.length > 2) {
    transforms.splice(Math.floor(Math.random() * transforms.length), 1);
  } else if (Math.random() < 0.1 && transforms.length < 6) {
    transforms.push(createRandomTransform());
  }

  return {
    id: generateId(),
    transforms,
    generation: genome.generation + 1,
    parentIds: [genome.id],
  };
}

export function crossover(a: FractalGenome, b: FractalGenome): FractalGenome {
  const transforms: AffineTransform[] = [];

  // Take transforms from both parents
  const maxLen = Math.max(a.transforms.length, b.transforms.length);

  for (let i = 0; i < maxLen; i++) {
    const useA = Math.random() < 0.5;

    if (useA && i < a.transforms.length) {
      transforms.push({ ...a.transforms[i], color: [...a.transforms[i].color] as [number, number, number] });
    } else if (!useA && i < b.transforms.length) {
      transforms.push({ ...b.transforms[i], color: [...b.transforms[i].color] as [number, number, number] });
    } else if (i < a.transforms.length) {
      transforms.push({ ...a.transforms[i], color: [...a.transforms[i].color] as [number, number, number] });
    } else if (i < b.transforms.length) {
      transforms.push({ ...b.transforms[i], color: [...b.transforms[i].color] as [number, number, number] });
    }
  }

  // Ensure at least 2 transforms
  while (transforms.length < 2) {
    transforms.push(createRandomTransform());
  }

  return {
    id: generateId(),
    transforms,
    generation: Math.max(a.generation, b.generation) + 1,
    parentIds: [a.id, b.id],
  };
}

// Some classic interesting seeds
export function createSierpinskiLike(): FractalGenome {
  return {
    id: generateId(),
    transforms: [
      { a: 0.5, b: 0, c: 0, d: 0.5, e: 0, f: 0, probability: 1, color: [255, 100, 100] },
      { a: 0.5, b: 0, c: 0, d: 0.5, e: 0.5, f: 0, probability: 1, color: [100, 255, 100] },
      { a: 0.5, b: 0, c: 0, d: 0.5, e: 0.25, f: 0.5, probability: 1, color: [100, 100, 255] },
    ],
    generation: 0,
    parentIds: [],
  };
}

export function createFernLike(): FractalGenome {
  return {
    id: generateId(),
    transforms: [
      { a: 0, b: 0, c: 0, d: 0.16, e: 0, f: 0, probability: 0.01, color: [100, 200, 100] },
      { a: 0.85, b: 0.04, c: -0.04, d: 0.85, e: 0, f: 0.16, probability: 0.85, color: [50, 180, 50] },
      { a: 0.2, b: -0.26, c: 0.23, d: 0.22, e: 0, f: 0.16, probability: 0.07, color: [80, 220, 80] },
      { a: -0.15, b: 0.28, c: 0.26, d: 0.24, e: 0, f: 0.04, probability: 0.07, color: [120, 255, 120] },
    ],
    generation: 0,
    parentIds: [],
  };
}

export function createSpiralLike(): FractalGenome {
  return {
    id: generateId(),
    transforms: [
      { a: 0.7, b: -0.4, c: 0.4, d: 0.7, e: 0.1, f: 0.1, probability: 1, color: [200, 100, 255] },
      { a: 0.5, b: 0.2, c: -0.2, d: 0.5, e: -0.3, f: 0.2, probability: 1, color: [100, 200, 255] },
    ],
    generation: 0,
    parentIds: [],
  };
}

export function createInitialPopulation(size: number): FractalGenome[] {
  const population: FractalGenome[] = [];

  // Include some interesting seeds
  population.push(createSierpinskiLike());
  population.push(createFernLike());
  population.push(createSpiralLike());

  // Fill rest with random
  while (population.length < size) {
    population.push(createRandomGenome());
  }

  return population;
}
