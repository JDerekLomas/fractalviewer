export interface AffineTransform {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
  probability: number;
  color: [number, number, number];
}

export interface FractalGenome {
  id: string;
  transforms: AffineTransform[];
  generation: number;
  parentIds: string[];
  rating?: 'up' | 'down';
  comment?: string;
}
