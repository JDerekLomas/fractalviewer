import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FractalGenome3D, AffineTransform3D } from '../lib/types3d';

interface ExpandedViewerProps {
  genome: FractalGenome3D;
  onClose: () => void;
}

function selectTransform(transforms: AffineTransform3D[]): number {
  const totalProb = transforms.reduce((sum, t) => sum + t.probability, 0);
  let r = Math.random() * totalProb;
  for (let i = 0; i < transforms.length; i++) {
    r -= transforms[i].probability;
    if (r <= 0) return i;
  }
  return transforms.length - 1;
}

function applyTransform3D(x: number, y: number, z: number, t: AffineTransform3D): [number, number, number] {
  const [m0, m1, m2, m3, m4, m5, m6, m7, m8] = t.m;
  return [
    m0 * x + m1 * y + m2 * z + t.tx,
    m3 * x + m4 * y + m5 * z + t.ty,
    m6 * x + m7 * y + m8 * z + t.tz,
  ];
}

const MAX_POINTS = 500000;

export function ExpandedViewer({ genome, onClose }: ExpandedViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pointCount, setPointCount] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050508);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(2.5, 2, 2.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    // Progressive point generation - start small, grow visibly
    const BATCH_SIZE = 2000;
    const SKIP_ITERATIONS = 20;

    let positions: number[] = [];
    let colors: number[] = [];
    let currentX = Math.random() * 2 - 1;
    let currentY = Math.random() * 2 - 1;
    let currentZ = Math.random() * 2 - 1;
    let iteration = 0;

    // Tracking bounds for normalization
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    const geometry = new THREE.BufferGeometry();
    const material = new THREE.PointsMaterial({
      size: 0.006,
      vertexColors: true,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let animationId: number;
    let growthInterval: ReturnType<typeof setInterval>;

    const addPoints = () => {
      if (positions.length / 3 >= MAX_POINTS) return;

      const newPositions: number[] = [];
      const newColors: number[] = [];

      for (let i = 0; i < BATCH_SIZE; i++) {
        const tIdx = selectTransform(genome.transforms);
        const t = genome.transforms[tIdx];
        [currentX, currentY, currentZ] = applyTransform3D(currentX, currentY, currentZ, t);

        if (!isFinite(currentX) || !isFinite(currentY) || !isFinite(currentZ)) {
          currentX = Math.random() * 2 - 1;
          currentY = Math.random() * 2 - 1;
          currentZ = Math.random() * 2 - 1;
          continue;
        }

        iteration++;
        if (iteration <= SKIP_ITERATIONS) continue;

        minX = Math.min(minX, currentX);
        maxX = Math.max(maxX, currentX);
        minY = Math.min(minY, currentY);
        maxY = Math.max(maxY, currentY);
        minZ = Math.min(minZ, currentZ);
        maxZ = Math.max(maxZ, currentZ);

        newPositions.push(currentX, currentY, currentZ);
        newColors.push(t.color[0] / 255, t.color[1] / 255, t.color[2] / 255);
      }

      positions.push(...newPositions);
      colors.push(...newColors);

      // Normalize all points
      const rangeX = maxX - minX || 1;
      const rangeY = maxY - minY || 1;
      const rangeZ = maxZ - minZ || 1;
      const maxRange = Math.max(rangeX, rangeY, rangeZ);
      const scale = 2 / maxRange;
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const centerZ = (minZ + maxZ) / 2;

      const normalizedPositions = new Float32Array(positions.length);
      for (let i = 0; i < positions.length; i += 3) {
        normalizedPositions[i] = (positions[i] - centerX) * scale;
        normalizedPositions[i + 1] = (positions[i + 1] - centerY) * scale;
        normalizedPositions[i + 2] = (positions[i + 2] - centerZ) * scale;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(normalizedPositions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;

      setPointCount(positions.length / 3);
    };

    // Start with just one small batch so growth is visible
    addPoints();

    // Continue growing every 50ms
    growthInterval = setInterval(addPoints, 50);

    // Animation loop
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      clearInterval(growthInterval);
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [genome]);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col" onClick={onClose}>
      <div className="flex items-center justify-between p-4 bg-zinc-900/80">
        <div className="text-white">
          <span className="text-zinc-400">Points:</span>{' '}
          <span className="font-mono text-green-400">{pointCount.toLocaleString()}</span>
          {pointCount < MAX_POINTS && <span className="text-zinc-500 ml-2">(growing...)</span>}
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-white"
        >
          Close (ESC)
        </button>
      </div>
      <div
        ref={containerRef}
        className="flex-1"
        onClick={(e) => e.stopPropagation()}
      />
      <div className="p-2 text-center text-zinc-500 text-sm">
        Drag to rotate • Scroll to zoom • Click outside to close
      </div>
    </div>
  );
}
