// 3D IFS types - 3x3 matrix + 3D translation
export interface AffineTransform3D {
  // 3x3 rotation/scale/shear matrix (row-major)
  m: [number, number, number, number, number, number, number, number, number];
  // 3D translation
  tx: number;
  ty: number;
  tz: number;
  probability: number;
  color: [number, number, number];
}

export interface FractalGenome3D {
  id: string;
  transforms: AffineTransform3D[];
  generation: number;
  parentIds: string[];
  rating?: 'up' | 'down';
  comment?: string;
}
