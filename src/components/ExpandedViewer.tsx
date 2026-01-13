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

const MAX_POINTS = 50000;

export function ExpandedViewer({ genome, onClose }: ExpandedViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pointCount, setPointCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0x8888ff, 0.5);
    directionalLight2.position.set(-5, -3, -5);
    scene.add(directionalLight2);

    // Instanced spheres setup
    const sphereGeometry = new THREE.SphereGeometry(0.012, 8, 6);
    const sphereMaterial = new THREE.MeshStandardMaterial({
      roughness: 0.4,
      metalness: 0.3,
    });

    // Pre-allocate instanced mesh for max points (we'll update count as we grow)
    const maxInstances = MAX_POINTS;
    const instancedMesh = new THREE.InstancedMesh(sphereGeometry, sphereMaterial, maxInstances);
    instancedMesh.count = 0; // Start with 0 visible instances
    scene.add(instancedMesh);

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    // IFS state
    let x = Math.random() * 2 - 1;
    let y = Math.random() * 2 - 1;
    let z = Math.random() * 2 - 1;
    let iteration = 0;
    const SKIP = 20;

    // All accumulated points
    const allPositions: number[] = [];
    const allColors: number[] = [];

    // Bounds tracking
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    const addBatch = (count: number) => {
      for (let i = 0; i < count; i++) {
        const tIdx = selectTransform(genome.transforms);
        const t = genome.transforms[tIdx];
        [x, y, z] = applyTransform3D(x, y, z, t);

        if (!isFinite(x) || !isFinite(y) || !isFinite(z)) {
          x = Math.random() * 2 - 1;
          y = Math.random() * 2 - 1;
          z = Math.random() * 2 - 1;
          continue;
        }

        iteration++;
        if (iteration <= SKIP) continue;

        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);

        allPositions.push(x, y, z);
        allColors.push(t.color[0] / 255, t.color[1] / 255, t.color[2] / 255);
      }

      // Update instanced mesh
      const numPoints = allPositions.length / 3;
      if (numPoints > 0) {
        const rangeX = maxX - minX || 1;
        const rangeY = maxY - minY || 1;
        const rangeZ = maxZ - minZ || 1;
        const maxRange = Math.max(rangeX, rangeY, rangeZ);
        const scale = 2 / maxRange;
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const cz = (minZ + maxZ) / 2;

        // Update all instance transforms and colors
        for (let i = 0; i < numPoints; i++) {
          const px = (allPositions[i * 3] - cx) * scale;
          const py = (allPositions[i * 3 + 1] - cy) * scale;
          const pz = (allPositions[i * 3 + 2] - cz) * scale;

          dummy.position.set(px, py, pz);
          dummy.updateMatrix();
          instancedMesh.setMatrixAt(i, dummy.matrix);

          color.setRGB(allColors[i * 3], allColors[i * 3 + 1], allColors[i * 3 + 2]);
          instancedMesh.setColorAt(i, color);
        }

        instancedMesh.count = numPoints;
        instancedMesh.instanceMatrix.needsUpdate = true;
        if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
      }

      setPointCount(numPoints);
      return numPoints;
    };

    // Start with just 10 points
    addBatch(30); // 30 iterations = 10 points after skipping first 20

    // Grow by 500 points every 50ms
    intervalRef.current = setInterval(() => {
      const currentCount = allPositions.length / 3;
      if (currentCount >= MAX_POINTS) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }
      addBatch(500);
    }, 50);

    // Animation loop
    let animationId: number;
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
      if (intervalRef.current) clearInterval(intervalRef.current);
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      sphereGeometry.dispose();
      sphereMaterial.dispose();
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
