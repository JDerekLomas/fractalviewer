import { AffineTransform, FractalGenome } from './types';

interface RenderOptions {
  width: number;
  height: number;
  iterations: number;
  skipIterations: number;
}

const defaultOptions: RenderOptions = {
  width: 200,
  height: 200,
  iterations: 50000,
  skipIterations: 20,
};

function selectTransform(transforms: AffineTransform[]): number {
  const totalProb = transforms.reduce((sum, t) => sum + t.probability, 0);
  let r = Math.random() * totalProb;

  for (let i = 0; i < transforms.length; i++) {
    r -= transforms[i].probability;
    if (r <= 0) return i;
  }
  return transforms.length - 1;
}

function applyTransform(x: number, y: number, t: AffineTransform): [number, number] {
  return [
    t.a * x + t.b * y + t.e,
    t.c * x + t.d * y + t.f,
  ];
}

export function renderFractal(
  genome: FractalGenome,
  canvas: HTMLCanvasElement,
  options: Partial<RenderOptions> = {}
): void {
  const opts = { ...defaultOptions, ...options };
  const { width, height, iterations, skipIterations } = opts;
  const { transforms } = genome;

  if (transforms.length === 0) return;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear to black
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, width, height);

  // Create image data for efficient pixel manipulation
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  // Track point density for better coloring
  const density = new Float32Array(width * height);
  const colorAccum = new Float32Array(width * height * 3);

  // Start at a random point
  let x = Math.random() * 2 - 1;
  let y = Math.random() * 2 - 1;

  // Track bounds during first pass to auto-scale
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  const points: { x: number; y: number; color: [number, number, number] }[] = [];

  for (let i = 0; i < iterations; i++) {
    const tIdx = selectTransform(transforms);
    const t = transforms[tIdx];
    [x, y] = applyTransform(x, y, t);

    if (i >= skipIterations) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      points.push({ x, y, color: t.color });
    }
  }

  // Handle degenerate cases
  if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY)) {
    return;
  }

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const scale = Math.min(width / rangeX, height / rangeY) * 0.9;
  const offsetX = (width - rangeX * scale) / 2;
  const offsetY = (height - rangeY * scale) / 2;

  // Plot points
  for (const p of points) {
    const px = Math.floor((p.x - minX) * scale + offsetX);
    const py = Math.floor((p.y - minY) * scale + offsetY);

    if (px >= 0 && px < width && py >= 0 && py < height) {
      const idx = py * width + px;
      density[idx]++;
      colorAccum[idx * 3] += p.color[0];
      colorAccum[idx * 3 + 1] += p.color[1];
      colorAccum[idx * 3 + 2] += p.color[2];
    }
  }

  // Find max density for normalization
  let maxDensity = 0;
  for (let i = 0; i < density.length; i++) {
    maxDensity = Math.max(maxDensity, density[i]);
  }

  // Apply log scaling for better visualization
  const logMax = Math.log(maxDensity + 1);

  for (let i = 0; i < density.length; i++) {
    if (density[i] > 0) {
      const alpha = Math.log(density[i] + 1) / logMax;
      const brightness = Math.pow(alpha, 0.4); // Gamma correction

      const r = colorAccum[i * 3] / density[i];
      const g = colorAccum[i * 3 + 1] / density[i];
      const b = colorAccum[i * 3 + 2] / density[i];

      const pixelIdx = i * 4;
      data[pixelIdx] = Math.min(255, r * brightness * 1.2);
      data[pixelIdx + 1] = Math.min(255, g * brightness * 1.2);
      data[pixelIdx + 2] = Math.min(255, b * brightness * 1.2);
      data[pixelIdx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}
