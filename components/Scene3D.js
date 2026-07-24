"use client";

import { useMemo, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Html, Sparkles } from "@react-three/drei";
import * as THREE from "three";

const STOP_COLORS = {
  default: "#6b3fa0",
  hover:   "#9060d0",
  active:  "#ffc300",
  correct: "#00c853",
  wrong:   "#ff4444",
};

const ROOM_RADIUS   = 7;
const ROOM_HEIGHT   = 5.8;
const PEDESTAL_RADIUS = 4.2;
const COL_RADIUS    = ROOM_RADIUS - 0.55;
const COL_COUNT     = 12;

function layoutPositions(count) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    return [Math.cos(angle) * PEDESTAL_RADIUS, 0, Math.sin(angle) * PEDESTAL_RADIUS];
  });
}

function PalaceFloor() {
  return (
    <group>
      {/* base — deep jewel teal */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[ROOM_RADIUS, 48]} />
        <meshStandardMaterial color="#0a2230" roughness={0.85} metalness={0.15} />
      </mesh>
      {/* outer gold ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <ringGeometry args={[ROOM_RADIUS - 0.55, ROOM_RADIUS - 0.15, 48]} />
        <meshStandardMaterial color="#ffc300" emissive="#ffc300" emissiveIntensity={0.6} roughness={0.3} />
      </mesh>
      {/* rose ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <ringGeometry args={[ROOM_RADIUS - 1.25, ROOM_RADIUS - 1.0, 48]} />
        <meshStandardMaterial color="#ff3d82" emissive="#ff3d82" emissiveIntensity={0.5} />
      </mesh>
      {/* cyan pedestal-track ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <ringGeometry args={[PEDESTAL_RADIUS + 0.7, PEDESTAL_RADIUS + 0.9, 48]} />
        <meshStandardMaterial color="#00d8e0" emissive="#00d8e0" emissiveIntensity={0.45} />
      </mesh>
      {/* amethyst inner ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <ringGeometry args={[1.45, 1.65, 48]} />
        <meshStandardMaterial color="#cc44ff" emissive="#cc44ff" emissiveIntensity={0.6} />
      </mesh>
      {/* centre disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <circleGeometry args={[1.4, 48]} />
        <meshStandardMaterial color="#1a0838" roughness={0.7} />
      </mesh>
    </group>
  );
}

function PalaceWalls() {
  return (
    <group>
      {/* inner wall — royal purple */}
      <mesh position={[0, ROOM_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[ROOM_RADIUS, ROOM_RADIUS, ROOM_HEIGHT, 24, 1, true]} />
        <meshStandardMaterial color="#2a1258" side={THREE.BackSide} roughness={0.88} />
      </mesh>
      {/* ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_HEIGHT, 0]}>
        <circleGeometry args={[ROOM_RADIUS, 24]} />
        <meshStandardMaterial color="#180830" side={THREE.BackSide} />
      </mesh>
      {/* ceiling centre — cyan glow */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_HEIGHT - 0.01, 0]}>
        <circleGeometry args={[2.0, 24]} />
        <meshStandardMaterial color="#00d8ff" emissive="#00d8ff" emissiveIntensity={0.35} side={THREE.BackSide} />
      </mesh>
      {/* baseboard — gold */}
      <mesh position={[0, 0.26, 0]}>
        <torusGeometry args={[ROOM_RADIUS - 0.04, 0.22, 6, 48]} />
        <meshStandardMaterial color="#c8a030" emissive="#ffc300" emissiveIntensity={0.3} roughness={0.55} />
      </mesh>
      {/* cornice — gold */}
      <mesh position={[0, ROOM_HEIGHT - 0.32, 0]}>
        <torusGeometry args={[ROOM_RADIUS - 0.04, 0.22, 6, 48]} />
        <meshStandardMaterial color="#c8a030" emissive="#ffc300" emissiveIntensity={0.3} roughness={0.55} />
      </mesh>
      {/* upper band — rose */}
      <mesh position={[0, ROOM_HEIGHT * 0.62, 0]}>
        <torusGeometry args={[ROOM_RADIUS - 0.04, 0.07, 6, 48]} />
        <meshStandardMaterial color="#ff3d82" emissive="#ff3d82" emissiveIntensity={0.5} />
      </mesh>
      {/* lower band — cyan */}
      <mesh position={[0, ROOM_HEIGHT * 0.28, 0]}>
        <torusGeometry args={[ROOM_RADIUS - 0.04, 0.05, 6, 48]} />
        <meshStandardMaterial color="#00d8e0" emissive="#00d8e0" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function Column({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.24, 0.3, 0.32, 8]} />
        <meshStandardMaterial color="#d4b050" roughness={0.55} metalness={0.4} />
      </mesh>
      <mesh position={[0, ROOM_HEIGHT / 2 - 0.22, 0]}>
        <cylinderGeometry args={[0.16, 0.2, ROOM_HEIGHT - 1, 12]} />
        <meshStandardMaterial color="#e0c060" roughness={0.6} metalness={0.35} />
      </mesh>
      <mesh position={[0, ROOM_HEIGHT - 0.62, 0]}>
        <cylinderGeometry args={[0.3, 0.17, 0.32, 8]} />
        <meshStandardMaterial color="#d4b050" roughness={0.55} metalness={0.4} />
      </mesh>
      <mesh position={[0, ROOM_HEIGHT - 0.4, 0]}>
        <boxGeometry args={[0.68, 0.18, 0.68]} />
        <meshStandardMaterial color="#c09030" roughness={0.55} metalness={0.45} />
      </mesh>
    </group>
  );
}

