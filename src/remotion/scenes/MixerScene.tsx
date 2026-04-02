import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, RADIUS } from "../theme";
import { AppWindow, LAYER_DATA, MockButton, WaveformSvg } from "./ui";

// Volume slider mock
function VolumeSlider({
  volume,
  color,
  frame,
}: {
  volume: number;
  color: string;
  frame: number;
}) {
  // Slightly animate volume over time for visual interest
  const animated = volume + 0.08 * Math.sin(frame * 0.04 + volume * 10);
  const pct = Math.max(0, Math.min(1, animated)) * 100;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
      <div
        style={{
          flex: 1,
          height: 4,
          background: C.muted,
          borderRadius: 999,
          position: "relative",
          overflow: "visible",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: 999,
          }}
        />
        {/* Thumb */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: `${pct}%`,
            transform: "translate(-50%, -50%)",
            width: 12,
            height: 12,
            borderRadius: 999,
            background: color,
            border: `2px solid ${C.bg}`,
            boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
          }}
        />
      </div>
    </div>
  );
}

// Pan slider mock
function PanSlider({ pan, color }: { pan: number; color: string }) {
  // pan: -1 to 1, default 0 (center)
  const pct = ((pan + 1) / 2) * 100;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span
        style={{
          fontSize: 10,
          color: C.mutedFg,
          width: 10,
          textAlign: "center",
        }}
      >
        L
      </span>
      <div
        style={{
          width: 52,
          height: 3,
          background: C.muted,
          borderRadius: 999,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: `${pct}%`,
            transform: "translate(-50%, -50%)",
            width: 10,
            height: 10,
            borderRadius: 999,
            background: color,
            border: `2px solid ${C.bg}`,
          }}
        />
      </div>
      <span
        style={{
          fontSize: 10,
          color: C.mutedFg,
          width: 10,
          textAlign: "center",
        }}
      >
        R
      </span>
    </div>
  );
}

const PAN_VALUES = [0, -0.3, 0.2, -0.1, 0.4];
// Which layer gets "toggled off" mid-scene (traffic hum) for demo purposes
const TOGGLE_LAYER = 1;

export function MixerScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const windowOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    config: { damping: 22 },
  });

  // Play button "clicked" at frame 20
  const isPlaying = frame >= 20;
  const playScale =
    frame >= 20 && frame <= 30
      ? spring({
          frame: frame - 20,
          fps,
          from: 0.92,
          to: 1,
          config: { damping: 12, stiffness: 400 },
        })
      : 1;

  // Layer 1 (traffic) toggled off at frame 100, back on at frame 160
  const trafficEnabled = !(frame >= 100 && frame < 160);

  // Share button highlight starts at frame 200
  const shareGlow = interpolate(frame, [200, 230], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Waveform amplitude: active when playing
  const waveAmp = isPlaying ? 1 : 0.15;

  const labelOpacity = spring({
    frame: frame - 5,
    fps,
    from: 0,
    to: 1,
    config: { damping: 18 },
  });

  // Callout for "adjust layers" appears at frame 60
  const calloutOpacity = interpolate(frame, [60, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
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
          3
        </div>
        <span style={{ fontSize: 18, color: C.mutedFg, fontWeight: 500 }}>
          Mix layers live — volume, pan, enable/disable
        </span>
      </div>

      {/* Callout: "Toggle any layer" */}
      {frame >= 90 && frame < 170 && (
        <div
          style={{
            position: "absolute",
            right: 120,
            top: "48%",
            opacity: calloutOpacity,
            background: C.card,
            border: `1px solid ${C.primary}60`,
            borderRadius: RADIUS,
            padding: "8px 14px",
            fontSize: 13,
            color: C.primary,
            fontWeight: 500,
            whiteSpace: "nowrap",
            boxShadow: `0 4px 20px ${C.primary}20`,
          }}
        >
          ← toggle any layer on/off
        </div>
      )}

      <div style={{ opacity: windowOpacity }}>
        <AppWindow>
          <div
            style={{
              padding: "24px 36px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {/* Scene header card */}
            <div
              style={{
                background: C.card,
                border: `1px solid ${C.cardBorder}`,
                borderRadius: RADIUS,
                padding: "16px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <WaveformSvg
                  animated={isPlaying}
                  color={C.primary}
                  frame={frame}
                  size={22}
                />
                <span
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: C.fg,
                    letterSpacing: "-0.3px",
                    fontFamily: FONT,
                  }}
                >
                  Rainy Tokyo Street at Night
                </span>
              </div>
              <span
                style={{ fontSize: 12, color: C.mutedFg, fontFamily: FONT }}
              >
                by you
              </span>

              {/* Play / Share row */}
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ transform: `scale(${playScale})` }}>
                  <MockButton
                    style={{
                      gap: 8,
                      padding: "9px 20px",
                      background: isPlaying ? C.primary : C.muted,
                      color: isPlaying ? C.primaryFg : C.fg,
                    }}
                  >
                    {isPlaying ? "⏸ Pause" : "▶ Play"}
                  </MockButton>
                </div>
                <MockButton
                  style={{
                    boxShadow: `0 0 ${16 * shareGlow}px ${C.primary}50`,
                    border:
                      shareGlow > 0.3 ? `1px solid ${C.primary}60` : "none",
                  }}
                  variant="secondary"
                >
                  ⤴ Share
                </MockButton>
              </div>
            </div>

            {/* Layers label */}
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
              Layers (5)
            </div>

            {/* Layer rows */}
            {LAYER_DATA.map((layer, i) => {
              const enabled = i === TOGGLE_LAYER ? trafficEnabled : true;
              const rowOpacity = enabled ? 1 : 0.4;

              return (
                <div
                  key={layer.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    background: C.card,
                    border: `1px solid ${C.cardBorder}`,
                    borderLeft: `3px solid ${enabled ? layer.color : C.muted}`,
                    borderRadius: RADIUS,
                    opacity: rowOpacity,
                    transition: "opacity 0.2s",
                  }}
                >
                  {/* Toggle */}
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      background: enabled ? layer.color : C.muted,
                      border: `1.5px solid ${enabled ? layer.color : C.mutedFg}`,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      color: C.bg,
                      fontWeight: 700,
                    }}
                  >
                    {enabled ? "✓" : ""}
                  </div>

                  {/* Name */}
                  <span
                    style={{
                      width: 160,
                      fontSize: 12,
                      fontWeight: 500,
                      color: enabled ? C.fg : C.mutedFg,
                      fontFamily: FONT,
                      flexShrink: 0,
                    }}
                  >
                    {layer.label}
                  </span>

                  {/* Volume slider */}
                  <VolumeSlider
                    color={layer.color}
                    frame={frame}
                    volume={layer.volume}
                  />

                  {/* Pan */}
                  <PanSlider color={layer.color} pan={PAN_VALUES[i]} />
                </div>
              );
            })}
          </div>
        </AppWindow>
      </div>
    </div>
  );
}
