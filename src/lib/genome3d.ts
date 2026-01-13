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

// ============================================
// CLASSIC IFS SEED FRACTALS
// Based on Paul Bourke's IFS collection and academic literature
// ============================================

// Sierpinski Tetrahedron - 4 contracting maps to vertices
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

// 3D Barnsley Fern - Extended classic fern with depth
export function createBarnsleyFern3D(): FractalGenome3D {
  return {
    id: generateId(),
    transforms: [
      // Stem
      { m: [0, 0, 0, 0, 0.16, 0, 0, 0, 0], tx: 0, ty: 0, tz: 0, probability: 0.01, color: [60, 100, 40] },
      // Main frond
      { m: [0.85, 0.04, 0, -0.04, 0.85, 0.1, 0, -0.1, 0.85], tx: 0, ty: 1.6, tz: 0, probability: 0.85, color: [34, 139, 34] },
      // Left branch with z-rotation
      { m: [0.2, -0.26, 0.1, 0.23, 0.22, 0, -0.1, 0, 0.2], tx: 0, ty: 1.0, tz: 0.1, probability: 0.07, color: [50, 205, 50] },
      // Right branch with z-rotation
      { m: [-0.15, 0.28, -0.1, 0.26, 0.24, 0, 0.1, 0, 0.2], tx: 0, ty: 0.44, tz: -0.1, probability: 0.07, color: [0, 200, 0] },
    ],
    generation: 0,
    parentIds: [],
  };
}

// Cantor Dust 3D - 8 corner cubes (like 3D Cantor set)
export function createCantorDust3D(): FractalGenome3D {
  const s = 0.33;
  const d = 0.5;
  return {
    id: generateId(),
    transforms: [
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: -d, ty: -d, tz: -d, probability: 1, color: [255, 200, 100] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: d, ty: -d, tz: -d, probability: 1, color: [255, 150, 100] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: -d, ty: d, tz: -d, probability: 1, color: [255, 100, 100] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: d, ty: d, tz: -d, probability: 1, color: [200, 100, 150] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: -d, ty: -d, tz: d, probability: 1, color: [150, 100, 200] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: d, ty: -d, tz: d, probability: 1, color: [100, 100, 255] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: -d, ty: d, tz: d, probability: 1, color: [100, 150, 255] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: d, ty: d, tz: d, probability: 1, color: [100, 200, 255] },
    ],
    generation: 0,
    parentIds: [],
  };
}

// Sierpinski Octahedron - 6 maps to octahedron vertices
export function createOctahedron(): FractalGenome3D {
  const s = 0.5;
  return {
    id: generateId(),
    transforms: [
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: 0, ty: 0.5, tz: 0, probability: 1, color: [255, 50, 50] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: 0, ty: -0.5, tz: 0, probability: 1, color: [50, 255, 50] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: 0.5, ty: 0, tz: 0, probability: 1, color: [50, 50, 255] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: -0.5, ty: 0, tz: 0, probability: 1, color: [255, 255, 50] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: 0, ty: 0, tz: 0.5, probability: 1, color: [50, 255, 255] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: 0, ty: 0, tz: -0.5, probability: 1, color: [255, 50, 255] },
    ],
    generation: 0,
    parentIds: [],
  };
}

// Vicsek Fractal 3D - Cross-shaped fractal
export function createVicsek3D(): FractalGenome3D {
  const s = 0.33;
  return {
    id: generateId(),
    transforms: [
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: 0, ty: 0, tz: 0, probability: 1, color: [255, 255, 255] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: 0.66, ty: 0, tz: 0, probability: 1, color: [255, 100, 100] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: -0.66, ty: 0, tz: 0, probability: 1, color: [100, 255, 100] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: 0, ty: 0.66, tz: 0, probability: 1, color: [100, 100, 255] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: 0, ty: -0.66, tz: 0, probability: 1, color: [255, 255, 100] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: 0, ty: 0, tz: 0.66, probability: 1, color: [100, 255, 255] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: 0, ty: 0, tz: -0.66, probability: 1, color: [255, 100, 255] },
    ],
    generation: 0,
    parentIds: [],
  };
}

