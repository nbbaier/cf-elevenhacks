import type { CSSProperties, ReactNode } from "react";
import { C, FONT, RADIUS } from "../theme";

// ── Shared UI mock components ─────────────────────────────────────────────────

export function AppWindow({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: 1380,
        background: C.bg,
        borderRadius: RADIUS * 1.6,
        overflow: "hidden",
        boxShadow:
          "0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.07)",
        fontFamily: FONT,
      }}
    >
      {/* Browser chrome */}
      <div
        style={{
          background: C.card,
          borderBottom: `1px solid ${C.cardBorder}`,
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          {["#ef4444", "#f59e0b", "#22c55e"].map((c) => (
            <div
              key={c}
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                background: c,
              }}
            />
          ))}
        </div>
        <div
          style={{
            flex: 1,
            background: C.muted,
            borderRadius: 8,
            padding: "5px 14px",
            fontSize: 14,
            color: C.mutedFg,
            fontFamily: FONT,
          }}
        >
          soundscaper.nicobaier.com
        </div>
      </div>

      {/* App header */}
      <div
        style={{
          background: C.card,
          borderBottom: `1px solid ${C.cardBorder}`,
          padding: "14px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <WaveformSvg color={C.primary} size={24} />
          <span
            style={{
              fontWeight: 700,
              fontSize: 18,
              color: C.fg,
              letterSpacing: "-0.3px",
              fontFamily: FONT,
            }}
          >
            Soundscaper
          </span>
        </div>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            background: C.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            color: C.primaryFg,
            fontFamily: FONT,
          }}
        >
          N
        </div>
      </div>

      {children}
    </div>
  );
}

export function MockCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.cardBorder}`,
        borderRadius: RADIUS,
        padding: "20px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function MockButton({
  children,
  variant = "primary",
  style,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline";
  style?: CSSProperties;
}) {
  let bg: string;
  if (variant === "primary") {
    bg = C.primary;
  } else if (variant === "secondary") {
    bg = C.muted;
  } else {
    bg = "transparent";
  }

  let color: string;
  if (variant === "primary") {
    color = C.primaryFg;
  } else if (variant === "outline") {
    color = C.mutedFg;
  } else {
    color = C.fg;
  }
  const border = variant === "outline" ? `1px solid ${C.cardBorder}` : "none";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: bg,
        color,
        border,
        borderRadius: RADIUS,
        padding: "8px 16px",
        fontSize: 13,
        fontWeight: 600,
        fontFamily: FONT,
        cursor: "pointer",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function WaveformSvg({
  size = 24,
  color = C.primary,
  animated = false,
  frame = 0,
}: {
  size?: number;
  color?: string;
  animated?: boolean;
  frame?: number;
}) {
  const bars = [0.4, 0.7, 1.0, 0.8, 0.5, 0.9, 0.6, 0.85, 0.45, 0.75];
  return (
    <svg height={size} viewBox="0 0 24 24" width={size}>
      <title>Waveform</title>
      {bars.map((h, i) => {
        const animH = animated
          ? h * (0.5 + 0.5 * Math.sin(frame * 0.15 + i * 0.9))
          : h;
        const bh = animH * (size * 0.75);
        const bw = (size / bars.length) * 0.6;
        const x = (i / bars.length) * size + bw * 0.5;
        return (
          <rect
            fill={color}
            height={bh}
            // biome-ignore lint/suspicious/noArrayIndexKey: static array, order never changes
            key={i}
            rx={bw / 2}
            width={bw}
            x={x}
            y={(size - bh) / 2}
          />
        );
      })}
    </svg>
  );
}

export function LayerBar({
  label,
  color,
  volume,
  enabled,
  generating,
  frame = 0,
}: {
  label: string;
  color: string;
  volume: number;
  enabled: boolean;
  generating?: boolean;
  frame?: number;
}) {
  let pulse: number;
  if (generating) {
    pulse = 0.4 + 0.3 * Math.sin(frame * 0.15);
  } else if (enabled) {
    pulse = 1;
  } else {
    pulse = 0.35;
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        background: C.card,
        border: `1px solid ${C.cardBorder}`,
        borderLeft: `3px solid ${enabled ? color : C.muted}`,
        borderRadius: RADIUS,
        opacity: pulse,
        fontFamily: FONT,
      }}
    >
      {/* Toggle dot */}
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          // biome-ignore lint/style/noNestedTernary: three-state dot color
          background: generating ? C.mutedFg : enabled ? color : C.muted,
          flexShrink: 0,
        }}
      />
      {/* Label */}
      <span
        style={{
          flex: 1,
          fontSize: 13,
          fontWeight: 500,
          color: enabled ? C.fg : C.mutedFg,
          fontFamily: FONT,
        }}
      >
        {label}
      </span>
      {/* Volume bar */}
      {!generating && (
        <div
          style={{
            width: 120,
            height: 4,
            background: C.muted,
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${volume * 100}%`,
              background: color,
              borderRadius: 999,
            }}
          />
        </div>
      )}
      {generating && (
        <span style={{ fontSize: 11, color: C.mutedFg, fontFamily: FONT }}>
          generating...
        </span>
      )}
    </div>
  );
}

export const LAYER_DATA = [
  { label: "Rainfall on pavement", color: "#60a5fa", volume: 0.72 },
  { label: "Distant traffic hum", color: "#34d399", volume: 0.45 },
  { label: "Jazz through a window", color: C.primary, volume: 0.58 },
  { label: "Café murmur", color: "#f59e0b", volume: 0.33 },
  { label: "Night wind", color: "#e879f9", volume: 0.25 },
] as const;
