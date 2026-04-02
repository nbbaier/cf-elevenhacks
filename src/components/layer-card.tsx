import {
  ArrowClockwiseIcon,
  ArrowsHorizontalIcon,
  CheckIcon,
  MusicNoteIcon,
  PencilSimpleIcon,
  SpeakerHighIcon,
  SpinnerIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { Layer } from "../agents/scene";

// Perceptually balanced layer hues (oklch hue angles)
const LAYER_HUES = [290, 195, 145, 25, 330, 60, 235, 110];

function formatPanLabel(pan: number): string {
  if (pan === 0) {
    return "C";
  }

  if (pan < 0) {
    return `L${Math.round(Math.abs(pan) * 100)}`;
  }

  return `R${Math.round(pan * 100)}`;
}

export function getLayerColor(index: number, dark = false): string {
  const hue = LAYER_HUES[index % LAYER_HUES.length];
  return dark ? `oklch(0.7 0.15 ${hue})` : `oklch(0.55 0.2 ${hue})`;
}

export function getLayerBg(index: number, dark = false): string {
  const hue = LAYER_HUES[index % LAYER_HUES.length];
  return dark ? `oklch(0.25 0.025 ${hue})` : `oklch(0.97 0.012 ${hue})`;
}

interface LayerCardProps {
  className?: string;
  colorIndex: number;
  isOwner: boolean;
  layer: Layer;
  onPanChange: (id: string, pan: number) => void;
  onRegenerate: (id: string, newPrompt?: string) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onVolumeChange: (id: string, volume: number) => void;
  style?: React.CSSProperties;
}

export function LayerCard({
  layer,
  colorIndex,
  isOwner,
  onVolumeChange,
  onPanChange,
  onToggle,
  onRegenerate,
  onRemove,
  style,
  className,
}: LayerCardProps) {
  const [editing, setEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState(layer.prompt);
  const isLoading = !layer.r2Key;
  const isDark = document.documentElement.classList.contains("dark");
  const layerColor = getLayerColor(colorIndex, isDark);
  const layerBg = getLayerBg(colorIndex, isDark);

  const handleSavePrompt = useCallback(() => {
    if (editPrompt.trim() && editPrompt !== layer.prompt) {
      onRegenerate(layer.id, editPrompt.trim());
    }
    setEditing(false);
  }, [editPrompt, layer.id, layer.prompt, onRegenerate]);

  return (
    <Card
      className={`border-l-4 p-4 transition-opacity ${
        layer.enabled ? "" : "opacity-50"
      } ${className ?? ""}`}
      style={{
        borderLeftColor: layerColor,
        backgroundColor: layerBg,
        ...style,
      }}
    >
      <div className="space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {layer.type === "music" ? (
              <MusicNoteIcon
                className="shrink-0"
                size={16}
                style={{ color: layerColor }}
              />
            ) : (
              <SpeakerHighIcon
                className="shrink-0"
                size={16}
                style={{ color: layerColor }}
              />
            )}
            <span className="truncate font-semibold text-foreground text-sm">
              {layer.name}
            </span>
            {isLoading && (
              <SpinnerIcon
                className="shrink-0 animate-spin text-primary"
                size={14}
              />
            )}
          </div>

          {isOwner && (
            <div className="flex shrink-0 items-center gap-1">
              <Switch
                checked={layer.enabled}
                onCheckedChange={(checked) => onToggle(layer.id, checked)}
                size="sm"
              />
            </div>
          )}
        </div>

        {/* Prompt display/edit */}
        {editing && isOwner ? (
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg border border-border bg-muted px-3 py-1.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              onChange={(e) => setEditPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSavePrompt()}
              type="text"
              value={editPrompt}
            />
            <Button
              aria-label="Save prompt"
              onClick={handleSavePrompt}
              size="icon-sm"
              variant="secondary"
            >
              <CheckIcon size={14} />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="flex-1 text-muted-foreground text-xs">
              {layer.prompt}
            </span>
            {isOwner && !isLoading && (
              <Button
                aria-label="Edit prompt"
                onClick={() => {
                  setEditPrompt(layer.prompt);
                  setEditing(true);
                }}
                size="icon-sm"
                variant="ghost"
              >
                <PencilSimpleIcon size={12} />
              </Button>
            )}
          </div>
        )}

        {/* Controls — full mixer for owner, compact info for listeners */}
        {!isLoading && isOwner && (
          <div className="space-y-2">
            {/* Volume slider */}
            <div className="flex items-center gap-3">
              <SpeakerHighIcon
                className="shrink-0 text-muted-foreground"
                size={12}
              />
              <input
                className="h-1.5 flex-1 accent-primary"
                max="1"
                min="0"
                onChange={(e) =>
                  onVolumeChange(layer.id, Number.parseFloat(e.target.value))
                }
                step="0.01"
                type="range"
                value={layer.volume}
              />
              <span className="w-8 text-right text-muted-foreground text-xs">
                {Math.round(layer.volume * 100)}%
              </span>
            </div>

            {/* Pan slider */}
            <div className="flex items-center gap-3">
              <ArrowsHorizontalIcon
                className="shrink-0 text-muted-foreground"
                size={12}
              />
              <input
                className="h-1.5 flex-1 accent-primary"
                max="1"
                min="-1"
                onChange={(e) =>
                  onPanChange(layer.id, Number.parseFloat(e.target.value))
                }
                step="0.01"
                type="range"
                value={layer.pan}
              />
              <span className="w-8 text-right text-muted-foreground text-xs">
                {formatPanLabel(layer.pan)}
              </span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {isOwner && !isLoading && (
          <div className="flex items-center gap-2 pt-1">
            <Button
              onClick={() => onRegenerate(layer.id)}
              size="sm"
              variant="outline"
            >
              <ArrowClockwiseIcon size={12} />
              Regenerate
            </Button>
            <Button
              onClick={() => onRemove(layer.id)}
              size="sm"
              variant="destructive"
            >
              <TrashIcon size={12} />
              Remove
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
