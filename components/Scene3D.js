"use client";

import { useMemo, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Sparkles } from "@react-three/drei";
import * as THREE from "three";

const STOP_COLORS = {
  default: "#8a7550",
  hover:   "#c9a02c",
  active:  "#ffc300",
  correct: "#00c853",
  wrong:   "#ff4444",
};

// Grounds run along Z: the gate sits at the near/front edge, the manor at
// the far end — stops are laid out as waypoints along that central path,
// echoing a real estate's gate-to-residence promenade.
const GROUND_WIDTH = 15;
const GROUND_DEPTH = 22;
const GATE_Z = GROUND_DEPTH / 2 - 1.6;
const MANSION_Z = -GROUND_DEPTH / 2 + 3.4;
const GATE_GAP = 2.4;

function layoutPositions(count) {
  if (count === 0) return [];
  return Array.from({ length: count }, (_, i) => {
    const t = (i + 1) / (count + 1);
    const z = THREE.MathUtils.lerp(GATE_Z - 1.6, MANSION_Z + 3.8, t);
    const side = i % 2 === 0 ? 1 : -1;
    const bulge = Math.sin(t * Math.PI) * 0.7;
    return [side * (1.9 + bulge), 0, z];
  });
}

function Lawn() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[GROUND_WIDTH, GROUND_DEPTH]} />
      <meshStandardMaterial color="#2e4d33" roughness={0.95} />
    </mesh>
  );
}

function Walkway() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
      <planeGeometry args={[1.7, GROUND_DEPTH - 2]} />
      <meshStandardMaterial color="#cbbfa0" roughness={0.8} />
    </mesh>
  );
}

function HedgeBorder() {
  const th = 0.6;
  const h = 0.55;
  const sideLen = (GROUND_WIDTH - GATE_GAP) / 2;
  const color = "#24401f";
  return (
    <group>
      <mesh position={[-(GATE_GAP / 2 + sideLen / 2), h / 2, GROUND_DEPTH / 2 - th / 2]}>
        <boxGeometry args={[sideLen, h, th]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[GATE_GAP / 2 + sideLen / 2, h / 2, GROUND_DEPTH / 2 - th / 2]}>
        <boxGeometry args={[sideLen, h, th]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0, h / 2, -GROUND_DEPTH / 2 + th / 2]}>
        <boxGeometry args={[GROUND_WIDTH, h, th]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[GROUND_WIDTH / 2 - th / 2, h / 2, 0]}>
        <boxGeometry args={[th, h, GROUND_DEPTH]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[-GROUND_WIDTH / 2 + th / 2, h / 2, 0]}>
        <boxGeometry args={[th, h, GROUND_DEPTH]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
    </group>
  );
}

function Gate() {
  const pillarH = 1.8;
  return (
    <group position={[0, 0, GROUND_DEPTH / 2]}>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (GATE_GAP / 2 + 0.3), 0, 0]}>
          <mesh position={[0, pillarH / 2, 0]}>
            <boxGeometry args={[0.5, pillarH, 0.5]} />
            <meshStandardMaterial color="#e4d9bd" roughness={0.6} />
          </mesh>
          <mesh position={[0, pillarH + 0.15, 0]}>
            <sphereGeometry args={[0.22, 12, 12]} />
            <meshStandardMaterial color="#c9a02c" emissive="#c9a02c" emissiveIntensity={0.5} roughness={0.4} metalness={0.4} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, pillarH + 0.3, 0]}>
        <boxGeometry args={[GATE_GAP + 1.2, 0.15, 0.15]} />
        <meshStandardMaterial color="#c9a02c" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}

function Tree({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.08, 0.11, 0.7, 6]} />
        <meshStandardMaterial color="#4a3524" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <coneGeometry args={[0.55, 1.3, 8]} />
        <meshStandardMaterial color="#2f5233" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.35, 0]}>
        <coneGeometry args={[0.4, 0.9, 8]} />
        <meshStandardMaterial color="#356339" roughness={0.85} />
      </mesh>
    </group>
  );
}

function TreeRows() {
  const count = 7;
  const inset = 1.1;
  const positions = [];
  for (let i = 0; i < count; i++) {
    const z = THREE.MathUtils.lerp(-GROUND_DEPTH / 2 + 1.5, GROUND_DEPTH / 2 - 1.5, i / (count - 1));
    positions.push([GROUND_WIDTH / 2 - inset, 0, z]);
    positions.push([-GROUND_WIDTH / 2 + inset, 0, z]);
  }
  return positions.map((p, i) => <Tree key={i} position={p} />);
}

function GardenBed({ position, color }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={position}>
      <ringGeometry args={[0.5, 0.85, 24]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} roughness={0.7} />
    </mesh>
  );
}

function GardenBeds() {
  const beds = [
    [3.6, 4.6, "#d9558f"],
    [-3.6, 4.6, "#d9558f"],
    [3.4, -2.2, "#7050b0"],
    [-3.4, -2.2, "#7050b0"],
  ];
  return beds.map(([x, z, color], i) => <GardenBed key={i} position={[x, 0.02, z]} color={color} />);
}