// Double Helix (DNA-like spiral)
export function createDoubleHelix(): FractalGenome3D {
  const angle = Math.PI / 6;
  const c = Math.cos(angle), s = Math.sin(angle);
  return {
    id: generateId(),
    transforms: [
      // Helix 1 - rotating climb
      { m: [0.7 * c, -0.7 * s, 0, 0.7 * s, 0.7 * c, 0, 0, 0, 0.7], tx: 0.15, ty: 0, tz: 0.15, probability: 0.5, color: [0, 150, 255] },
      // Helix 2 - opposite rotation
      { m: [0.7 * c, 0.7 * s, 0, -0.7 * s, 0.7 * c, 0, 0, 0, 0.7], tx: -0.15, ty: 0, tz: 0.15, probability: 0.5, color: [255, 100, 150] },
    ],
    generation: 0,
    parentIds: [],
  };
}

// Fractal Flame - Swirl variant (organic, flowing)
export function createFlameSwirl(): FractalGenome3D {
  return {
    id: generateId(),
    transforms: [
      { m: [0.5, -0.4, 0.1, 0.4, 0.5, 0.1, -0.1, -0.1, 0.5], tx: 0.1, ty: 0.1, tz: 0, probability: 0.6, color: [255, 100, 50] },
      { m: [0.4, 0.3, -0.2, -0.3, 0.4, 0.2, 0.2, -0.2, 0.4], tx: -0.2, ty: 0.2, tz: 0.1, probability: 0.4, color: [255, 200, 100] },
      { m: [0.3, 0, 0.3, 0, 0.3, 0, -0.3, 0, 0.3], tx: 0, ty: -0.1, tz: -0.2, probability: 0.3, color: [255, 255, 150] },
    ],
    generation: 0,
    parentIds: [],
  };
}

// Crystal/Icosahedron-like structure
export function createCrystal(): FractalGenome3D {
  const s = 0.4;
  // Normalized icosahedron-like vertices
  return {
    id: generateId(),
    transforms: [
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: 0, ty: 0.5, tz: 0.3, probability: 1, color: [200, 220, 255] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: 0, ty: 0.5, tz: -0.3, probability: 1, color: [180, 200, 255] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: 0.5, ty: 0.3, tz: 0, probability: 1, color: [160, 180, 255] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: -0.5, ty: 0.3, tz: 0, probability: 1, color: [140, 160, 255] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: 0.3, ty: 0, tz: 0.5, probability: 1, color: [120, 140, 255] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: -0.3, ty: 0, tz: 0.5, probability: 1, color: [100, 120, 255] },
    ],
    generation: 0,
    parentIds: [],
  };
}

// Dragon Curve 3D - Classic dragon with z-component
export function createDragon3D(): FractalGenome3D {
  const r = Math.sqrt(2) / 2;
  const angle = Math.PI / 4;
  const c = Math.cos(angle), s = Math.sin(angle);
  return {
    id: generateId(),
    transforms: [
      // Fold 1
      { m: [r * c, -r * s, 0, r * s, r * c, 0, 0, 0, r], tx: 0, ty: 0, tz: 0.1, probability: 0.5, color: [50, 200, 100] },
      // Fold 2 (rotated 135°)
      { m: [-r * c, -r * s, 0, r * s, -r * c, 0, 0, 0, r], tx: 1, ty: 0, tz: -0.1, probability: 0.5, color: [100, 50, 200] },
    ],
    generation: 0,
    parentIds: [],
  };
}

// Koch Snowflake 3D approximation
export function createKoch3D(): FractalGenome3D {
  const s = 0.33;
  return {
    id: generateId(),
    transforms: [
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: -0.33, ty: 0, tz: 0, probability: 1, color: [200, 230, 255] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: 0.33, ty: 0, tz: 0, probability: 1, color: [150, 200, 255] },
      // Peaked transforms with rotation
      { m: [s * 0.866, -s * 0.5, 0, s * 0.5, s * 0.866, 0, 0, 0, s], tx: -0.08, ty: 0.2, tz: 0.15, probability: 1, color: [100, 150, 255] },
      { m: [s * 0.866, s * 0.5, 0, -s * 0.5, s * 0.866, 0, 0, 0, s], tx: 0.08, ty: 0.2, tz: -0.15, probability: 1, color: [50, 100, 255] },
    ],
    generation: 0,
    parentIds: [],
  };
}

