const BAR_COUNT = 5;
const BARS = Array.from({ length: BAR_COUNT }, (_, i) => i);

export function AnimatedWaveform({ size = 48 }: { size?: number }) {
  const barWidth = size * 0.1;
  const gap = size * 0.06;
  const totalWidth = BAR_COUNT * barWidth + (BAR_COUNT - 1) * gap;
  const offsetX = (size - totalWidth) / 2;

  return (
    <svg
      aria-hidden="true"
      className="text-primary"
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      width={size}
    >
      {BARS.map((i) => {
        const x = offsetX + i * (barWidth + gap);
        const minH = size * 0.15;
        const maxH = size * 0.7;
        const delay = i * 0.15;

        return (
          <rect
            className="animate-waveform-bar"
            fill="currentColor"
            key={i}
            rx={barWidth / 2}
            style={
              {
                animationDelay: `${delay}s`,
                // Set initial state via CSS custom properties
                "--bar-min-h": `${minH}px`,
                "--bar-max-h": `${maxH}px`,
                "--bar-center-y": `${size / 2}px`,
              } as React.CSSProperties
            }
            width={barWidth}
            x={x}
          />
        );
      })}
    </svg>
  );
}
