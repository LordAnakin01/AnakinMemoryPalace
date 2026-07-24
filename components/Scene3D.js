"use client";

import { useMemo, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Html, Sparkles } from "@react-three/drei";
import * as THREE from "three";

const STOP_COLORS = {
  default: "#3c4c63",
  hover: "#5a6d8c",
  active: "#c9a02c",
  correct: "#7fa66b",
  wrong: "#b15c4a",
};

const ROOM_RADIUS = 7;
const ROOM_HEIGHT = 5.8;
const PEDESTAL_RADIUS = 4.2;
const COL_RADIUS = ROOM_RADIUS - 0.55;
const COL_COUNT = 12;

function layoutPositions(count) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    return [Math.cos(angle) * PEDESTAL_RADIUS, 0, Math.sin(angle) * PEDESTAL_RADIUS];
  });
}

function PalaceFloor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[ROOM_RADIUS, 48]} />
        <meshStandardMaterial color="#192030" roughness={0.92} metalness={0.08} />
      </mesh>
      {/* outer ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <ringGeometry args={[ROOM_RADIUS - 0.55, ROOM_RADIUS - 0.15, 48]} />
        <meshStandardMaterial color="#c9a02c" emissive="#c9a02c" emissiveIntensity={0.28} roughness={0.4} />
      </mesh>
      {/* pedestal ring band */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <ringGeometry args={[PEDESTAL_RADIUS + 0.7, PEDESTAL_RADIUS + 0.9, 48]} />
        <meshStandardMaterial color="#3c4c63" emissive="#3c4c63" emissiveIntensity={0.18} />
      </mesh>
      {/* center medallion glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <ringGeometry args={[1.45, 1.65, 48]} />
        <meshStandardMaterial color="#c9a02c" emissive="#c9a02c" emissiveIntensity={0.35} />
      </mesh>
      {/* center disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <circleGeometry args={[1.4, 48]} />
        <meshStandardMaterial color="#233043" roughness={0.75} />
      </mesh>
    </group>
  );
}

function PalaceWalls() {
  return (
    <group>
      {/* inner wall surface */}
      <mesh position={[0, ROOM_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[ROOM_RADIUS, ROOM_RADIUS, ROOM_HEIGHT, 24, 1, true]} />
        <meshStandardMaterial color="#1c2b3f" side={THREE.BackSide} roughness={0.92} />
      </mesh>
      {/* ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_HEIGHT, 0]}>
        <circleGeometry args={[ROOM_RADIUS, 24]} />
        <meshStandardMaterial color="#111820" side={THREE.BackSide} />
      </mesh>
      {/* ceiling centre glow */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_HEIGHT - 0.01, 0]}>
        <circleGeometry args={[1.9, 24]} />
        <meshStandardMaterial color="#c9a02c" emissive="#c9a02c" emissiveIntensity={0.18} side={THREE.BackSide} />
      </mesh>
      {/* baseboard */}
      <mesh position={[0, 0.26, 0]}>
        <torusGeometry args={[ROOM_RADIUS - 0.04, 0.22, 6, 48]} />
        <meshStandardMaterial color="#26374a" roughness={0.82} />
      </mesh>
      {/* cornice */}
      <mesh position={[0, ROOM_HEIGHT - 0.32, 0]}>
        <torusGeometry args={[ROOM_RADIUS - 0.04, 0.22, 6, 48]} />
        <meshStandardMaterial color="#26374a" roughness={0.82} />
      </mesh>
      {/* mid wall band (brass) */}
      <mesh position={[0, ROOM_HEIGHT * 0.54, 0]}>
        <torusGeometry args={[ROOM_RADIUS - 0.04, 0.06, 6, 48]} />
        <meshStandardMaterial color="#c9a02c" emissive="#c9a02c" emissiveIntensity={0.14} />
      </mesh>
    </group>
  );
}

