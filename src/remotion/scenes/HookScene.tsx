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

  // Pulsing glow scale
  const glowScale = 1 + 0.08 * Math.sin(frame * 0.06);
  // Drifting secondary orb
  const orbX = 60 * Math.sin(frame * 0.025);
  const orbY = 40 * Math.cos(frame * 0.018);

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
      {/* Primary pulsing radial glow */}
      <div
        style={{
          position: "absolute",
          width: 1100,
          height: 1100,
          borderRadius: 999,
          background: `radial-gradient(circle, ${C.primary}20 0%, transparent 65%)`,
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${glowScale})`,
          pointerEvents: "none",
        }}
      />

      {/* Drifting secondary orb */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: 999,
          background: "radial-gradient(circle, #60a5fa18 0%, transparent 70%)",
          top: `calc(30% + ${orbY}px)`,
          left: `calc(65% + ${orbX}px)`,
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      />

      {/* Waveform icon */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          marginBottom: 28,
        }}
      >
        <WaveformSvg animated color={C.primary} frame={frame} size={96} />
      </div>

      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontSize: 104,
          fontWeight: 800,
          color: C.fg,
          letterSpacing: "-3px",
          marginBottom: 20,
        }}
      >
        Soundscaper
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          fontSize: 36,
          color: C.mutedFg,
          fontWeight: 400,
          letterSpacing: "-0.4px",
          marginBottom: 60,
          textAlign: "center",
          maxWidth: 800,
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
          gap: 10,
          width: 720,
          marginBottom: 48,
        }}
      >
        {LAYER_DATA.map((l, i) => {
          const itemOpacity = interpolate(frame - 35 - i * 6, [0, 15], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const itemScale = interpolate(
            frame - 35 - i * 6,
            [0, 20],
            [0.94, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }
          );
          return (
            <div
              key={l.label}
              style={{ opacity: itemOpacity, transform: `scale(${itemScale})` }}
            >
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
          fontSize: 20,
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