function Columns() {
  return (
    <>
      {Array.from({ length: COL_COUNT }, (_, i) => {
        const angle = (i / COL_COUNT) * Math.PI * 2;
        return (
          <Column
            key={i}
            position={[Math.cos(angle) * COL_RADIUS, 0, Math.sin(angle) * COL_RADIUS]}
          />
        );
      })}
    </>
  );
}

function Chandelier() {
  const ringRef = useRef();
  useFrame((_, delta) => {
    if (ringRef.current) ringRef.current.rotation.y += delta * 0.25;
  });

  return (
    <group position={[0, ROOM_HEIGHT - 0.45, 0]}>
      {/* bright core orb */}
      <mesh>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#fff0cc" emissiveIntensity={6} />
      </mesh>
      <group ref={ringRef}>
        {/* outer ring — gold */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.82, 0.05, 6, 32]} />
          <meshStandardMaterial color="#ffc300" emissive="#ffc300" emissiveIntensity={2} />
        </mesh>
        {/* inner ring — cyan */}
        <mesh rotation={[Math.PI / 2, 0.4, 0]}>
          <torusGeometry args={[0.46, 0.035, 6, 24]} />
          <meshStandardMaterial color="#00d8ff" emissive="#00d8ff" emissiveIntensity={2} />
        </mesh>
        {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => (
          <mesh key={i} position={[Math.cos(angle) * 0.82, 0.44, Math.sin(angle) * 0.82]}>
            <cylinderGeometry args={[0.013, 0.013, 0.88, 4]} />
            <meshStandardMaterial color="#c8a030" emissive="#ffc300" emissiveIntensity={0.6} />
          </mesh>
        ))}
      </group>
      {/* main warm light */}
      <pointLight intensity={7} color="#fff5cc" distance={ROOM_RADIUS * 2.6} decay={1.1} />
      {/* cyan accent from chandelier */}
      <pointLight intensity={2.5} color="#00d8ff" distance={9} decay={2} position={[0, -0.6, 0]} />
    </group>
  );
}

function GemOrb({ state, active }) {
  const ref = useRef();
  const color = STOP_COLORS[state] || STOP_COLORS.default;
  const gemColor = state === "default" ? "#cc44ff" : color;

  useFrame(() => {
    if (!ref.current) return;
    ref.current.rotation.y += active ? 0.035 : 0.008;
    ref.current.position.y = active
      ? 1.35 + Math.sin(Date.now() * 0.003) * 0.12
      : 1.35;
  });

  return (
    <group ref={ref} position={[0, 1.35, 0]}>
      <mesh>
        <icosahedronGeometry args={[0.24, 1]} />
        <meshStandardMaterial
          color={gemColor}
          emissive={gemColor}
          emissiveIntensity={active ? 3.5 : 1.0}
          roughness={0.05}
          metalness={0.6}
        />
      </mesh>
      {active && <pointLight color={gemColor} intensity={7} distance={4} decay={2} />}
    </group>
  );
}

