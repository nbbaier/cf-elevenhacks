import { useState, useCallback, useEffect, useRef } from "react";
import { useAgent } from "agents/react";
import type { SceneAgent, SceneState, Layer } from "../agents/scene";
import { Button, Surface, Text, InputArea } from "@cloudflare/kumo";
import {
  PlayIcon,
  PauseIcon,
  PlusIcon,
  ShareIcon,
  GitForkIcon,
  SpinnerIcon,
  WaveformIcon,
  MusicNoteIcon,
  CheckCircleIcon,
  CircleIcon,
  LinkIcon,
  SpeakerHighIcon,
  EyeSlashIcon
} from "@phosphor-icons/react";
import { LayerCard } from "../components/layer-card";
import { PlaybackEngine } from "../lib/playback-engine";
import { isOwnedScene, addOwnedScene, updateOwnedScene } from "../lib/owned-scenes";

interface SceneMixerProps {
  sceneId: string;
  isNew?: boolean;
  initialPrompt?: string;
  initialLayerCount?: number;
  onNavigateHome: () => void;
}

export function SceneMixer({
  sceneId,
  isNew,
  initialPrompt,
  initialLayerCount,
  onNavigateHome
}: SceneMixerProps) {
  const [connected, setConnected] = useState(false);
  const [addLayerPrompt, setAddLayerPrompt] = useState("");
  const [addLayerName, setAddLayerName] = useState("");
  const [addLayerType, setAddLayerType] = useState<"sfx" | "music">("sfx");
  const [showAddLayer, setShowAddLayer] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [authorDraft, setAuthorDraft] = useState("");
  const [editingAuthor, setEditingAuthor] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [generationTriggered, setGenerationTriggered] = useState(false);
  const engineRef = useRef<PlaybackEngine | null>(null);

  const isOwner = isOwnedScene(sceneId);

  const agent = useAgent<SceneAgent, SceneState>({
    agent: "SceneAgent",
    name: sceneId,
    onOpen: useCallback(() => setConnected(true), []),
    onClose: useCallback(() => setConnected(false), [])
  });

  const state = agent.state as SceneState | null;
  const scene = state?.scene ?? null;
  const layers = state?.layers ?? [];
  const generating = state?.generating ?? false;
  const progress = state?.generationProgress ?? null;

  // Trigger generation for new scenes
  useEffect(() => {
    if (isNew && connected && initialPrompt && !generationTriggered) {
      setGenerationTriggered(true);
      addOwnedScene(sceneId, initialPrompt.slice(0, 50), new Date().toISOString());
      agent.call("generateScene", [initialPrompt, initialLayerCount ?? 5]);
    }
  }, [isNew, connected, initialPrompt, generationTriggered, sceneId, agent]);

  // Sync scene title to localStorage when it changes
  useEffect(() => {
    if (scene && isOwner) {
      updateOwnedScene(sceneId, { title: scene.title });
    }
  }, [scene?.title, sceneId, isOwner]);

  // Initialize playback engine
  useEffect(() => {
    engineRef.current = new PlaybackEngine();
    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, []);

  // Load/update layers in playback engine
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    for (const layer of layers) {
      if (layer.r2Key && !engine.hasLayer(layer.id)) {
        const audioUrl = `/audio/${encodeURIComponent(layer.r2Key)}`;
        engine.loadLayer(layer.id, audioUrl, layer.volume, layer.pan, layer.enabled);
      }
    }
  }, [layers]);

  // Sync layer settings to playback engine
  const handleVolumeChange = useCallback(
    (id: string, volume: number) => {
      engineRef.current?.updateLayerVolume(id, volume);
      agent.call("updateLayer", [id, { volume }]);
    },
    [agent]
  );

  const handlePanChange = useCallback(
    (id: string, pan: number) => {
      engineRef.current?.updateLayerPan(id, pan);
      agent.call("updateLayer", [id, { pan }]);
    },
    [agent]
  );

  const handleToggle = useCallback(
    (id: string, enabled: boolean) => {
      engineRef.current?.updateLayerEnabled(id, enabled);
      agent.call("updateLayer", [id, { enabled }]);
    },
    [agent]
  );

  const handleRegenerate = useCallback(
    (id: string, newPrompt?: string) => {
      engineRef.current?.removeLayer(id);
      agent.call("regenerateLayer", [id, newPrompt]);
    },
    [agent]
  );

  const handleRemove = useCallback(
    (id: string) => {
      engineRef.current?.removeLayer(id);
      agent.call("removeLayer", [id]);
    },
    [agent]
  );

  const handleAddLayer = useCallback(async () => {
    const prompt = addLayerPrompt.trim();
    const name = addLayerName.trim() || prompt.slice(0, 25);
    if (!prompt) return;

    await agent.call("addLayer", [prompt, name, addLayerType]);
    setAddLayerPrompt("");
    setAddLayerName("");
    setShowAddLayer(false);
  }, [agent, addLayerPrompt, addLayerName, addLayerType]);

  const handlePlayPause = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    if (playing) {
      engine.pause();
      setPlaying(false);
    } else {
      engine.play();
      setPlaying(true);
    }
  }, [playing]);

  const handleShare = useCallback(async () => {
    await agent.call("publish", []);
    const url = `${window.location.origin}/scene/${sceneId}`;
    setShareUrl(url);
    try {
      await navigator.clipboard.writeText(url);
    } catch {}
  }, [agent, sceneId]);

  const handleUnpublish = useCallback(async () => {
    await agent.call("unpublish", []);
    setShareUrl(null);
  }, [agent]);

  const handleFork = useCallback(async () => {
    const data = (await agent.call("getSceneData", [])) as {
      scene: SceneState["scene"];
      layers: Layer[];
    };
    if (!data.scene) return;

    const newId = crypto.randomUUID();
    addOwnedScene(newId, `${data.scene.title} (fork)`, new Date().toISOString());

    // Connect to the new scene agent and init from fork
    // We'll navigate to the new scene - the SceneMixer will handle it
    const forkAgent = new Promise<void>((resolve) => {
      const tempAgent = document.createElement("div");
      // Navigate to the fork and let the new SceneMixer init it
      window.history.pushState({}, "", `/scene/${newId}`);
      // Store fork data for the new scene to pick up
      sessionStorage.setItem(
        `fork:${newId}`,
        JSON.stringify({
          sourceSceneId: data.scene!.id,
          sourceTitle: data.scene!.title,
          sourceLayers: data.layers
        })
      );
      resolve();
    });

    await forkAgent;
    window.location.href = `/scene/${newId}?fork=true`;
  }, [agent]);

  const handleSaveTitle = useCallback(() => {
    if (titleDraft.trim()) {
      agent.call("updateScene", [{ title: titleDraft.trim() }]);
    }
    setEditingTitle(false);
  }, [agent, titleDraft]);

  const handleSaveAuthor = useCallback(() => {
    agent.call("updateScene", [{ authorName: authorDraft.trim() || null }]);
    setEditingAuthor(false);
  }, [agent, authorDraft]);

  // Handle fork initialization
  useEffect(() => {
    if (!connected) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("fork") === "true") {
      const forkData = sessionStorage.getItem(`fork:${sceneId}`);
      if (forkData) {
        const { sourceSceneId, sourceTitle, sourceLayers } =
          JSON.parse(forkData);
        agent.call("initFromFork", [sourceSceneId, sourceTitle, sourceLayers]);
        sessionStorage.removeItem(`fork:${sceneId}`);
        addOwnedScene(sceneId, `${sourceTitle} (fork)`, new Date().toISOString());
        // Clean up URL
        window.history.replaceState({}, "", `/scene/${sceneId}`);
      }
    }
  }, [connected, sceneId, agent]);

  const readyLayers = layers.filter((l) => l.r2Key);

  return (
    <div className="max-w-2xl mx-auto w-full px-5 py-6 space-y-5">
      {/* Connection status */}
      <div className="flex items-center justify-between">
        <button
          onClick={onNavigateHome}
          className="text-sm text-kumo-accent hover:underline"
        >
          &larr; New Soundscape
        </button>
        <div className="flex items-center gap-1.5">
          <CircleIcon
            size={8}
            weight="fill"
            className={connected ? "text-kumo-success" : "text-kumo-danger"}
          />
          <span className="text-xs text-kumo-subtle">
            {connected ? "Connected" : "Connecting..."}
          </span>
        </div>
      </div>

      {/* Scene header */}
      {scene && (
        <Surface className="p-5 rounded-xl ring ring-kumo-line">
          <div className="space-y-3">
            {/* Title */}
            <div className="flex items-center gap-2">
              <WaveformIcon size={20} className="text-kumo-accent shrink-0" />
              {editingTitle && isOwner ? (
                <div className="flex gap-2 flex-1">
                  <input
                    type="text"
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
                    onBlur={handleSaveTitle}
                    className="flex-1 px-3 py-1 rounded-lg bg-kumo-elevated text-lg font-semibold text-kumo-default border border-kumo-line focus:outline-none focus:ring-2 focus:ring-kumo-accent"
                    autoFocus
                  />
                </div>
              ) : (
                <h1
                  className={`text-lg font-semibold text-kumo-default ${isOwner ? "cursor-pointer hover:text-kumo-accent" : ""}`}
                  onClick={
                    isOwner
                      ? () => {
                          setTitleDraft(scene.title);
                          setEditingTitle(true);
                        }
                      : undefined
                  }
                >
                  {scene.title}
                </h1>
              )}
            </div>

            {/* Author */}
            <div className="flex items-center gap-2">
              {editingAuthor && isOwner ? (
                <div className="flex gap-2 flex-1">
                  <input
                    type="text"
                    value={authorDraft}
                    onChange={(e) => setAuthorDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveAuthor()}
                    onBlur={handleSaveAuthor}
                    placeholder="Your name (optional)"
                    className="flex-1 px-3 py-1 rounded-lg bg-kumo-elevated text-sm text-kumo-default border border-kumo-line focus:outline-none focus:ring-2 focus:ring-kumo-accent"
                    autoFocus
                  />
                </div>
              ) : (
                <span
                  className={`text-xs text-kumo-subtle ${
                    isOwner ? "cursor-pointer hover:text-kumo-accent" : ""
                  }`}
                  onClick={
                    isOwner
                      ? () => {
                          setAuthorDraft(scene.authorName || "");
                          setEditingAuthor(true);
                        }
                      : undefined
                  }
                >
                  {scene.authorName
                    ? `by ${scene.authorName}`
                    : isOwner
                      ? "Click to set your name"
                      : "Anonymous"}
                </span>
              )}
            </div>

            {scene.forkedFrom && (
              <Text size="xs" variant="secondary">
                Forked from another soundscape
              </Text>
            )}

            {/* Playback + actions */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant={playing ? "primary" : "secondary"}
                icon={
                  playing ? (
                    <PauseIcon size={16} />
                  ) : (
                    <PlayIcon size={16} />
                  )
                }
                onClick={handlePlayPause}
                disabled={readyLayers.length === 0}
              >
                {playing ? "Pause" : "Play"}
              </Button>

              {isOwner && !scene.isPublic && (
                <Button
                  variant="secondary"
                  icon={<ShareIcon size={16} />}
                  onClick={handleShare}
                >
                  Share
                </Button>
              )}

              {isOwner && scene.isPublic && (
                <Button
                  variant="secondary"
                  icon={<EyeSlashIcon size={16} />}
                  onClick={handleUnpublish}
                >
                  Unpublish
                </Button>
              )}

              {!isOwner && (
                <Button
                  variant="primary"
                  icon={<GitForkIcon size={16} />}
                  onClick={handleFork}
                >
                  Make It Yours
                </Button>
              )}
            </div>

            {/* Share URL */}
            {shareUrl && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-kumo-elevated">
                <LinkIcon size={14} className="text-kumo-accent shrink-0" />
                <code className="text-xs text-kumo-default flex-1 truncate">
                  {shareUrl}
                </code>
                <Text size="xs" variant="secondary">
                  Copied!
                </Text>
              </div>
            )}

            {isOwner && scene.isPublic && !shareUrl && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-kumo-elevated">
                <LinkIcon size={14} className="text-kumo-accent shrink-0" />
                <code className="text-xs text-kumo-default flex-1 truncate">
                  {window.location.origin}/scene/{sceneId}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const url = `${window.location.origin}/scene/${sceneId}`;
                    navigator.clipboard.writeText(url).catch(() => {});
                    setShareUrl(url);
                  }}
                >
                  Copy
                </Button>
              </div>
            )}
          </div>
        </Surface>
      )}

      {/* Generation progress */}
      {generating && (
        <Surface className="p-4 rounded-xl ring ring-kumo-line">
          <div className="flex items-center gap-3">
            <SpinnerIcon
              size={16}
              className="animate-spin text-kumo-accent"
            />
            <Text size="sm" variant="secondary">
              {!progress
                ? "AI is designing your soundscape..."
                : progress.completed === 0
                  ? "Generating audio for all layers..."
                  : `${progress.completed} of ${progress.total} layers ready`}
            </Text>
          </div>
        </Surface>
      )}

      {/* Layer cards */}
      {layers.length > 0 && (
        <div className="space-y-3">
          <Text size="sm" bold>
            {isOwner ? `Layers (${layers.length})` : `${layers.length} Layers`}
          </Text>
          {layers.map((layer) => (
            <LayerCard
              key={layer.id}
              layer={layer}
              isOwner={isOwner}
              onVolumeChange={handleVolumeChange}
              onPanChange={handlePanChange}
              onToggle={handleToggle}
              onRegenerate={handleRegenerate}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      {/* Add layer */}
      {isOwner && scene && !generating && (
        <div className="space-y-3">
          {showAddLayer ? (
            <Surface className="p-4 rounded-xl ring ring-kumo-line space-y-3">
              <Text size="sm" bold>
                Add a new layer
              </Text>
              <input
                type="text"
                value={addLayerName}
                onChange={(e) => setAddLayerName(e.target.value)}
                placeholder="Layer name (e.g., Distant Thunder)"
                className="w-full px-3 py-2 rounded-lg bg-kumo-elevated text-sm text-kumo-default border border-kumo-line focus:outline-none focus:ring-2 focus:ring-kumo-accent"
              />
              <InputArea
                value={addLayerPrompt}
                onValueChange={setAddLayerPrompt}
                placeholder="Sound description (e.g., distant rolling thunder with rain)"
                rows={2}
                className="w-full"
              />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="layerType"
                    value="sfx"
                    checked={addLayerType === "sfx"}
                    onChange={() => setAddLayerType("sfx")}
                    className="accent-[var(--kumo-accent)]"
                  />
                  <span className="text-sm text-kumo-default flex items-center gap-1">
                    <SpeakerHighIcon size={14} /> Sound Effect
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="layerType"
                    value="music"
                    checked={addLayerType === "music"}
                    onChange={() => setAddLayerType("music")}
                    className="accent-[var(--kumo-accent)]"
                  />
                  <span className="text-sm text-kumo-default flex items-center gap-1">
                    <MusicNoteIcon size={14} /> Music
                  </span>
                </label>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  icon={<PlusIcon size={14} />}
                  onClick={handleAddLayer}
                  disabled={!addLayerPrompt.trim()}
                >
                  Add Layer
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowAddLayer(false)}
                >
                  Cancel
                </Button>
              </div>
            </Surface>
          ) : (
            <Button
              variant="outline"
              icon={<PlusIcon size={14} />}
              onClick={() => setShowAddLayer(true)}
              className="w-full"
            >
              Add Layer
            </Button>
          )}
        </div>
      )}

      {/* Empty state (no scene yet, not new) */}
      {!scene && !generating && !isNew && connected && (
        <Surface className="p-8 rounded-xl ring ring-kumo-line text-center space-y-3">
          <WaveformIcon size={32} className="mx-auto text-kumo-inactive" />
          <Text size="sm" variant="secondary">
            This soundscape doesn't exist yet.
          </Text>
          <Button variant="secondary" onClick={onNavigateHome}>
            Create a New Soundscape
          </Button>
        </Surface>
      )}
    </div>
  );
}

