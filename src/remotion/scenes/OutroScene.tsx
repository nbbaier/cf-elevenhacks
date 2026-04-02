import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "../theme";
import { WaveformSvg } from "./ui";

function ElevenLabsLogo({ size = 24 }: { size?: number }) {
  return (
    <svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
      <rect
        fill="currentColor"
        height="24"
        rx="1.75"
        width="3.5"
        x="11"
        y="4"
      />
      <rect
        fill="currentColor"
        height="24"
        rx="1.75"
        width="3.5"
        x="17.5"
        y="4"
      />
    </svg>
  );
}

function CloudflareIcon({ size = 32 }: { size?: number }) {
  return (
    <svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
      <path
        d="M21.5 22.5l.6-2.1a3.5 3.5 0 00-.13-2.65 3.3 3.3 0 00-1.92-1.7L8.5 14.5a.45.45 0 01-.3-.18.54.54 0 01-.08-.33.56.56 0 01.47-.46l11.7-1.6a6.65 6.65 0 003.95-3.5l.83-2.02a.66.66 0 00.04-.32C24.0 3.17 20.2 1.5 16.5 1.5a12.7 12.7 0 00-12.2 9.35A5.73 5.73 0 003.5 14a4.7 4.7 0 00.82 4.7 4.7 4.7 0 00-.56 4.01A4.84 4.84 0 008.5 26.5h12.8a.6.6 0 00.58-.46l-.38.46z"
        fill="#F6821F"
      />
      <path
        d="M24 8.5h-.36a.3.3 0 00-.27.18l-.73 2.5a3.5 3.5 0 00.13 2.65 3.3 3.3 0 001.92 1.7l4.02.55a.45.45 0 01.3.18.54.54 0 01.08.33.56.56 0 01-.47.46l-4.18.57a6.67 6.67 0 00-3.95 3.5l-.23.56a.25.25 0 00.23.35h8.9A4.84 4.84 0 0034 18a8.83 8.83 0 00-10.22-8.77z"
        fill="#FBAD41"
      />
    </svg>
  );
}

export function OutroScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    config: { damping: 25 },
  });

  const waveOpacity = spring({
    frame: frame - 5,
    fps,
    from: 0,
    to: 1,
    config: { damping: 18 },
  });
  const waveY = spring({
    frame: frame - 5,
    fps,
    from: 30,
    to: 0,
    config: { damping: 18 },
  });

  const titleOpacity = spring({
    frame: frame - 18,
    fps,
    from: 0,
    to: 1,
    config: { damping: 18 },
  });
  const titleY = spring({
    frame: frame - 18,
    fps,
    from: 20,
    to: 0,
    config: { damping: 18 },
  });

  const tagOpacity = spring({
    frame: frame - 32,
    fps,
    from: 0,
    to: 1,
    config: { damping: 18 },
  });

  const badgesOpacity = spring({
    frame: frame - 48,
    fps,
    from: 0,
    to: 1,
    config: { damping: 18 },
  });
  const badgesY = spring({
    frame: frame - 48,
    fps,
    from: 16,
    to: 0,
    config: { damping: 18 },
  });

  const hashOpacity = spring({
    frame: frame - 65,
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
        opacity: bgOpacity,
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
      {/* Glow */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: 999,
          background: `radial-gradient(circle, ${C.primary}22 0%, transparent 70%)`,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      />

      {/* Waveform */}
      <div
        style={{
          opacity: waveOpacity,
          transform: `translateY(${waveY}px)`,
          marginBottom: 20,
        }}
      >
        <WaveformSvg animated color={C.primary} frame={frame} size={56} />
      </div>

      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontSize: 68,
          fontWeight: 800,
          color: C.fg,
          letterSpacing: "-2px",
          marginBottom: 14,
        }}
      >
        Soundscaper
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: tagOpacity,
          fontSize: 22,
          color: C.mutedFg,
          fontWeight: 400,
          marginBottom: 52,
          textAlign: "center",
          maxWidth: 560,
          lineHeight: 1.5,
        }}
      >
        AI-generated ambient soundscapes,{" "}
        <span style={{ color: C.fg, fontWeight: 500 }}>
          mixed and shared instantly
        </span>
      </div>

      {/* Tech badges */}
      <div
        style={{
          opacity: badgesOpacity,
          transform: `translateY(${badgesY}px)`,
          display: "flex",
          alignItems: "center",
          gap: 20,
          marginBottom: 40,
        }}
      >
        {/* ElevenLabs badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: C.card,
            border: `1px solid ${C.cardBorder}`,
            borderRadius: 999,
            padding: "10px 20px",
          }}
        >
          <ElevenLabsLogo size={22} />
          <span
            style={{
              fontSize: 15,
              color: C.fg,
              fontWeight: 600,
              fontFamily: FONT,
            }}
          >
            ElevenLabs
          </span>
        </div>

        <span style={{ fontSize: 22, color: C.mutedFg }}>×</span>

        {/* Cloudflare badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: C.card,
            border: `1px solid ${C.cardBorder}`,
            borderRadius: 999,
            padding: "10px 20px",
          }}
        >
          <CloudflareIcon size={22} />
          <span
            style={{
              fontSize: 15,
              color: C.fg,
              fontWeight: 600,
              fontFamily: FONT,
            }}
          >
            Cloudflare Workers
          </span>
        </div>
      </div>

      {/* Hashtag */}
      <div
        style={{
          opacity: hashOpacity,
          fontSize: 17,
          color: C.primary,
          fontWeight: 600,
          letterSpacing: "0.02em",
        }}
      >
        #ElevenHacks
      </div>
    </div>
  );
}