function Pedestal({ position, label, state, onClick, index }) {
  const [hovered, setHovered] = useState(false);
  const active = state === "active";
  const shaftColor =
    hovered && state === "default" ? STOP_COLORS.hover : STOP_COLORS[state] || STOP_COLORS.default;

  return (
    <group position={position}>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.55, 0.62, 0.12, 16]} />
        <meshStandardMaterial color="#3a1870" roughness={0.65} metalness={0.4} />
      </mesh>
      <mesh
        position={[0, 0.57, 0]}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[0.36, 0.46, 0.97, 16]} />
        <meshStandardMaterial
          color={shaftColor}
          emissive={shaftColor}
          emissiveIntensity={active ? 1.0 : 0.25}
          roughness={0.45}
          metalness={0.2}
        />
      </mesh>
      <mesh position={[0, 1.09, 0]}>
        <cylinderGeometry args={[0.43, 0.37, 0.1, 16]} />
        <meshStandardMaterial color="#3a1870" roughness={0.65} metalness={0.4} />
      </mesh>
      <GemOrb state={state} active={active} />
      <Text
        position={[0, -0.2, 0]}
        fontSize={0.2}
        color={hovered ? "#ffc300" : "#d0b8ff"}
        anchorX="center"
        anchorY="middle"
      >
        {`${index + 1}. ${label}`}
      </Text>
    </group>
  );
}

export default function Scene3D({ stops, stateByStop = {}, activeStopId, onStopClick, overlayContent }) {
  const positions = useMemo(() => layoutPositions(stops.length), [stops.length]);
  const activeIndex = stops.findIndex((s) => s.id === activeStopId);

  return (
    <div style={{ width: "100%", height: 440, borderRadius: 12, overflow: "hidden", border: "1px solid #6b3fa0" }}>
      <Canvas camera={{ position: [0, 6, 10], fov: 50 }}>
        <color attach="background" args={["#0d0820"]} />
        <fog attach="fog" args={["#0d0820", 16, 30]} />

        {/* brighter ambient — warm purple */}
        <ambientLight intensity={0.55} color="#7050b0" />

        {/* four coloured wall-bounce lights */}
        <pointLight position={[ ROOM_RADIUS - 1,  3,  0]} intensity={2.0} color="#ff3d82" distance={13} decay={2} />
        <pointLight position={[-(ROOM_RADIUS - 1), 3,  0]} intensity={2.0} color="#00d8ff" distance={13} decay={2} />
        <pointLight position={[0, 3,  ROOM_RADIUS - 1]} intensity={2.0} color="#ffc300" distance={13} decay={2} />
        <pointLight position={[0, 3, -(ROOM_RADIUS - 1)]} intensity={2.0} color="#cc44ff" distance={13} decay={2} />
        {/* diagonal fills */}
        <pointLight position={[ 5, 1,  5]} intensity={1.0} color="#00ff88" distance={10} decay={2} />
        <pointLight position={[-5, 1, -5]} intensity={1.0} color="#ff8844" distance={10} decay={2} />

        <PalaceFloor />
        <PalaceWalls />
        <Columns />
        <Chandelier />

        {/* layered sparkles — gold + purple + cyan */}
        <Sparkles count={60} scale={14} size={0.9} speed={0.18} color="#ffc300" opacity={0.3} />
        <Sparkles count={35} scale={10} size={0.7} speed={0.13} color="#cc44ff" opacity={0.25} />
        <Sparkles count={25} scale={8}  size={0.6} speed={0.22} color="#00d8ff" opacity={0.22} />

        {stops.map((s, i) => (
          <Pedestal
            key={s.id}
            index={i}
            position={positions[i]}
            label={s.label}
            state={stateByStop[s.id] || "default"}
            onClick={() => onStopClick(s.id)}
          />
        ))}

        {activeIndex >= 0 && overlayContent && (
          <Html
            position={[positions[activeIndex][0], 2.3, positions[activeIndex][2]]}
            center
            distanceFactor={8}
          >
            {overlayContent}
          </Html>
        )}

        <OrbitControls
          enablePan={false}
          minDistance={4}
          maxDistance={13}
          maxPolarAngle={Math.PI / 2.15}
        />
      </Canvas>
    </div>
  );
}
