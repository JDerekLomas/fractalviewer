import { AffineTransform3D, FractalGenome3D } from './types3d';

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

function createRotationMatrix(
  angleX: number,
  angleY: number,
  angleZ: number,
  scale: number
): [number, number, number, number, number, number, number, number, number] {
  const cx = Math.cos(angleX), sx = Math.sin(angleX);
  const cy = Math.cos(angleY), sy = Math.sin(angleY);
  const cz = Math.cos(angleZ), sz = Math.sin(angleZ);

  // Combined rotation matrix * scale
  return [
    scale * cy * cz,
    scale * (sx * sy * cz - cx * sz),
    scale * (cx * sy * cz + sx * sz),
    scale * cy * sz,
    scale * (sx * sy * sz + cx * cz),
    scale * (cx * sy * sz - sx * cz),
    scale * -sy,
    scale * sx * cy,
    scale * cx * cy,
  ];
}

function createRandomTransform3D(): AffineTransform3D {
  const scale = randomRange(0.2, 0.6);
  const angleX = randomRange(0, Math.PI * 2);
  const angleY = randomRange(0, Math.PI * 2);
  const angleZ = randomRange(0, Math.PI * 2);

  // Add some shear for variety
  const m = createRotationMatrix(angleX, angleY, angleZ, scale);

  // Apply random shear
  const shear = randomRange(-0.2, 0.2);
  m[1] += shear;
  m[3] += shear;

  return {
    m,
    tx: randomRange(-0.5, 0.5),
    ty: randomRange(-0.5, 0.5),
    tz: randomRange(-0.5, 0.5),
    probability: randomRange(0.3, 1),
    color: randomColor(),
  };
}

export function createRandomGenome3D(generation: number = 0): FractalGenome3D {
  const numTransforms = Math.floor(randomRange(3, 7));
  const transforms: AffineTransform3D[] = [];

  for (let i = 0; i < numTransforms; i++) {
    transforms.push(createRandomTransform3D());
  }

  return {
    id: generateId(),
    transforms,
    generation,
    parentIds: [],
  };
}

export function mutate3D(genome: FractalGenome3D, strength: number = 0.12): FractalGenome3D {
  const transforms = genome.transforms.map(t => {
    const mutated: AffineTransform3D = {
      ...t,
      m: [...t.m] as AffineTransform3D['m'],
      color: [...t.color] as [number, number, number],
    };

    // Mutate matrix values
    for (let i = 0; i < 9; i++) {
      if (Math.random() < 0.5) {
        mutated.m[i] += randomRange(-strength, strength);
      }
    }

    // Mutate translation
    if (Math.random() < 0.4) mutated.tx += randomRange(-strength * 2, strength * 2);
    if (Math.random() < 0.4) mutated.ty += randomRange(-strength * 2, strength * 2);
    if (Math.random() < 0.4) mutated.tz += randomRange(-strength * 2, strength * 2);

    // Occasionally mutate color
    if (Math.random() < 0.2) {
      mutated.color = [
        Math.max(0, Math.min(255, mutated.color[0] + randomRange(-40, 40))),
        Math.max(0, Math.min(255, mutated.color[1] + randomRange(-40, 40))),
        Math.max(0, Math.min(255, mutated.color[2] + randomRange(-40, 40))),
      ];
    }

    // Occasionally mutate probability
    if (Math.random() < 0.3) {
      mutated.probability = Math.max(0.1, mutated.probability + randomRange(-0.2, 0.2));
    }

    return mutated;
  });

  // Occasionally add or remove a transform
  if (Math.random() < 0.08 && transforms.length > 2) {
    transforms.splice(Math.floor(Math.random() * transforms.length), 1);
  } else if (Math.random() < 0.08 && transforms.length < 8) {
    transforms.push(createRandomTransform3D());
  }

  return {
    id: generateId(),
    transforms,
    generation: genome.generation + 1,
    parentIds: [genome.id],
  };
}

