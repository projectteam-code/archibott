"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import { computePlanBoundsMeters } from "../geometry";
import type { FloorPlan, WallSegment } from "../types";

interface Plan3DViewProps {
  plan: FloorPlan;
  segments: WallSegment[];
}

export function Plan3DView({ plan, segments }: Plan3DViewProps) {
  const bounds = useMemo(() => computePlanBoundsMeters(plan), [plan]);
  const floorWidth = Math.max(2, bounds.width + 2);
  const floorDepth = Math.max(2, bounds.depth + 2);
  const centerX = bounds.centerX;
  const centerZ = bounds.centerZ;

  return (
    <div className="h-[600px] rounded-xl border border-slate-300 bg-slate-950">
      <div className="flex items-center justify-between px-3 py-2 text-xs text-slate-200">
        <span>3D View</span>
        <span data-testid="plan3d-meta">{segments.length} wall segments</span>
      </div>
      <Canvas camera={{ position: [centerX + 4, 4, centerZ + 5], fov: 52 }}>
        <color attach="background" args={["#0f172a"]} />
        <ambientLight intensity={0.45} />
        <directionalLight intensity={1.1} position={[6, 8, 4]} castShadow />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0, centerZ]}>
          <planeGeometry args={[floorWidth, floorDepth]} />
          <meshStandardMaterial color="#d6d3d1" />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[centerX, 3, centerZ]}>
          <planeGeometry args={[floorWidth, floorDepth]} />
          <meshStandardMaterial color="#e7e5e4" />
        </mesh>
        {segments.map((segment) => (
          <mesh
            key={segment.id}
            position={[segment.center.x, segment.center.y, segment.center.z]}
            rotation={[0, segment.rotationY, 0]}
          >
            <boxGeometry args={[segment.size.length, segment.size.height, segment.size.thickness]} />
            <meshStandardMaterial color="#b45309" roughness={0.65} metalness={0.05} />
          </mesh>
        ))}
        <gridHelper args={[Math.max(floorWidth, floorDepth) + 1, 20, "#475569", "#334155"]} />
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}