// Menger Sponge approximation - 8 edge cubes (simplified)
export function createMengerSponge(): FractalGenome3D {
  const s = 0.33;
  const d = 0.33;
  return {
    id: generateId(),
    transforms: [
      // Corner cubes only (8 of them) - simplified sponge
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: -d, ty: -d, tz: -d, probability: 1, color: [255, 200, 150] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: d, ty: -d, tz: -d, probability: 1, color: [255, 180, 130] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: -d, ty: d, tz: -d, probability: 1, color: [255, 160, 110] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: d, ty: d, tz: -d, probability: 1, color: [255, 140, 90] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: -d, ty: -d, tz: d, probability: 1, color: [255, 120, 70] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: d, ty: -d, tz: d, probability: 1, color: [255, 100, 50] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: -d, ty: d, tz: d, probability: 1, color: [255, 80, 30] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: d, ty: d, tz: d, probability: 1, color: [255, 60, 10] },
      // Edge midpoints (12 of them for fuller sponge)
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: 0, ty: -d, tz: -d, probability: 1, color: [200, 150, 100] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: 0, ty: d, tz: -d, probability: 1, color: [200, 130, 80] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: 0, ty: -d, tz: d, probability: 1, color: [200, 110, 60] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: 0, ty: d, tz: d, probability: 1, color: [200, 90, 40] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: -d, ty: 0, tz: -d, probability: 1, color: [150, 100, 50] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: d, ty: 0, tz: -d, probability: 1, color: [150, 80, 30] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: -d, ty: 0, tz: d, probability: 1, color: [150, 60, 10] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: d, ty: 0, tz: d, probability: 1, color: [130, 50, 0] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: -d, ty: -d, tz: 0, probability: 1, color: [180, 120, 70] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: d, ty: -d, tz: 0, probability: 1, color: [180, 100, 50] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: -d, ty: d, tz: 0, probability: 1, color: [180, 80, 30] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: d, ty: d, tz: 0, probability: 1, color: [180, 60, 10] },
    ],
    generation: 0,
    parentIds: [],
  };
}

// Galaxy Spiral - multiple arms with twist
export function createGalaxySpiral(): FractalGenome3D {
  return {
    id: generateId(),
    transforms: [
      // Core
      { m: [0.3, 0, 0, 0, 0.3, 0, 0, 0, 0.3], tx: 0, ty: 0, tz: 0, probability: 0.2, color: [255, 255, 200] },
      // Arm 1
      { m: [0.7, -0.2, 0, 0.2, 0.7, 0, 0, 0, 0.7], tx: 0.2, ty: 0.1, tz: 0.02, probability: 0.4, color: [150, 100, 255] },
      // Arm 2 (opposite side)
      { m: [0.7, 0.2, 0, -0.2, 0.7, 0, 0, 0, 0.7], tx: -0.2, ty: -0.1, tz: -0.02, probability: 0.4, color: [255, 150, 200] },
    ],
    generation: 0,
    parentIds: [],
  };
}

// Nested Cubes - recursive cube within cube
export function createNestedCubes(): FractalGenome3D {
  const s = 0.45;
  const angle = Math.PI / 8;
  const c = Math.cos(angle), sn = Math.sin(angle);
  return {
    id: generateId(),
    transforms: [
      // Rotated inner cube
      { m: [s * c, -s * sn, 0, s * sn, s * c, 0, 0, 0, s], tx: 0, ty: 0, tz: 0, probability: 0.5, color: [255, 100, 100] },
      // Offset cubes on faces
      { m: [s * 0.4, 0, 0, 0, s * 0.4, 0, 0, 0, s * 0.4], tx: 0.4, ty: 0, tz: 0, probability: 0.2, color: [100, 255, 100] },
      { m: [s * 0.4, 0, 0, 0, s * 0.4, 0, 0, 0, s * 0.4], tx: -0.4, ty: 0, tz: 0, probability: 0.2, color: [100, 100, 255] },
      { m: [s * 0.4, 0, 0, 0, s * 0.4, 0, 0, 0, s * 0.4], tx: 0, ty: 0.4, tz: 0, probability: 0.1, color: [255, 255, 100] },
    ],
    generation: 0,
    parentIds: [],
  };
}

