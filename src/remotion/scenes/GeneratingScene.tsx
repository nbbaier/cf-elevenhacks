import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "../theme";
import { AppWindow, LAYER_DATA, LayerBar } from "./ui";

export function GeneratingScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const windowOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    config: { damping: 22 },
  });

  // Each layer appears every 40 frames
  const LAYER_INTERVAL = 40;
  const visibleCount = Math.floor(frame / LAYER_INTERVAL) + 1;

  // Spinner rotation
  const spinDeg = frame * 6;

  // "Designing your soundscape..." fades to "1 of 5 layers ready" etc.
  const headerText =
    frame < LAYER_INTERVAL
      ? "Designing your soundscape..."
      : `${Math.min(visibleCount - 1, LAYER_DATA.length)} of ${LAYER_DATA.length} layers ready`;

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
          gap: 10,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            background: C.primary,
            color: C.primaryFg,
            fontSize: 13,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          2
        </div>
        <span style={{ fontSize: 18, color: C.mutedFg, fontWeight: 500 }}>
          ElevenLabs generates each audio layer
        </span>
      </div>

      <div style={{ opacity: windowOpacity }}>
        <AppWindow>
          <div
            style={{
              padding: "28px 40px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {/* Progress card */}
            <div
              style={{
                background: C.card,
                border: `1px solid ${C.cardBorder}`,
                borderRadius: 10,
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              {/* Spinner */}
              <svg
                height={18}
                style={{ transform: `rotate(${spinDeg}deg)`, flexShrink: 0 }}
                viewBox="0 0 18 18"
                width={18}
              >
                <circle
                  cx={9}
                  cy={9}
                  fill="none"
                  r={7}
                  stroke={C.primary}
                  strokeDasharray="22 22"
                  strokeLinecap="round"
                  strokeWidth={2.5}
                />
              </svg>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: C.fg,
                  fontFamily: FONT,
                }}
              >
                {headerText}
              </span>
            </div>

            {/* Layer label */}
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: C.mutedFg,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontFamily: FONT,
              }}
            >
              Layers (
              {Math.max(0, Math.min(visibleCount - 1, LAYER_DATA.length))})
            </div>

            {/* Layers */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {LAYER_DATA.map((layer, i) => {
                const layerFrame = frame - i * LAYER_INTERVAL;
                const isVisible = layerFrame >= 0;
                const isGenerating =
                  layerFrame >= 0 && layerFrame < LAYER_INTERVAL;
                const isDone = layerFrame >= LAYER_INTERVAL;

                if (!isVisible) {
                  return null;
                }

                const itemOpacity = interpolate(layerFrame, [0, 12], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
                const itemY = interpolate(layerFrame, [0, 20], [12, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });

                return (
                  <div
                    key={layer.label}
                    style={{
                      opacity: itemOpacity,
                      transform: `translateY(${itemY}px)`,
                    }}
                  >
                    <LayerBar
                      color={layer.color}
                      enabled={isDone}
                      frame={frame}
                      generating={isGenerating}
                      label={layer.label}
                      volume={layer.volume}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </AppWindow>
      </div>
    </div>
  );
}
