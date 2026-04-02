import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

export const MyComposition = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const opacity = frame / durationInFrames;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0f0f0f",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{ opacity, color: "white", fontSize: 64, fontWeight: "bold" }}
      >
        Hello from Remotion
      </div>
    </AbsoluteFill>
  );
};
