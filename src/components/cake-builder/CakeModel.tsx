"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Cylinder, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

interface CakeModelProps {
    shape: 'round' | 'square' | 'heart';
    size: number;
    layers: number;
    color: string;
}

export default function CakeModel({ shape, size, layers, color }: CakeModelProps) {
    const group = useRef<THREE.Group>(null);

    // Animation: Gentle float/rotation
    useFrame((state) => {
        if (group.current) {
            group.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.1;
        }
    });

    // Scale factor: Adjust based on size to prevent overflow
    // Smaller cakes get bigger visual representation, larger cakes scaled down
    const baseScale = Math.min(1.0, 8 / size); // 8" is reference size
    const scale = baseScale * 0.5; // Overall reduction for better fit
    const radius = (size / 2) * scale;
    const layerHeight = 0.35 * scale; // Reduced height per layer
    const totalHeight = layers * layerHeight;

    return (
        <group ref={group} dispose={null} position={[0, -totalHeight / 2, 0]}>
            {Array.from({ length: layers }).map((_, i) => (
                <group key={i} position={[0, i * layerHeight, 0]}>
                    {/* Cake Layer */}
                    {shape !== 'square' ? (
                        <Cylinder args={[radius, radius, layerHeight - 0.02, 64]}>
                            <meshStandardMaterial
                                color={color}
                                roughness={0.3}
                                metalness={0.1}
                            />
                        </Cylinder>
                    ) : (
                        <mesh>
                            <boxGeometry args={[radius * 2, layerHeight - 0.02, radius * 2]} />
                            <meshStandardMaterial
                                color={color}
                                roughness={0.3}
                                metalness={0.1}
                            />
                        </mesh>
                    )}

                    {/* Filling/Frosting between layers (except top) */}
                    {i < layers - 1 && (
                        shape !== 'square' ? (
                            <Cylinder
                                position={[0, layerHeight / 2 + 0.01, 0]}
                                args={[radius + 0.02, radius + 0.02, 0.03, 64]}
                            >
                                <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
                            </Cylinder>
                        ) : (
                            <mesh position={[0, layerHeight / 2 + 0.01, 0]}>
                                <boxGeometry args={[radius * 2 + 0.04, 0.03, radius * 2 + 0.04]} />
                                <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
                            </mesh>
                        )
                    )}
                </group>
            ))}

            {/* Cake Board - positioned at bottom */}
            <Cylinder
                position={[0, -0.06, 0]}
                args={[radius + 0.2, radius + 0.2, 0.05, 64]}
            >
                <meshStandardMaterial color="#D4AF37" roughness={0.3} metalness={0.6} />
            </Cylinder>
        </group>
    );
}
