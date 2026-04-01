import { useState, useCallback } from "react";
import { Button, Surface, Text, InputArea } from "@cloudflare/kumo";
import {
  MagicWandIcon,
  WaveformIcon,
  MinusIcon,
  PlusIcon
} from "@phosphor-icons/react";

interface CreateViewProps {
  onGenerate: (description: string, layerCount: number) => void;
}

const PRESETS = [
  "Rainy Tokyo street at night",
  "Campfire in the woods with crickets and an owl",
  "Busy spaceport with engines and announcements",
  "Underwater coral reef with whale songs",
  "Cozy library with rain on the windows",
  "Mountain cabin during a thunderstorm"
];

export function CreateView({ onGenerate }: CreateViewProps) {
  const [description, setDescription] = useState("");
  const [layerCount, setLayerCount] = useState(5);

  const handleGenerate = useCallback(() => {
    const desc = description.trim();
    if (!desc) return;
    onGenerate(desc, layerCount);
  }, [description, layerCount, onGenerate]);

  return (
    <div className="max-w-2xl mx-auto w-full px-5 py-10 space-y-8">
      {/* Hero */}
      <div className="text-center space-y-3">
        <WaveformIcon size={48} className="mx-auto text-kumo-accent" />
        <h1 className="text-2xl font-bold text-kumo-default">Soundscaper</h1>
        <Text size="sm" variant="secondary">
          Describe any scene and AI will generate a layered ambient soundscape
          you can mix, customize, and share.
        </Text>
      </div>

      {/* Input */}
      <Surface className="p-5 rounded-xl ring ring-kumo-line space-y-4">
        <Text size="sm" bold>
          Describe your scene
        </Text>
        <InputArea
          value={description}
          onValueChange={setDescription}
          placeholder="A rainy caf&eacute; in Tokyo with jazz playing softly and rain on the windows..."
          rows={3}
          className="w-full"
        />

        {/* Layer count */}
        <div className="flex items-center justify-between">
          <Text size="xs" variant="secondary">
            Number of layers
          </Text>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              shape="square"
              aria-label="Decrease layers"
              icon={<MinusIcon size={12} />}
              disabled={layerCount <= 4}
              onClick={() => setLayerCount((c) => Math.max(4, c - 1))}
            />
            <span className="text-sm font-medium text-kumo-default w-4 text-center">
              {layerCount}
            </span>
            <Button
              variant="secondary"
              size="sm"
              shape="square"
              aria-label="Increase layers"
              icon={<PlusIcon size={12} />}
              disabled={layerCount >= 6}
              onClick={() => setLayerCount((c) => Math.min(6, c + 1))}
            />
          </div>
        </div>

        <Button
          variant="primary"
          icon={<MagicWandIcon size={16} />}
          disabled={!description.trim()}
          onClick={handleGenerate}
          className="w-full"
        >
          Generate Soundscape
        </Button>
      </Surface>

      {/* Preset suggestions */}
      <div className="space-y-3">
        <p className="text-xs text-kumo-subtle text-center">
          Or try a preset
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset}
              variant="outline"
              size="sm"
              onClick={() => setDescription(preset)}
            >
              {preset}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
