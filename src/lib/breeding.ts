/**
 * Enhanced Breeding Algorithms for IFS Fractals
 *
 * Based on research from:
 * - Electric Sheep (Scott Draves) - aesthetic evolution with interpolation
 * - Karl Sims - evolved virtual creatures
 * - Fractal Flame Algorithm - parameter blending
 * - IFS theory - contractivity constraints
 */

import { AffineTransform3D, FractalGenome3D } from './types3d';

// ============================================
// CONTRACTIVITY & VALIDITY CHECKS
// ============================================

/**
 * Calculate the spectral radius (largest eigenvalue magnitude) of a 3x3 matrix
 * For contractivity, this should be < 1
 */
export function spectralRadius(m: number[]): number {
  // For a 3x3 matrix, we use Frobenius norm as an upper bound
  // (simpler than computing actual eigenvalues)
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += m[i] * m[i];
  }
  return Math.sqrt(sum / 3); // Approximate spectral radius
}

/**
 * Calculate the determinant of a 3x3 matrix
 */
export function determinant3x3(m: number[]): number {
  return (
    m[0] * (m[4] * m[8] - m[5] * m[7]) -
    m[1] * (m[3] * m[8] - m[5] * m[6]) +
    m[2] * (m[3] * m[7] - m[4] * m[6])
  );
}

/**
 * Check if a transform is contractive (will converge to bounded attractor)
 */
export function isContractive(t: AffineTransform3D, maxContractivity = 0.95): boolean {
  const sr = spectralRadius(t.m);
  const det = Math.abs(determinant3x3(t.m));
  return sr < maxContractivity && det < maxContractivity;
}

/**
 * Enforce contractivity by scaling down the matrix if needed
 */
export function enforceContractivity(
  m: number[],
  maxContractivity = 0.85
): number[] {
  const sr = spectralRadius(m);
  if (sr > maxContractivity) {
    const scale = maxContractivity / sr;
    return m.map(v => v * scale);
  }
  return m;
}

// ============================================
// MATRIX DECOMPOSITION & RECONSTRUCTION
// ============================================

/**
 * Decompose a 3x3 matrix into rotation angles, scale, and shear
 * This allows structured mutations that preserve mathematical properties
 */
export function decomposeMatrix(m: number[]): {
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  shearXY: number;
  shearXZ: number;
  shearYZ: number;
} {
  // Simplified decomposition using SVD-like approach
  const scaleX = Math.sqrt(m[0] * m[0] + m[3] * m[3] + m[6] * m[6]);
  const scaleY = Math.sqrt(m[1] * m[1] + m[4] * m[4] + m[7] * m[7]);
  const scaleZ = Math.sqrt(m[2] * m[2] + m[5] * m[5] + m[8] * m[8]);

  // Extract rotation (simplified - assumes small shear)
  const rotationY = Math.asin(-m[6] / (scaleX || 1));
  const rotationX = Math.atan2(m[7] / (scaleY || 1), m[8] / (scaleZ || 1));
  const rotationZ = Math.atan2(m[3] / (scaleX || 1), m[0] / (scaleX || 1));

  // Approximate shear components
  const shearXY = m[1] / (scaleY || 1) - Math.sin(rotationZ);
  const shearXZ = m[2] / (scaleZ || 1);
  const shearYZ = m[5] / (scaleZ || 1);

  return {
    scaleX, scaleY, scaleZ,
    rotationX, rotationY, rotationZ,
    shearXY, shearXZ, shearYZ,
  };
}

/**
 * Reconstruct a matrix from decomposed components
 */
