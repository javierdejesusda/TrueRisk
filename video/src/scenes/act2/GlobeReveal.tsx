import { useCurrentFrame, spring, interpolate } from "remotion";
import { useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { COLORS, VIDEO } from "../../lib/constants";

const EarthMesh: React.FC = () => {
  const frame = useCurrentFrame();

  const wireframeScale = spring({ frame, fps: VIDEO.fps, config: { damping: 15 } });
  const solidOpacity = interpolate(frame, [30, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const wireframeOpacity = interpolate(frame, [30, 80], [1, 0.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rotationY = -0.2 + frame * 0.003;
  const rotationX = 0.3;

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 3, 5]} intensity={1.2} color="#84CC16" />
      <mesh rotation={[rotationX, rotationY, 0]} scale={[wireframeScale, wireframeScale, wireframeScale]}>
        <sphereGeometry args={[2.01, 64, 64]} />
        <meshBasicMaterial color="#84CC16" wireframe transparent opacity={wireframeOpacity} />
      </mesh>
      <mesh rotation={[rotationX, rotationY, 0]}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial color="#0C0C14" emissive="#84CC16" emissiveIntensity={0.1} transparent opacity={solidOpacity} />
      </mesh>
    </>
  );
};

export const GlobeReveal: React.FC = () => {
  const { width, height } = useVideoConfig();
  return (
    <div style={{ width, height, backgroundColor: COLORS.bg }}>
      <ThreeCanvas width={width} height={height}>
        <EarthMesh />
      </ThreeCanvas>
    </div>
  );
};
