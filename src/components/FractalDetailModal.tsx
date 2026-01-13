import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FractalGenome3D } from '../lib/types3d';
import { createFractalPointCloud } from '../lib/ifs3d';

interface FractalDetailModalProps {
  genome: FractalGenome3D;
  onClose: () => void;
}

export function FractalDetailModal({ genome, onClose }: FractalDetailModalProps) {
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
    camera.position.set(3, 3, 3);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(600, 600);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    // Add fractal with more iterations for detail view
    const pointCloud = createFractalPointCloud(genome, {
      iterations: 100000,
      pointSize: 2,
    });
    scene.add(pointCloud);

    // Animation loop
    const animate = () => {
      if (!sceneRef.current) return;
      sceneRef.current.animationId = requestAnimationFrame(animate);
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
  }, [genome]);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 rounded-xl p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <div className="text-white font-medium">
            Generation {genome.generation} | {genome.transforms.length} transforms
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white text-xl px-2"
          >
            ✕
          </button>
        </div>

        <div
          ref={containerRef}
          className="rounded-lg overflow-hidden"
          style={{ width: 600, height: 600 }}
        />

        <div className="mt-3 text-xs text-zinc-500 text-center">
          Drag to rotate | Scroll to zoom | Press Escape to close
        </div>
      </div>
    </div>
  );
}