export function reconstructMatrix(params: {
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  shearXY: number;
  shearXZ: number;
  shearYZ: number;
}): number[] {
  const { scaleX, scaleY, scaleZ, rotationX, rotationY, rotationZ, shearXY, shearXZ, shearYZ } = params;

  const cx = Math.cos(rotationX), sx = Math.sin(rotationX);
  const cy = Math.cos(rotationY), sy = Math.sin(rotationY);
  const cz = Math.cos(rotationZ), sz = Math.sin(rotationZ);

  // Rotation matrix
  const r = [
    cy * cz, -cy * sz, sy,
    sx * sy * cz + cx * sz, -sx * sy * sz + cx * cz, -sx * cy,
    -cx * sy * cz + sx * sz, cx * sy * sz + sx * cz, cx * cy,
  ];

  // Apply scale and shear
  return [
    r[0] * scaleX,
    r[1] * scaleY + shearXY * scaleY,
    r[2] * scaleZ + shearXZ * scaleZ,
    r[3] * scaleX,
    r[4] * scaleY,
    r[5] * scaleZ + shearYZ * scaleZ,
    r[6] * scaleX,
    r[7] * scaleY,
    r[8] * scaleZ,
  ];
}

// ============================================
// CROSSOVER OPERATORS
// ============================================

export type CrossoverType = 'uniform' | 'blend' | 'parameter' | 'single-point';

/**
 * Uniform crossover - randomly pick whole transforms from each parent
 * (Our original approach)
 */
export function uniformCrossover(
  a: AffineTransform3D[],
  b: AffineTransform3D[]
): AffineTransform3D[] {
  const result: AffineTransform3D[] = [];
  const maxLen = Math.max(a.length, b.length);

  for (let i = 0; i < maxLen; i++) {
    const useA = Math.random() < 0.5;
    const source = useA && i < a.length ? a[i] :
                   !useA && i < b.length ? b[i] :
                   i < a.length ? a[i] : b[i];

    if (source) {
      result.push({
        ...source,
        m: [...source.m] as AffineTransform3D['m'],
        color: [...source.color] as [number, number, number],
      });
    }
  }

  return result;
}

/**
 * Blend crossover - interpolate parameters between parents
 * Inspired by Electric Sheep's smooth transitions
 */
export function blendCrossover(
  a: AffineTransform3D[],
  b: AffineTransform3D[],
  blendFactor?: number
): AffineTransform3D[] {
  const result: AffineTransform3D[] = [];
  const maxLen = Math.max(a.length, b.length);
  const alpha = blendFactor ?? Math.random();

  for (let i = 0; i < maxLen; i++) {
    const tA = i < a.length ? a[i] : null;
    const tB = i < b.length ? b[i] : null;

    if (tA && tB) {
      // Interpolate all parameters
      result.push({
        m: tA.m.map((v, j) => v * alpha + tB.m[j] * (1 - alpha)) as AffineTransform3D['m'],
        tx: tA.tx * alpha + tB.tx * (1 - alpha),
        ty: tA.ty * alpha + tB.ty * (1 - alpha),
        tz: tA.tz * alpha + tB.tz * (1 - alpha),
        probability: tA.probability * alpha + tB.probability * (1 - alpha),
        color: [
          Math.round(tA.color[0] * alpha + tB.color[0] * (1 - alpha)),
          Math.round(tA.color[1] * alpha + tB.color[1] * (1 - alpha)),
          Math.round(tA.color[2] * alpha + tB.color[2] * (1 - alpha)),
        ],
      });
    } else {
      // Phase in/out transforms (like Fractal Flames)
      const source = tA || tB!;
      const fadeAlpha = tA ? alpha : (1 - alpha);
      result.push({
        ...source,
        m: [...source.m] as AffineTransform3D['m'],
        color: [...source.color] as [number, number, number],
        probability: source.probability * fadeAlpha, // Fade probability
      });
    }
  }

  return result;
}

/**
 * Parameter-level crossover - each parameter independently from either parent
 * More genetic diversity than uniform crossover
 */
