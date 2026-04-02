import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, RADIUS } from "../theme";
import { AppWindow, MockButton, MockCard } from "./ui";

const PROMPT = "Rainy Tokyo street at night";
const PRESETS = [
  "Campfire in the woods",
  "Busy spaceport",
  "Underwater coral reef",
  "Cozy library",
];

export function CreateScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Window slides up
  const windowY = spring({
    frame,
    fps,
    from: 60,
    to: 0,
    config: { damping: 22, mass: 0.9 },
  });
  const windowOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    config: { damping: 22 },
  });

  // Typing starts at frame 20, types one char every 4 frames
  const charsVisible = Math.floor(
    interpolate(frame, [20, 20 + PROMPT.length * 4], [0, PROMPT.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const typedText = PROMPT.slice(0, charsVisible);
  const showCursor = frame > 20 && charsVisible < PROMPT.length;

  // Button lights up after typing finishes
  const typingDone = charsVisible >= PROMPT.length;
  const buttonGlow = typingDone
    ? spring({
        frame: frame - 20 - PROMPT.length * 4 - 10,
        fps,
        from: 0,
        to: 1,
        config: { damping: 14 },
      })
    : 0;

  // "Click" at frame 20+PROMPT.length*4+30 → button scales down briefly
  const clickFrame = 20 + PROMPT.length * 4 + 30;
  const buttonScale =
    frame >= clickFrame
      ? spring({
          frame: frame - clickFrame,
          fps,
          from: 0.95,
          to: 1,
          config: { damping: 12, stiffness: 300 },
        })
      : 1;

  // Label callout fade
  const labelOpacity = spring({
    frame: frame - 15,
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
          1
        </div>
        <span style={{ fontSize: 24, color: C.mutedFg, fontWeight: 500 }}>
          Describe your scene in plain language
        </span>
      </div>

      <div
        style={{
          opacity: windowOpacity,
          transform: `translateY(${windowY}px)`,
        }}
      >
        <AppWindow>
          <div
            style={{
              padding: "44px 60px",
              display: "flex",
              flexDirection: "column",
              gap: 28,
            }}
          >
            {/* Hero text */}
            <div style={{ textAlign: "center", marginBottom: 8 }}>
              <h1
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: C.fg,
                  letterSpacing: "-0.5px",
                  margin: 0,
                  marginBottom: 10,
                }}
              >
                Soundscaper
              </h1>
              <p style={{ fontSize: 18, color: C.mutedFg, margin: 0 }}>
                Describe any scene. AI generates a layered ambient soundscape
                you can mix, customize, and share.
              </p>
            </div>

            {/* Input card */}
            <MockCard
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              <span style={{ fontSize: 16, fontWeight: 600, color: C.fg }}>
                Describe your scene
              </span>
              {/* Textarea mock */}
              <div
                style={{
                  background: C.muted,
                  border: `1px solid ${C.cardBorder}`,
                  borderRadius: RADIUS,
                  padding: "14px 18px",
                  minHeight: 90,
                  fontSize: 18,
                  color: C.fg,
                  lineHeight: 1.5,
                  fontFamily: FONT,
                }}
              >
                {typedText}
                {showCursor && (
                  <span
                    style={{
                      display: "inline-block",
                      width: 2,
                      height: "1em",
                      background: C.primary,
                      marginLeft: 1,
                      verticalAlign: "text-bottom",
                      opacity: Math.round(frame / 15) % 2 === 0 ? 1 : 0,
                    }}
                  />
                )}
              </div>

              {/* Layer count row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: 15, color: C.mutedFg }}>
                  Number of layers
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {["−", "5", "+"].map((t, i) => (
                    <div
                      key={i}
                      style={{
                        width: i === 1 ? 26 : 32,
                        height: 32,
                        borderRadius: 6,
                        background: i === 1 ? "transparent" : C.muted,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: i === 1 ? 18 : 15,
                        fontWeight: i === 1 ? 700 : 400,
                        color: i === 1 ? C.fg : C.mutedFg,
                      }}
                    >
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              {/* Generate button */}
              <div
                style={{
                  transform: `scale(${buttonScale})`,
                  transformOrigin: "center",
                }}
              >
                <MockButton
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    padding: "14px 0",
                    fontSize: 18,
                    boxShadow: `0 0 ${28 * buttonGlow}px ${C.primary}60`,
                    opacity: 0.4 + 0.6 * buttonGlow,
                  }}
                >
                  ✦ Generate Soundscape
                </MockButton>
              </div>
            </MockCard>

            {/* Presets */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                justifyContent: "center",
              }}
            >
              {PRESETS.map((p) => (
                <div
                  key={p}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 999,
                    border: `1px solid ${C.cardBorder}`,
                    fontSize: 15,
                    color: C.mutedFg,
                    fontFamily: FONT,
                  }}
                >
                  {p}
                </div>
              ))}
            </div>
          </div>
        </AppWindow>
      </div>
    </div>
  );
}
