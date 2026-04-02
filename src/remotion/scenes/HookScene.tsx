import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "../theme";
import { LAYER_DATA, LayerBar, WaveformSvg } from "./ui";

export function HookScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    config: { damping: 18, mass: 0.8 },
  });
  const titleY = spring({
    frame,
    fps,
    from: 40,
    to: 0,
    config: { damping: 18, mass: 0.8 },
  });

  const taglineOpacity = spring({
    frame: frame - 18,
    fps,
    from: 0,
    to: 1,
    config: { damping: 18 },
  });
  const taglineY = spring({
    frame: frame - 18,
    fps,
    from: 20,
    to: 0,
    config: { damping: 18 },
  });

  const layersOpacity = spring({
    frame: frame - 30,
    fps,
    from: 0,
    to: 1,
    config: { damping: 20 },
  });

  const badgeOpacity = spring({
    frame: frame - 50,
    fps,
    from: 0,
    to: 1,
    config: { damping: 18 },
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
        fontFamily: FONT,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle radial glow */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          borderRadius: 999,
          background: `radial-gradient(circle, ${C.primary}18 0%, transparent 70%)`,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      />

      {/* Waveform icon */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          marginBottom: 24,
        }}
      >
        <WaveformSvg animated color={C.primary} frame={frame} size={64} />
      </div>

      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontSize: 72,
          fontWeight: 800,
          color: C.fg,
          letterSpacing: "-2px",
          marginBottom: 16,
        }}
      >
        Soundscaper
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          fontSize: 26,
          color: C.mutedFg,
          fontWeight: 400,
          letterSpacing: "-0.3px",
          marginBottom: 52,
          textAlign: "center",
          maxWidth: 600,
        }}
      >
        Type a scene.{" "}
        <span style={{ color: C.primary, fontWeight: 600 }}>
          Hear it come alive.
        </span>
      </div>

      {/* Live layers preview */}
      <div
        style={{
          opacity: layersOpacity,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          width: 480,
          marginBottom: 40,
        }}
      >
        {LAYER_DATA.map((l, i) => {
          const itemOpacity = interpolate(frame - 35 - i * 6, [0, 15], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div key={l.label} style={{ opacity: itemOpacity }}>
              <LayerBar
                color={l.color}
                enabled
                frame={frame}
                label={l.label}
                volume={l.volume}
              />
            </div>
          );
        })}
      </div>

      {/* Caption */}
      <div
        style={{
          opacity: badgeOpacity,
          fontSize: 15,
          color: C.mutedFg,
          fontStyle: "italic",
          letterSpacing: "0.1px",
        }}
      >
        From a single sentence → 5 AI-generated audio layers
      </div>
    </div>
  );
}