export function parameterCrossover(
  a: AffineTransform3D[],
  b: AffineTransform3D[]
): AffineTransform3D[] {
  const result: AffineTransform3D[] = [];
  const maxLen = Math.max(a.length, b.length);

  for (let i = 0; i < maxLen; i++) {
    const tA = i < a.length ? a[i] : null;
    const tB = i < b.length ? b[i] : null;

    if (tA && tB) {
      result.push({
        m: tA.m.map((v, j) => Math.random() < 0.5 ? v : tB.m[j]) as AffineTransform3D['m'],
        tx: Math.random() < 0.5 ? tA.tx : tB.tx,
        ty: Math.random() < 0.5 ? tA.ty : tB.ty,
        tz: Math.random() < 0.5 ? tA.tz : tB.tz,
        probability: Math.random() < 0.5 ? tA.probability : tB.probability,
        color: [
          Math.random() < 0.5 ? tA.color[0] : tB.color[0],
          Math.random() < 0.5 ? tA.color[1] : tB.color[1],
          Math.random() < 0.5 ? tA.color[2] : tB.color[2],
        ],
      });
    } else {
      const source = tA || tB!;
      result.push({
        ...source,
        m: [...source.m] as AffineTransform3D['m'],
        color: [...source.color] as [number, number, number],
      });
    }
  }

  return result;
}

/**
 * Single-point crossover - swap all transforms after a random index
 */
export function singlePointCrossover(
  a: AffineTransform3D[],
  b: AffineTransform3D[]
): AffineTransform3D[] {
  const minLen = Math.min(a.length, b.length);
  const crossPoint = Math.floor(Math.random() * minLen);

  const result: AffineTransform3D[] = [];

  // Take from parent A before crossover point
  for (let i = 0; i < crossPoint; i++) {
    result.push({
      ...a[i],
      m: [...a[i].m] as AffineTransform3D['m'],
      color: [...a[i].color] as [number, number, number],
    });
  }

  // Take from parent B after crossover point
  for (let i = crossPoint; i < b.length; i++) {
    result.push({
      ...b[i],
      m: [...b[i].m] as AffineTransform3D['m'],
      color: [...b[i].color] as [number, number, number],
    });
  }

  return result;
}

/**
 * Perform crossover using the specified type
 */
export function crossover(
  a: FractalGenome3D,
  b: FractalGenome3D,
  type: CrossoverType = 'blend'
): AffineTransform3D[] {
  switch (type) {
    case 'uniform':
      return uniformCrossover(a.transforms, b.transforms);
    case 'blend':
      return blendCrossover(a.transforms, b.transforms);
    case 'parameter':
      return parameterCrossover(a.transforms, b.transforms);
    case 'single-point':
      return singlePointCrossover(a.transforms, b.transforms);
    default:
      return blendCrossover(a.transforms, b.transforms);
  }
}

// ============================================
// MUTATION OPERATORS
// ============================================

export type MutationType = 'random' | 'structured' | 'rotation' | 'scale' | 'translation' | 'color';

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Random mutation - perturb all parameters randomly
 * (Our original approach, with contractivity enforcement)
 */
export function randomMutation(
  t: AffineTransform3D,
  strength: number = 0.12
): AffineTransform3D {
  let m = [...t.m] as AffineTransform3D['m'];

  // Mutate matrix values
  for (let i = 0; i < 9; i++) {
    if (Math.random() < 0.5) {
      m[i] += randomRange(-strength, strength);
    }
  }

  // Enforce contractivity
  m = enforceContractivity(m, 0.85) as AffineTransform3D['m'];

  return {
    m,
    tx: t.tx + (Math.random() < 0.4 ? randomRange(-strength * 2, strength * 2) : 0),
    ty: t.ty + (Math.random() < 0.4 ? randomRange(-strength * 2, strength * 2) : 0),
    tz: t.tz + (Math.random() < 0.4 ? randomRange(-strength * 2, strength * 2) : 0),
    probability: Math.max(0.1, t.probability + (Math.random() < 0.3 ? randomRange(-0.2, 0.2) : 0)),
    color: Math.random() < 0.2 ? [
      Math.max(0, Math.min(255, t.color[0] + randomRange(-40, 40))),
      Math.max(0, Math.min(255, t.color[1] + randomRange(-40, 40))),
      Math.max(0, Math.min(255, t.color[2] + randomRange(-40, 40))),
    ] as [number, number, number] : [...t.color] as [number, number, number],
  };
}

/**
 * Structured mutation - decompose matrix, mutate components, reconstruct
 * Preserves mathematical structure better than random mutation
 */