// Apollonian Gasket 3D approximation (nested spheres pattern)
export function createApollonian3D(): FractalGenome3D {
  const s = 0.5;
  return {
    id: generateId(),
    transforms: [
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: 0, ty: 0, tz: 0.4, probability: 1, color: [255, 180, 180] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: 0.35, ty: 0.2, tz: -0.2, probability: 1, color: [180, 255, 180] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: -0.35, ty: 0.2, tz: -0.2, probability: 1, color: [180, 180, 255] },
      { m: [s, 0, 0, 0, s, 0, 0, 0, s], tx: 0, ty: -0.4, tz: -0.2, probability: 1, color: [255, 255, 180] },
      { m: [s * 0.5, 0, 0, 0, s * 0.5, 0, 0, 0, s * 0.5], tx: 0, ty: 0, tz: 0, probability: 0.5, color: [200, 200, 200] },
    ],
    generation: 0,
    parentIds: [],
  };
}

// Fractal Fern Palm - tropical variant
export function createPalmFern(): FractalGenome3D {
  return {
    id: generateId(),
    transforms: [
      // Trunk
      { m: [0.02, 0, 0, 0, 0.5, 0, 0, 0, 0.02], tx: 0, ty: -0.2, tz: 0, probability: 0.05, color: [101, 67, 33] },
      // Main upward growth
      { m: [0.8, 0, 0.05, 0, 0.8, 0, -0.05, 0, 0.8], tx: 0, ty: 0.4, tz: 0, probability: 0.6, color: [34, 139, 34] },
      // Left frond spread
      { m: [0.3, -0.3, 0.1, 0.3, 0.3, 0, -0.1, 0, 0.3], tx: -0.15, ty: 0.5, tz: 0.05, probability: 0.15, color: [50, 205, 50] },
      // Right frond spread
      { m: [0.3, 0.3, -0.1, -0.3, 0.3, 0, 0.1, 0, 0.3], tx: 0.15, ty: 0.5, tz: -0.05, probability: 0.15, color: [60, 179, 60] },
      // Back frond
      { m: [0.3, 0, 0.3, 0, 0.3, 0, -0.3, 0, 0.3], tx: 0, ty: 0.5, tz: 0.15, probability: 0.05, color: [46, 139, 46] },
    ],
    generation: 0,
    parentIds: [],
  };
}

// All available seed fractal generators
const SEED_GENERATORS = [
  createTetrahedronLike,
  createSpiral3D,
  createTree3D,
  createBarnsleyFern3D,
  createCantorDust3D,
  createOctahedron,
  createVicsek3D,
  createDoubleHelix,
  createFlameSwirl,
  createCrystal,
  createDragon3D,
  createKoch3D,
  createMengerSponge,
  createGalaxySpiral,
  createNestedCubes,
  createApollonian3D,
  createPalmFern,
];

export function createInitialPopulation3D(size: number): FractalGenome3D[] {
  const population: FractalGenome3D[] = [];

  // Include a diverse mix of seed fractals
  // Shuffle and pick from available seeds
  const shuffled = [...SEED_GENERATORS].sort(() => Math.random() - 0.5);

  // Add seed fractals (up to half the population)
  const seedCount = Math.min(Math.floor(size / 2), shuffled.length);
  for (let i = 0; i < seedCount; i++) {
    population.push(shuffled[i]());
  }

  // Fill rest with random
  while (population.length < size) {
    population.push(createRandomGenome3D());
  }

  return population;
}

// Get all seed fractals for a fresh start with maximum variety
export function createAllSeedFractals(): FractalGenome3D[] {
  return SEED_GENERATORS.map(gen => gen());
}