export function crossover3D(a: FractalGenome3D, b: FractalGenome3D): FractalGenome3D {
  const transforms: AffineTransform3D[] = [];
  const maxLen = Math.max(a.transforms.length, b.transforms.length);

  for (let i = 0; i < maxLen; i++) {
    const useA = Math.random() < 0.5;

    if (useA && i < a.transforms.length) {
      const t = a.transforms[i];
      transforms.push({
        ...t,
        m: [...t.m] as AffineTransform3D['m'],
        color: [...t.color] as [number, number, number],
      });
    } else if (!useA && i < b.transforms.length) {
      const t = b.transforms[i];
      transforms.push({
        ...t,
        m: [...t.m] as AffineTransform3D['m'],
        color: [...t.color] as [number, number, number],
      });
    } else if (i < a.transforms.length) {
      const t = a.transforms[i];
      transforms.push({
        ...t,
        m: [...t.m] as AffineTransform3D['m'],
        color: [...t.color] as [number, number, number],
      });
    } else if (i < b.transforms.length) {
      const t = b.transforms[i];
      transforms.push({
        ...t,
        m: [...t.m] as AffineTransform3D['m'],
        color: [...t.color] as [number, number, number],
      });
    }
  }

  while (transforms.length < 2) {
    transforms.push(createRandomTransform3D());
  }

  return {
    id: generateId(),
    transforms,
    generation: Math.max(a.generation, b.generation) + 1,
    parentIds: [a.id, b.id],
  };
}

// Interesting 3D seeds
export function createTetrahedronLike(): FractalGenome3D {
  const s = 0.5;
  return {
    id: generateId(),
    transforms: [
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: 0, ty: 0, tz: 0.5, probability: 1, color: [255, 100, 100] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: 0.47, ty: 0, tz: -0.17, probability: 1, color: [100, 255, 100] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: -0.24, ty: 0.41, tz: -0.17, probability: 1, color: [100, 100, 255] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: -0.24, ty: -0.41, tz: -0.17, probability: 1, color: [255, 255, 100] },
    ],
    generation: 0,
    parentIds: [],
  };
}

export function createSpiral3D(): FractalGenome3D {
  return {
    id: generateId(),
    transforms: [
      { m: [0.6, -0.3, 0, 0.3, 0.6, 0, 0, 0, 0.6], tx: 0.1, ty: 0.1, tz: 0.2, probability: 1, color: [200, 100, 255] },
      { m: [0.5, 0, 0.2, 0, 0.5, 0.1, -0.2, -0.1, 0.5], tx: -0.2, ty: 0.1, tz: -0.1, probability: 1, color: [100, 200, 255] },
    ],
    generation: 0,
    parentIds: [],
  };
}

export function createTree3D(): FractalGenome3D {
  return {
    id: generateId(),
    transforms: [
      { m: [0.05, 0, 0, 0, 0.6, 0, 0, 0, 0.05], tx: 0, ty: 0, tz: 0, probability: 0.1, color: [139, 90, 43] },
      { m: [0.45, -0.35, 0, 0.35, 0.45, 0, 0, 0, 0.45], tx: 0, ty: 0.4, tz: 0, probability: 0.35, color: [50, 180, 50] },
      { m: [0.45, 0.35, 0, -0.35, 0.45, 0, 0, 0, 0.45], tx: 0, ty: 0.4, tz: 0, probability: 0.35, color: [80, 200, 80] },
      { m: [0.45, 0, 0.35, 0, 0.45, 0, -0.35, 0, 0.45], tx: 0, ty: 0.4, tz: 0, probability: 0.2, color: [60, 220, 60] },
    ],
    generation: 0,
    parentIds: [],
  };
}

export function createInitialPopulation3D(size: number): FractalGenome3D[] {
  const population: FractalGenome3D[] = [];

  // Include interesting seeds
  population.push(createTetrahedronLike());
  population.push(createSpiral3D());
  population.push(createTree3D());

  // Fill rest with random
  while (population.length < size) {
    population.push(createRandomGenome3D());
  }

  return population;
}
