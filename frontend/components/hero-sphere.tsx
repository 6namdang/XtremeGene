"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ParticleSphere } from "./particle-sphere";

interface Props {
  mouseX?: number;
  mouseY?: number;
  isHovered?: boolean;
}

export function HeroSphere({ mouseX = 0, mouseY = 0, isHovered = false }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    <Canvas
      frameloop="always"
      camera={{ position: [0, 0, 5], fov: 75 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent", width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.4} />
      <ParticleSphere mouseX={mouseX} mouseY={mouseY} isHovered={isHovered} />
    </Canvas>
  );
}