function Fountain() {
  const z = MANSION_Z + 5.5;
  return (
    <group position={[0, 0, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <circleGeometry args={[1.7, 32]} />
        <meshStandardMaterial color="#1c3b42" roughness={0.25} metalness={0.1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[1.7, 1.85, 32]} />
        <meshStandardMaterial color="#d8cdb2" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.14, 0.18, 1.0, 10]} />
        <meshStandardMaterial color="#c9a02c" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <sphereGeometry args={[0.22, 14, 14]} />
        <meshStandardMaterial color="#ffe8a3" emissive="#ffc300" emissiveIntensity={0.8} roughness={0.3} metalness={0.4} />
      </mesh>
      <pointLight position={[0, 1.2, 0]} intensity={1.6} color="#ffd9a0" distance={5} decay={2} />
      <Sparkles count={20} scale={[2.2, 1.2, 2.2]} size={1.1} speed={0.4} color="#bfe8ff" opacity={0.5} />
    </group>
  );
}

function Mansion() {
  return (
    <group position={[0, 0, MANSION_Z]}>
      <mesh position={[0, 0.08, 1.3]}>
        <boxGeometry args={[4.6, 0.16, 1.0]} />
        <meshStandardMaterial color="#d8cdb2" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.24, 0.9]}>
        <boxGeometry args={[4.0, 0.16, 0.9]} />
        <meshStandardMaterial color="#d8cdb2" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[5.2, 1.8, 2.2]} />
        <meshStandardMaterial color="#e7ddc4" roughness={0.6} />
      </mesh>
      {[-1.8, -0.9, 0.9, 1.8].map((x) => (
        <mesh key={x} position={[x, 1.5, 1.15]}>
          <cylinderGeometry args={[0.16, 0.18, 2.0, 10]} />
          <meshStandardMaterial color="#f2ead6" roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 2.9, -0.6]}>
        <boxGeometry args={[3.2, 1.4, 1.6]} />
        <meshStandardMaterial color="#e7ddc4" roughness={0.6} />
      </mesh>
      <mesh position={[0, 2.55, 0.2]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[3.1, 1.0, 4]} />
        <meshStandardMaterial color="#8a7550" roughness={0.6} />
      </mesh>
      <pointLight position={[0, 2.2, 1.6]} intensity={2.5} color="#ffdca0" distance={7} decay={2} />
    </group>
  );
}

function GemOrb({ state, active }) {
  const ref = useRef();
  const color = STOP_COLORS[state] || STOP_COLORS.default;
  const gemColor = state === "default" ? "#c9a02c" : color;

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
        <icosahedronGeometry args={[0.22, 1]} />
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
        <cylinderGeometry args={[0.5, 0.58, 0.12, 16]} />
        <meshStandardMaterial color="#e7ddc4" roughness={0.6} />
      </mesh>
      <mesh
        position={[0, 0.57, 0]}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[0.32, 0.4, 0.97, 16]} />
        <meshStandardMaterial
          color={shaftColor}
          emissive={shaftColor}
          emissiveIntensity={active ? 1.0 : 0.25}
          roughness={0.45}
          metalness={0.2}
        />
      </mesh>
      <mesh position={[0, 1.09, 0]}>
        <cylinderGeometry args={[0.4, 0.34, 0.1, 16]} />
        <meshStandardMaterial color="#e7ddc4" roughness={0.6} />
      </mesh>
      <GemOrb state={state} active={active} />
      <Html position={[0, -0.3, 0]} center distanceFactor={11} style={{ pointerEvents: "none" }}>
        <div
          className="mp-mono"
          style={{
            fontSize: 12,
            color: hovered ? "#ffc300" : "#f2ead6",
            textShadow: "0 1px 5px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.9)",
            whiteSpace: "nowrap",
            textAlign: "center",
          }}
        >
          {index + 1}. {label}
        </div>
      </Html>
    </group>
  );
}

export default function Scene3D({ stops, stateByStop = {}, activeStopId, onStopClick, overlayContent }) {
  const positions = useMemo(() => layoutPositions(stops.length), [stops.length]);
  const activeIndex = stops.findIndex((s) => s.id === activeStopId);

  return (
    <div style={{ width: "100%", height: 460, borderRadius: 12, overflow: "hidden", border: "1px solid #3c4c63" }}>
      <Canvas camera={{ position: [0, 16, 20], fov: 40 }}>
        <color attach="background" args={["#26364a"]} />
        <fog attach="fog" args={["#26364a", 22, 46]} />

        <ambientLight intensity={0.65} color="#9fb0c9" />
        <directionalLight position={[10, 12, 6]} intensity={1.5} color="#ffd9a0" />
        <directionalLight position={[-8, 6, -4]} intensity={0.35} color="#7fa6c9" />

        <Lawn />
        <Walkway />
        <HedgeBorder />
        <Gate />
        <TreeRows />
        <GardenBeds />
        <Fountain />
        <Mansion />

        <Sparkles count={40} scale={[GROUND_WIDTH - 1, 3, GROUND_DEPTH - 1]} size={0.8} speed={0.15} color="#ffe8a3" opacity={0.35} />

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
            position={[positions[activeIndex][0], 2.1, positions[activeIndex][2]]}
            center
            distanceFactor={11}
          >
            {overlayContent}
          </Html>
        )}

        <OrbitControls
          enablePan={false}
          minDistance={10}
          maxDistance={32}
          maxPolarAngle={Math.PI / 2.3}
        />
      </Canvas>
    </div>
  );
}