export function structuredMutation(
  t: AffineTransform3D,
  strength: number = 0.15
): AffineTransform3D {
  const params = decomposeMatrix(t.m);

  // Mutate scale (preserve contractivity by keeping < 1)
  if (Math.random() < 0.4) {
    params.scaleX = Math.min(0.85, Math.max(0.1, params.scaleX + randomRange(-strength, strength)));
    params.scaleY = Math.min(0.85, Math.max(0.1, params.scaleY + randomRange(-strength, strength)));
    params.scaleZ = Math.min(0.85, Math.max(0.1, params.scaleZ + randomRange(-strength, strength)));
  }

  // Mutate rotation
  if (Math.random() < 0.5) {
    params.rotationX += randomRange(-strength * Math.PI, strength * Math.PI);
    params.rotationY += randomRange(-strength * Math.PI, strength * Math.PI);
    params.rotationZ += randomRange(-strength * Math.PI, strength * Math.PI);
  }

  // Mutate shear (keep small)
  if (Math.random() < 0.3) {
    params.shearXY = Math.max(-0.3, Math.min(0.3, params.shearXY + randomRange(-strength * 0.5, strength * 0.5)));
    params.shearXZ = Math.max(-0.3, Math.min(0.3, params.shearXZ + randomRange(-strength * 0.5, strength * 0.5)));
    params.shearYZ = Math.max(-0.3, Math.min(0.3, params.shearYZ + randomRange(-strength * 0.5, strength * 0.5)));
  }

  let m = reconstructMatrix(params);
  m = enforceContractivity(m, 0.85) as AffineTransform3D['m'];

  return {
    m: m as AffineTransform3D['m'],
    tx: t.tx + (Math.random() < 0.4 ? randomRange(-strength, strength) : 0),
    ty: t.ty + (Math.random() < 0.4 ? randomRange(-strength, strength) : 0),
    tz: t.tz + (Math.random() < 0.4 ? randomRange(-strength, strength) : 0),
    probability: Math.max(0.1, t.probability + (Math.random() < 0.3 ? randomRange(-0.2, 0.2) : 0)),
    color: Math.random() < 0.2 ? [
      Math.max(0, Math.min(255, t.color[0] + randomRange(-40, 40))),
      Math.max(0, Math.min(255, t.color[1] + randomRange(-40, 40))),
      Math.max(0, Math.min(255, t.color[2] + randomRange(-40, 40))),
    ] as [number, number, number] : [...t.color] as [number, number, number],
  };
}

/**
 * Rotation-only mutation - change orientation without affecting scale
 */
export function rotationMutation(
  t: AffineTransform3D,
  strength: number = 0.3
): AffineTransform3D {
  const params = decomposeMatrix(t.m);

  params.rotationX += randomRange(-strength * Math.PI, strength * Math.PI);
  params.rotationY += randomRange(-strength * Math.PI, strength * Math.PI);
  params.rotationZ += randomRange(-strength * Math.PI, strength * Math.PI);

  let m = reconstructMatrix(params);
  m = enforceContractivity(m, 0.85);

  return {
    ...t,
    m: m as AffineTransform3D['m'],
    color: [...t.color] as [number, number, number],
  };
}

/**
 * Scale-only mutation - change size without affecting orientation
 */
export function scaleMutation(
  t: AffineTransform3D,
  strength: number = 0.15
): AffineTransform3D {
  const params = decomposeMatrix(t.m);

  // Uniform or non-uniform scale mutation
  if (Math.random() < 0.5) {
    // Uniform scale
    const scaleFactor = 1 + randomRange(-strength, strength);
    params.scaleX = Math.min(0.85, Math.max(0.1, params.scaleX * scaleFactor));
    params.scaleY = Math.min(0.85, Math.max(0.1, params.scaleY * scaleFactor));
    params.scaleZ = Math.min(0.85, Math.max(0.1, params.scaleZ * scaleFactor));
  } else {
    // Non-uniform scale
    params.scaleX = Math.min(0.85, Math.max(0.1, params.scaleX + randomRange(-strength, strength)));
    params.scaleY = Math.min(0.85, Math.max(0.1, params.scaleY + randomRange(-strength, strength)));
    params.scaleZ = Math.min(0.85, Math.max(0.1, params.scaleZ + randomRange(-strength, strength)));
  }

  let m = reconstructMatrix(params);
  m = enforceContractivity(m, 0.85);

  return {
    ...t,
    m: m as AffineTransform3D['m'],
    color: [...t.color] as [number, number, number],
  };
}

