import {
  ClockIcon,
  MagicWandIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
  WaveformIcon,
} from "@phosphor-icons/react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AnimatedWaveform } from "../components/animated-waveform";
import {
  getOwnedScenes,
  type OwnedScene,
  removeOwnedScene,
} from "../lib/owned-scenes";

interface CreateViewProps {
  onGenerate: (description: string, layerCount: number) => void;
  onNavigateToScene: (sceneId: string) => void;
}

const PRESETS = [
  "Rainy Tokyo street at night",
  "Campfire in the woods with crickets and an owl",
  "Busy spaceport with engines and announcements",
  "Underwater coral reef with whale songs",
  "Cozy library with rain on the windows",
  "Mountain cabin during a thunderstorm",
];

export function CreateView({ onGenerate, onNavigateToScene }: CreateViewProps) {
  const [description, setDescription] = useState("");
  const [layerCount, setLayerCount] = useState(5);
  const [ownedScenes, setOwnedScenes] = useState<OwnedScene[]>(() =>
    getOwnedScenes()
  );

  const handleGenerate = useCallback(() => {
    const desc = description.trim();
    if (!desc) {
      return;
    }
    onGenerate(desc, layerCount);
  }, [description, layerCount, onGenerate]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-12 px-5 py-14">
      {/* Hero */}
      <div className="flex animate-fade-up flex-col items-center gap-5 text-center">
        <div className="mx-auto w-fit">
          <AnimatedWaveform size={64} />
        </div>
        <div className="space-y-2">
          <h1 className="font-bold text-4xl text-foreground tracking-tight">
            Soundscaper
          </h1>
          <p className="mx-auto max-w-md font-light text-base text-muted-foreground leading-relaxed">
            Describe any scene. AI generates a layered ambient soundscape you
            can mix, customize, and share.
          </p>
        </div>
      </div>

      {/* Input */}
      <Card className="animate-fade-up p-6" style={{ animationDelay: "0.08s" }}>
        <p className="font-semibold text-foreground text-sm">
          Describe your scene
        </p>
        <Textarea
          className="w-full text-base"
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A rainy café in Tokyo with jazz playing softly and rain on the windows..."
          rows={3}
          value={description}
        />

        {/* Layer count */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-xs">Number of layers</p>
          <div className="flex items-center gap-3">
            <Button
              aria-label="Decrease layers"
              disabled={layerCount <= 4}
              onClick={() => setLayerCount((c) => Math.max(4, c - 1))}
              size="icon-xs"
              variant="secondary"
            >
              <MinusIcon size={12} />
            </Button>
            <span className="w-4 text-center font-medium text-foreground text-sm">
              {layerCount}
            </span>
            <Button
              aria-label="Increase layers"
              disabled={layerCount >= 6}
              onClick={() => setLayerCount((c) => Math.min(6, c + 1))}
              size="icon-xs"
              variant="secondary"
            >
              <PlusIcon size={12} />
            </Button>
          </div>
        </div>

        <Button
          className="w-full text-base"
          disabled={!description.trim()}
          onClick={handleGenerate}
          size="lg"
        >
          <MagicWandIcon size={18} />
          Generate Soundscape
        </Button>
      </Card>

      {/* Preset suggestions */}
      <div
        className="animate-fade-up space-y-4"
        style={{ animationDelay: "0.16s" }}
      >
        <p className="text-center font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Try a preset
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {PRESETS.map((preset, _i) => (
            <button
              className="rounded-full border border-border px-3.5 py-2 text-muted-foreground text-sm transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
              key={preset}
              onClick={() => setDescription(preset)}
              type="button"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* My Soundscapes */}
      {ownedScenes.length > 0 && (
        <div
          className="animate-fade-up space-y-4"
          style={{ animationDelay: "0.24s" }}
        >
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            My Soundscapes
          </p>
          <div className="space-y-2">
            {ownedScenes.map((scene) => (
              <Card
                className="cursor-pointer p-4 transition-all hover:ring-1 hover:ring-primary/30"
                key={scene.id}
                onClick={() => onNavigateToScene(scene.id)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <WaveformIcon className="shrink-0 text-primary" size={16} />
                    <div className="min-w-0">
                      <p className="mb-1 truncate font-medium text-foreground text-sm">
                        {scene.title}
                      </p>
                      <p className="flex items-center gap-1 text-muted-foreground text-xs">
                        <ClockIcon size={13} />
                        {new Date(scene.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    aria-label="Remove from list"
                    className="shrink-0 p-1 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeOwnedScene(scene.id);
                      setOwnedScenes(getOwnedScenes());
                    }}
                    type="button"
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
