import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, RADIUS } from "../theme";
import { AppWindow, MockButton, WaveformSvg } from "./ui";

export function ShareScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const windowOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    config: { damping: 22 },
  });

  // URL bar appears at frame 20
  const urlOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const urlX = interpolate(frame, [20, 40], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "Copied!" toast pops in at frame 35
  const toastOpacity = interpolate(frame, [35, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const toastY = interpolate(frame, [35, 50], [12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fork card slides in at frame 80
  const forkOpacity = interpolate(frame, [80, 100], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const forkY = interpolate(frame, [80, 100], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const labelOpacity = spring({
    frame: frame - 5,
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
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT,
        position: "relative",
      }}
    >
      {/* Step label */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: "50%",
          transform: "translateX(-50%)",
          opacity: labelOpacity,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            background: C.primary,
            color: C.primaryFg,
            fontSize: 16,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          4
        </div>
        <span style={{ fontSize: 24, color: C.mutedFg, fontWeight: 500 }}>
          Publish, share, and let others fork your scene
        </span>
      </div>

      {/* Toast */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: "50%",
          transform: `translateX(-50%) translateY(${toastY}px)`,
          opacity: toastOpacity,
          background: C.card,
          border: `1px solid ${C.primary}50`,
          borderRadius: RADIUS,
          padding: "10px 20px",
          fontSize: 14,
          color: C.fg,
          fontWeight: 500,
          boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${C.primary}30`,
          display: "flex",
          alignItems: "center",
          gap: 8,
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ color: "#22c55e" }}>✓</span>
        Scene published and link copied!
      </div>

      <div style={{ opacity: windowOpacity }}>
        <AppWindow>
          <div
            style={{
              padding: "32px 48px",
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            {/* Scene header */}
            <div
              style={{
                background: C.card,
                border: `1px solid ${C.cardBorder}`,
                borderRadius: RADIUS,
                padding: "20px 26px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <WaveformSvg color={C.primary} size={28} />
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: C.fg,
                    letterSpacing: "-0.3px",
                    fontFamily: FONT,
                  }}
                >
                  Rainy Tokyo Street at Night
                </span>
              </div>

              {/* Action row */}
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <MockButton style={{ gap: 8, padding: "9px 20px" }}>
                  ▶ Play
                </MockButton>
                <MockButton
                  style={{
                    background: `${C.primary}22`,
                    border: `1px solid ${C.primary}60`,
                    color: C.primary,
                  }}
                  variant="secondary"
                >
                  👁 Unpublish
                </MockButton>
              </div>

              {/* Shared URL */}
              <div
                style={{
                  opacity: urlOpacity,
                  transform: `translateX(${urlX}px)`,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: C.muted,
                  borderRadius: RADIUS,
                  padding: "10px 14px",
                }}
              >
                <span style={{ fontSize: 20, color: C.primary }}>🔗</span>
                <code
                  style={{
                    flex: 1,
                    fontSize: 15,
                    color: C.fg,
                    fontFamily: "monospace",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  soundscaper.nicobaier.com/scene/rainy-tokyo-abc123
                </code>
                <span style={{ fontSize: 15, color: C.mutedFg, flexShrink: 0 }}>
                  Copied!
                </span>
              </div>
            </div>

            {/* Fork callout */}
            <div
              style={{
                opacity: forkOpacity,
                transform: `translateY(${forkY}px)`,
                background: `linear-gradient(135deg, ${C.card} 0%, ${C.primary}18 100%)`,
                border: `1px solid ${C.primary}40`,
                borderRadius: RADIUS,
                padding: "18px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    marginBottom: 6,
                    fontSize: 18,
                    fontWeight: 600,
                    color: C.fg,
                    fontFamily: FONT,
                  }}
                >
                  Someone else's scene? Make it yours.
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 15,
                    color: C.mutedFg,
                    fontFamily: FONT,
                  }}
                >
                  Fork any public soundscape and remix the layers.
                </p>
              </div>
              <MockButton style={{ flexShrink: 0, whiteSpace: "nowrap" }}>
                ⑂ Make It Yours
              </MockButton>
            </div>
          </div>
        </AppWindow>
      </div>
    </div>
  );
}
