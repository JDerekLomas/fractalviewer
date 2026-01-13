import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FractalGenome3D } from '../lib/types3d';
import { createFractalPointCloud } from '../lib/ifs3d';

interface FractalCard3DProps {
  genome: FractalGenome3D;
  index: number;
  onSelect: (id: string) => void;
  onReject: (id: string) => void;
  size?: number;
}

export function FractalCard3D({ genome, index, onSelect, onReject, size = 180 }: FractalCard3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    animationId: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Setup scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(2, 2, 2);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Orbit controls for rotation
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1;

    // Add fractal
    const pointCloud = createFractalPointCloud(genome, {
      iterations: 30000,
      pointSize: 3,
    });
    scene.add(pointCloud);

    // Animation loop
    const animate = () => {
      sceneRef.current!.animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    sceneRef.current = { scene, camera, renderer, controls, animationId: 0 };
    animate();

    return () => {
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId);
        sceneRef.current.controls.dispose();
        sceneRef.current.renderer.dispose();
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [genome, size]);

  const isSelected = genome.rating === 'up';
  const isRejected = genome.rating === 'down';

  return (
    <div className="relative group">
      {/* Index number */}
      <div className="absolute top-2 left-2 z-10 w-6 h-6 rounded bg-black/60 text-zinc-400 text-xs flex items-center justify-center font-mono">
        {index + 1}
      </div>

      {/* Reject button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onReject(genome.id);
        }}
        className={`
          absolute top-2 right-2 z-10 w-6 h-6 rounded text-xs flex items-center justify-center
          transition-all
          ${isRejected
            ? 'bg-red-500 text-white'
            : 'bg-black/60 text-zinc-500 opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:text-white'}
        `}
        title="Thumbs down"
      >
        X
      </button>

      {/* Main clickable area */}
      <div
        onClick={() => onSelect(genome.id)}
        className={`
          cursor-pointer rounded-lg overflow-hidden border-4 transition-all
          ${isSelected ? 'border-green-500 shadow-lg shadow-green-500/40 scale-105' : ''}
          ${isRejected ? 'border-red-500/30 opacity-40' : ''}
          ${!isSelected && !isRejected ? 'border-transparent hover:border-zinc-600' : ''}
        `}
      >
        <div
          ref={containerRef}
          style={{ width: size, height: size }}
          className="bg-zinc-900"
        />
      </div>

      {/* Selected checkmark */}
      {isSelected && (
        <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-lg font-bold z-10">
          ✓
        </div>
      )}
    </div>
  );
}
