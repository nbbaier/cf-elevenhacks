import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { CreateScene } from "./scenes/create-scene";
import { GeneratingScene } from "./scenes/generating-scene";
import { HookScene } from "./scenes/hook-scene";
import { MixerScene } from "./scenes/mixer-scene";
import { OutroScene } from "./scenes/outro-scene";
import { ShareScene } from "./scenes/share-scene";
import { C } from "./theme";

// Scene timings (frames @ 30fps)
// Hook:       0  – 120  (4s)  — Finished mixer teaser + tagline
// Create:   120  – 300  (6s)  — Typing the prompt + generate click (cut right after click)
// Generate: 300  – 600  (10s) — 5 layers materialising (40f each + 100f settle)
// Mixer:    600  – 1320 (24s) — Play, toggle, volume/pan
// Share:   1320  – 1590 (9s)  — Publish URL + fork callout
// Outro:   1590  – 1860 (9s)  — ElevenLabs × Cloudflare + hashtag
// Total: 1860 frames = 62 seconds

const HOOK_START = 0;
const CREATE_START = 120;
const GENERATE_START = 300;
const MIXER_START = 600;
const SHARE_START = 1320;
const OUTRO_START = 1590;
const TOTAL = 1860;

function Soundtrack() {
  const frame = useCurrentFrame();
  // Fade in over first 30 frames, fade out over last 60 frames
  const volume = interpolate(
    frame,
    [0, 30, TOTAL - 60, TOTAL],
    [0, 0.15, 0.15, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return <Audio loop src={staticFile("soundtrack.mp3")} volume={volume} />;
}

export function SoundscaperDemo() {
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Soundtrack />

      <Sequence durationInFrames={CREATE_START - HOOK_START} from={HOOK_START}>
        <HookScene />
      </Sequence>

      <Sequence
        durationInFrames={GENERATE_START - CREATE_START}
        from={CREATE_START}
      >
        <CreateScene />
      </Sequence>

      <Sequence
        durationInFrames={MIXER_START - GENERATE_START}
        from={GENERATE_START}
      >
        <GeneratingScene />
      </Sequence>

      <Sequence durationInFrames={SHARE_START - MIXER_START} from={MIXER_START}>
        <MixerScene />
      </Sequence>

      <Sequence durationInFrames={OUTRO_START - SHARE_START} from={SHARE_START}>
        <ShareScene />
      </Sequence>

      <Sequence durationInFrames={TOTAL - OUTRO_START} from={OUTRO_START}>
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
}
