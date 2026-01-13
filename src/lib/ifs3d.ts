import * as THREE from 'three';
import { AffineTransform3D, FractalGenome3D } from './types3d';

interface RenderOptions3D {
  iterations: number;
  skipIterations: number;
  pointSize: number;
}

const defaultOptions: RenderOptions3D = {
  iterations: 50000,
  skipIterations: 20,
  pointSize: 2,
};

function selectTransform(transforms: AffineTransform3D[]): number {
  const totalProb = transforms.reduce((sum, t) => sum + t.probability, 0);
  let r = Math.random() * totalProb;

  for (let i = 0; i < transforms.length; i++) {
    r -= transforms[i].probability;
    if (r <= 0) return i;
  }
  return transforms.length - 1;
}

function applyTransform3D(
  x: number,
  y: number,
  z: number,
  t: AffineTransform3D
): [number, number, number] {
  const [m0, m1, m2, m3, m4, m5, m6, m7, m8] = t.m;
  return [
    m0 * x + m1 * y + m2 * z + t.tx,
    m3 * x + m4 * y + m5 * z + t.ty,
    m6 * x + m7 * y + m8 * z + t.tz,
  ];
}

export function generateFractalPoints(
  genome: FractalGenome3D,
  options: Partial<RenderOptions3D> = {}
): { positions: Float32Array; colors: Float32Array; count: number } {
  const opts = { ...defaultOptions, ...options };
  const { iterations, skipIterations } = opts;
  const { transforms } = genome;

  if (transforms.length === 0) {
    return { positions: new Float32Array(0), colors: new Float32Array(0), count: 0 };
  }

  const points: { x: number; y: number; z: number; color: [number, number, number] }[] = [];

  // Start at random point
  let x = Math.random() * 2 - 1;
  let y = Math.random() * 2 - 1;
  let z = Math.random() * 2 - 1;

  // Track bounds for normalization
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (let i = 0; i < iterations; i++) {
    const tIdx = selectTransform(transforms);
    const t = transforms[tIdx];
    [x, y, z] = applyTransform3D(x, y, z, t);

    // Check for divergence
    if (!isFinite(x) || !isFinite(y) || !isFinite(z)) {
      x = Math.random() * 2 - 1;
      y = Math.random() * 2 - 1;
      z = Math.random() * 2 - 1;
      continue;
    }

    if (i >= skipIterations) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
      points.push({ x, y, z, color: t.color });
    }
  }

  if (points.length === 0) {
    return { positions: new Float32Array(0), colors: new Float32Array(0), count: 0 };
  }

  // Normalize to fit in unit cube centered at origin
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const rangeZ = maxZ - minZ || 1;
  const maxRange = Math.max(rangeX, rangeY, rangeZ);
  const scale = 2 / maxRange;

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;

  const positions = new Float32Array(points.length * 3);
  const colors = new Float32Array(points.length * 3);

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    positions[i * 3] = (p.x - centerX) * scale;
    positions[i * 3 + 1] = (p.y - centerY) * scale;
    positions[i * 3 + 2] = (p.z - centerZ) * scale;

    colors[i * 3] = p.color[0] / 255;
    colors[i * 3 + 1] = p.color[1] / 255;
    colors[i * 3 + 2] = p.color[2] / 255;
  }

  return { positions, colors, count: points.length };
}

export function createFractalPointCloud(
  genome: FractalGenome3D,
  options: Partial<RenderOptions3D> = {}
): THREE.Points {
  const opts = { ...defaultOptions, ...options };
  const { positions, colors, count } = generateFractalPoints(genome, options);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: opts.pointSize * 0.01,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geometry, material);
  points.userData.pointCount = count;

  return points;
}
