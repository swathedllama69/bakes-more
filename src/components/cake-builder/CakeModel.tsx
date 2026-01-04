"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Cylinder, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

interface CakeModelProps {
    shape: 'round' | 'square';
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

    // Scale factor: Reduced to fit better
    const scale = 0.4;
    const radius = (size / 4) * scale;
    const layerHeight = 0.5 * scale; // Visual height per layer

    return (
        <group ref={group} dispose={null}>
            {Array.from({ length: layers }).map((_, i) => (
                <group key={i} position={[0, (i * layerHeight) - ((layers * layerHeight) / 2) + (layerHeight / 2), 0]}>
                    {/* Cake Layer */}
                    {shape === 'round' ? (
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
                        shape === 'round' ? (
                            <Cylinder
                                position={[0, layerHeight / 2, 0]}
                                args={[radius - 0.05, radius - 0.05, 0.02, 64]}
                            >
                                <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
                            </Cylinder>
                        ) : (
                            <mesh position={[0, layerHeight / 2, 0]}>
                                <boxGeometry args={[radius * 2 - 0.1, 0.02, radius * 2 - 0.1]} />
                                <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
                            </mesh>
                        )
                    )}
                </group>
            ))}

            {/* Cake Board */}
            <Cylinder
                position={[0, -layerHeight / 2 - 0.05, 0]}
                args={[radius + 0.5, radius + 0.5, 0.1, 64]}
            >
                <meshStandardMaterial color="#E0E0E0" roughness={0.2} metalness={0.5} />
            </Cylinder>
        </group>
    );
}
