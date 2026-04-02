import { Composition } from "remotion";
import { SoundscaperDemo } from "./SoundscaperDemo";

export const RemotionRoot = () => {
  return (
    <Composition
      component={SoundscaperDemo}
      durationInFrames={1860}
      fps={30}
      height={1080}
      id="SoundscaperDemo"
      width={1920}
    />
  );
};
