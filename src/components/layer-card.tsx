import { useState, useCallback } from "react";
import { Button, Surface, Text, Switch } from "@cloudflare/kumo";
import {
  SpeakerHighIcon,
  ArrowsHorizontalIcon,
  ArrowClockwiseIcon,
  TrashIcon,
  PencilSimpleIcon,
  CheckIcon,
  SpinnerIcon,
  MusicNoteIcon
} from "@phosphor-icons/react";
import type { Layer } from "../agents/scene";

interface LayerCardProps {
  layer: Layer;
  isOwner: boolean;
  onVolumeChange: (id: string, volume: number) => void;
  onPanChange: (id: string, pan: number) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onRegenerate: (id: string, newPrompt?: string) => void;
  onRemove: (id: string) => void;
}

export function LayerCard({
  layer,
  isOwner,
  onVolumeChange,
  onPanChange,
  onToggle,
  onRegenerate,
  onRemove
}: LayerCardProps) {
  const [editing, setEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState(layer.prompt);
  const isLoading = !layer.r2Key;

  const handleSavePrompt = useCallback(() => {
    if (editPrompt.trim() && editPrompt !== layer.prompt) {
      onRegenerate(layer.id, editPrompt.trim());
    }
    setEditing(false);
  }, [editPrompt, layer.id, layer.prompt, onRegenerate]);

  return (
    <Surface
      className={`p-4 rounded-xl ring ring-kumo-line transition-opacity ${
        !layer.enabled ? "opacity-50" : ""
      }`}
    >
      <div className="space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {layer.type === "music" ? (
              <MusicNoteIcon
                size={16}
                className="text-kumo-accent shrink-0"
              />
            ) : (
              <SpeakerHighIcon
                size={16}
                className="text-kumo-accent shrink-0"
              />
            )}
            <span className="text-sm font-semibold text-kumo-default truncate">
              {layer.name}
            </span>
            {isLoading && (
              <SpinnerIcon
                size={14}
                className="animate-spin text-kumo-accent shrink-0"
              />
            )}
          </div>

          {isOwner && (
            <div className="flex items-center gap-1 shrink-0">
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
              type="text"
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSavePrompt()}
              className="flex-1 px-3 py-1.5 rounded-lg bg-kumo-elevated text-sm text-kumo-default border border-kumo-line focus:outline-none focus:ring-2 focus:ring-kumo-accent"
              autoFocus
            />
            <Button
              variant="secondary"
              size="sm"
              shape="square"
              aria-label="Save prompt"
              icon={<CheckIcon size={14} />}
              onClick={handleSavePrompt}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-kumo-subtle flex-1">
              {layer.prompt}
            </span>
            {isOwner && !isLoading && (
              <Button
                variant="ghost"
                size="sm"
                shape="square"
                aria-label="Edit prompt"
                icon={<PencilSimpleIcon size={12} />}
                onClick={() => {
                  setEditPrompt(layer.prompt);
                  setEditing(true);
                }}
              />
            )}
          </div>
        )}

        {/* Controls — full mixer for owner, compact info for listeners */}
        {!isLoading && isOwner && (
          <div className="space-y-2">
            {/* Volume slider */}
            <div className="flex items-center gap-3">
              <SpeakerHighIcon
                size={12}
                className="text-kumo-subtle shrink-0"
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={layer.volume}
                onChange={(e) =>
                  onVolumeChange(layer.id, parseFloat(e.target.value))
                }
                className="flex-1 h-1.5 accent-[var(--kumo-accent)]"
              />
              <span className="text-xs text-kumo-subtle w-8 text-right">
                {Math.round(layer.volume * 100)}%
              </span>
            </div>

            {/* Pan slider */}
            <div className="flex items-center gap-3">
              <ArrowsHorizontalIcon
                size={12}
                className="text-kumo-subtle shrink-0"
              />
              <input
                type="range"
                min="-1"
                max="1"
                step="0.01"
                value={layer.pan}
                onChange={(e) =>
                  onPanChange(layer.id, parseFloat(e.target.value))
                }
                className="flex-1 h-1.5 accent-[var(--kumo-accent)]"
              />
              <span className="text-xs text-kumo-subtle w-8 text-right">
                {layer.pan === 0
                  ? "C"
                  : layer.pan < 0
                    ? `L${Math.round(Math.abs(layer.pan) * 100)}`
                    : `R${Math.round(layer.pan * 100)}`}
              </span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {isOwner && !isLoading && (
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowClockwiseIcon size={12} />}
              onClick={() => onRegenerate(layer.id)}
            >
              Regenerate
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<TrashIcon size={12} />}
              onClick={() => onRemove(layer.id)}
              className="text-kumo-danger"
            >
              Remove
            </Button>
          </div>
        )}
      </div>
    </Surface>
  );
}