function Column({ position }) {
  return (
    <group position={position}>
      {/* base */}
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.24, 0.3, 0.32, 8]} />
        <meshStandardMaterial color="#26374a" roughness={0.85} />
      </mesh>
      {/* shaft */}
      <mesh position={[0, ROOM_HEIGHT / 2 - 0.22, 0]}>
        <cylinderGeometry args={[0.16, 0.2, ROOM_HEIGHT - 1, 12]} />
        <meshStandardMaterial color="#2c3e55" roughness={0.86} />
      </mesh>
      {/* capital flare */}
      <mesh position={[0, ROOM_HEIGHT - 0.62, 0]}>
        <cylinderGeometry args={[0.3, 0.17, 0.32, 8]} />
        <meshStandardMaterial color="#26374a" roughness={0.85} />
      </mesh>
      {/* abacus block */}
      <mesh position={[0, ROOM_HEIGHT - 0.4, 0]}>
        <boxGeometry args={[0.68, 0.18, 0.68]} />
        <meshStandardMaterial color="#1c2b3f" roughness={0.85} />
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
    if (ringRef.current) ringRef.current.rotation.y += delta * 0.12;
  });

  return (
    <group position={[0, ROOM_HEIGHT - 0.45, 0]}>
      {/* central orb */}
      <mesh>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshStandardMaterial color="#c9a02c" emissive="#c9a02c" emissiveIntensity={3.5} />
      </mesh>
      <group ref={ringRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.78, 0.04, 6, 32]} />
          <meshStandardMaterial color="#8a7020" emissive="#c9a02c" emissiveIntensity={0.7} />
        </mesh>
        {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => (
          <mesh key={i} position={[Math.cos(angle) * 0.78, 0.42, Math.sin(angle) * 0.78]}>
            <cylinderGeometry args={[0.012, 0.012, 0.84, 4]} />
            <meshStandardMaterial color="#5a4a10" />
          </mesh>
        ))}
      </group>
      <pointLight intensity={3} color="#f4e9c9" distance={ROOM_RADIUS * 2.2} decay={1.4} />
    </group>
  );
}

function GemOrb({ state, active }) {
  const ref = useRef();
  const color = STOP_COLORS[state] || STOP_COLORS.default;
  const gemColor = state === "default" ? "#c9a02c" : color;

  useFrame(() => {
    if (!ref.current) return;
    ref.current.rotation.y += active ? 0.028 : 0.006;
    ref.current.position.y = active
      ? 1.35 + Math.sin(Date.now() * 0.003) * 0.1
      : 1.35;
  });

  return (
    <group ref={ref} position={[0, 1.35, 0]}>
      <mesh>
        <icosahedronGeometry args={[0.22, 1]} />
        <meshStandardMaterial
          color={gemColor}
          emissive={gemColor}
          emissiveIntensity={active ? 2.2 : 0.55}
          roughness={0.1}
          metalness={0.7}
        />
      </mesh>
      {active && <pointLight color={gemColor} intensity={4.5} distance={2.8} decay={2} />}
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
      {/* base plate */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.55, 0.62, 0.12, 16]} />
        <meshStandardMaterial color="#1e2d40" roughness={0.82} metalness={0.22} />
      </mesh>
      {/* shaft — clickable */}
      <mesh
        position={[0, 0.57, 0]}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[0.36, 0.46, 0.97, 16]} />
        <meshStandardMaterial
          color={shaftColor}
          emissive={active ? shaftColor : "#000000"}
          emissiveIntensity={active ? 0.55 : 0}
          roughness={0.58}
        />
      </mesh>
      {/* top cap */}
      <mesh position={[0, 1.09, 0]}>
        <cylinderGeometry args={[0.43, 0.37, 0.1, 16]} />
        <meshStandardMaterial color="#1e2d40" roughness={0.82} metalness={0.3} />
      </mesh>
      <GemOrb state={state} active={active} />
      <Text
        position={[0, -0.2, 0]}
        fontSize={0.2}
        color={hovered ? "#c9a02c" : "#8a93a6"}
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
    <div style={{ width: "100%", height: 440, borderRadius: 12, overflow: "hidden", border: "1px solid #3c4c63" }}>
      <Canvas camera={{ position: [0, 6, 10], fov: 50 }}>
        <color attach="background" args={["#0d1319"]} />
        <fog attach="fog" args={["#0d1319", 15, 28]} />

        <ambientLight intensity={0.18} color="#2a3a5a" />
        {/* wall fill lights — cool blue bounce */}
        <pointLight position={[ROOM_RADIUS - 1, 3, 0]} intensity={0.45} color="#2a4060" distance={11} decay={2} />
        <pointLight position={[-(ROOM_RADIUS - 1), 3, 0]} intensity={0.45} color="#2a4060" distance={11} decay={2} />
        <pointLight position={[0, 3, ROOM_RADIUS - 1]} intensity={0.45} color="#2a4060" distance={11} decay={2} />
        <pointLight position={[0, 3, -(ROOM_RADIUS - 1)]} intensity={0.45} color="#2a4060" distance={11} decay={2} />

        <PalaceFloor />
        <PalaceWalls />
        <Columns />
        <Chandelier />

        <Sparkles count={55} scale={14} size={0.55} speed={0.14} color="#c9a02c" opacity={0.11} />

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