/**
 * Translation-only mutation
 */
export function translationMutation(
  t: AffineTransform3D,
  strength: number = 0.2
): AffineTransform3D {
  return {
    ...t,
    m: [...t.m] as AffineTransform3D['m'],
    tx: t.tx + randomRange(-strength, strength),
    ty: t.ty + randomRange(-strength, strength),
    tz: t.tz + randomRange(-strength, strength),
    color: [...t.color] as [number, number, number],
  };
}

/**
 * Color-only mutation
 */
export function colorMutation(
  t: AffineTransform3D,
  strength: number = 50
): AffineTransform3D {
  return {
    ...t,
    m: [...t.m] as AffineTransform3D['m'],
    color: [
      Math.max(0, Math.min(255, t.color[0] + randomRange(-strength, strength))),
      Math.max(0, Math.min(255, t.color[1] + randomRange(-strength, strength))),
      Math.max(0, Math.min(255, t.color[2] + randomRange(-strength, strength))),
    ],
  };
}

/**
 * Apply mutation of the specified type
 */
export function mutateTransform(
  t: AffineTransform3D,
  type: MutationType = 'structured',
  strength: number = 0.12
): AffineTransform3D {
  switch (type) {
    case 'random':
      return randomMutation(t, strength);
    case 'structured':
      return structuredMutation(t, strength);
    case 'rotation':
      return rotationMutation(t, strength);
    case 'scale':
      return scaleMutation(t, strength);
    case 'translation':
      return translationMutation(t, strength);
    case 'color':
      return colorMutation(t, strength * 400);
    default:
      return structuredMutation(t, strength);
  }
}

// ============================================
// GENOME-LEVEL OPERATIONS
// ============================================

/**
 * Calculate genome "fitness" based on ratings and other factors
 */
export function calculateFitness(genome: FractalGenome3D): number {
  let fitness = 1.0;

  // Rating-based fitness
  if (genome.rating === 'up') fitness *= 3.0;
  if (genome.rating === 'down') fitness *= 0.1;

  // Contractivity bonus - well-formed fractals get a boost
  const avgContractivity = genome.transforms.reduce((sum, t) => sum + spectralRadius(t.m), 0) / genome.transforms.length;
  if (avgContractivity < 0.7) fitness *= 1.2;

  // Diversity bonus - more transforms = more potential complexity
  fitness *= 1 + (genome.transforms.length - 3) * 0.1;

  return fitness;
}

/**
 * Get statistics about a genome for display
 */
export function getGenomeStats(genome: FractalGenome3D): {
  transformCount: number;
  avgContractivity: number;
  avgScale: number;
  colorDiversity: number;
  isValid: boolean;
} {
  const contractivities = genome.transforms.map(t => spectralRadius(t.m));
  const avgContractivity = contractivities.reduce((a, b) => a + b, 0) / contractivities.length;

  const scales = genome.transforms.map(t => {
    const params = decomposeMatrix(t.m);
    return (params.scaleX + params.scaleY + params.scaleZ) / 3;
  });
  const avgScale = scales.reduce((a, b) => a + b, 0) / scales.length;

  // Color diversity: how different are the colors?
  const colors = genome.transforms.map(t => t.color);
  let colorDiff = 0;
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      colorDiff += Math.abs(colors[i][0] - colors[j][0]) +
                   Math.abs(colors[i][1] - colors[j][1]) +
                   Math.abs(colors[i][2] - colors[j][2]);
    }
  }
  const colorDiversity = colors.length > 1 ? colorDiff / (colors.length * (colors.length - 1) / 2) / 765 : 0;

  // Check if all transforms are contractive
  const isValid = genome.transforms.every(t => isContractive(t));

  return {
    transformCount: genome.transforms.length,
    avgContractivity,
    avgScale,
    colorDiversity,
    isValid,
  };
}
