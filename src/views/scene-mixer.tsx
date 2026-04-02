import {
  CircleIcon,
  EyeSlashIcon,
  GitForkIcon,
  LinkIcon,
  MusicNoteIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  ShareIcon,
  SpeakerHighIcon,
  SpinnerIcon,
  WaveformIcon,
} from "@phosphor-icons/react";
import { useAgent } from "agents/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { Layer, SceneAgent, SceneState } from "../agents/scene";
import { LayerCard } from "../components/layer-card";
import { useSession } from "../lib/auth-client";
import {
  addOwnedScene,
  isOwnedScene,
  updateOwnedScene,
} from "../lib/owned-scenes";
import { PlaybackEngine } from "../lib/playback-engine";

interface SceneMixerProps {
  initialLayerCount?: number;
  initialPrompt?: string;
  isNew?: boolean;
  onNavigateHome: () => void;
  sceneId: string;
}

export function SceneMixer({
  sceneId,
  isNew,
  initialPrompt,
  initialLayerCount,
  onNavigateHome,
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

  const { data: session } = useSession();
  const isOwner = isOwnedScene(sceneId);

  const agent = useAgent<SceneAgent, SceneState>({
    agent: "SceneAgent",
    name: sceneId,
    onOpen: useCallback(() => setConnected(true), []),
    onClose: useCallback(() => setConnected(false), []),
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
      addOwnedScene(
        sceneId,
        initialPrompt.slice(0, 50),
        new Date().toISOString()
      );
      agent.call("generateScene", [initialPrompt, initialLayerCount ?? 5]);
      // Claim for signed-in user
      if (session?.user?.id) {
        agent.call("claimScene", [session.user.id]);
      }
    }
  }, [
    isNew,
    connected,
    initialPrompt,
    generationTriggered,
    sceneId,
    agent,
    session?.user?.id,
    initialLayerCount,
  ]);

  // Sync scene title to localStorage when it changes
  useEffect(() => {
    if (scene && isOwner) {
      updateOwnedScene(sceneId, { title: scene.title });
    }
  }, [scene?.title, sceneId, isOwner, scene]);

  // Sync scene to D1 user_scenes index when signed in
  useEffect(() => {
    if (
      scene &&
      session?.user?.id &&
      (isOwner || scene.ownerId === session.user.id)
    ) {
      fetch("/api/my-scenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sceneId, title: scene.title }),
      }).catch(() => {});
    }
  }, [
    scene?.title,
    sceneId,
    session?.user?.id,
    isOwner,
    scene?.ownerId,
    scene,
  ]);

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
    if (!engine) {
      return;
    }

    for (const layer of layers) {
      if (layer.r2Key && !engine.hasLayer(layer.id)) {
        const audioUrl = `/audio/${encodeURIComponent(layer.r2Key)}`;
        engine.loadLayer(
          layer.id,
          audioUrl,
          layer.volume,
          layer.pan,
          layer.enabled
        );
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
    if (!prompt) {
      return;
    }

    await agent.call("addLayer", [prompt, name, addLayerType]);
    setAddLayerPrompt("");
    setAddLayerName("");
    setShowAddLayer(false);
  }, [agent, addLayerPrompt, addLayerName, addLayerType]);

  const handlePlayPause = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) {
      return;
    }

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
    if (!data.scene) {
      return;
    }

    const newId = crypto.randomUUID();
    addOwnedScene(
      newId,
      `${data.scene.title} (fork)`,
      new Date().toISOString()
    );

    // Connect to the new scene agent and init from fork
    // We'll navigate to the new scene - the SceneMixer will handle it
    const forkAgent = new Promise<void>((resolve) => {
      const _tempAgent = document.createElement("div");
      // Navigate to the fork and let the new SceneMixer init it
      window.history.pushState({}, "", `/scene/${newId}`);
      // Store fork data for the new scene to pick up
      sessionStorage.setItem(
        `fork:${newId}`,
        JSON.stringify({
          sourceSceneId: data.scene?.id,
          sourceTitle: data.scene?.title,
          sourceLayers: data.layers,
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
    if (!connected) {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get("fork") === "true") {
      const forkData = sessionStorage.getItem(`fork:${sceneId}`);
      if (forkData) {
        const { sourceSceneId, sourceTitle, sourceLayers } =
          JSON.parse(forkData);
        agent.call("initFromFork", [sourceSceneId, sourceTitle, sourceLayers]);
        if (session?.user?.id) {
          agent.call("claimScene", [session.user.id]);
        }
        sessionStorage.removeItem(`fork:${sceneId}`);
        addOwnedScene(
          sceneId,
          `${sourceTitle} (fork)`,
          new Date().toISOString()
        );
        // Clean up URL
        window.history.replaceState({}, "", `/scene/${sceneId}`);
      }
    }
  }, [connected, sceneId, agent, session.user.id]);

  const readyLayers = layers.filter((l) => l.r2Key);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-8">
      {/* Connection status */}
      <div className="flex animate-fade-up items-center justify-between">
        <button
          className="text-primary text-sm hover:underline"
          onClick={onNavigateHome}
          type="button"
        >
          &larr; New Soundscape
        </button>
        <div className="flex items-center gap-1.5">
          <CircleIcon
            className={connected ? "text-primary" : "text-destructive"}
            size={8}
            weight="fill"
          />
          <span className="text-muted-foreground text-xs">
            {connected ? "Connected" : "Connecting..."}
          </span>
        </div>
      </div>

      {/* Scene header */}
      {scene && (
        <Card
          className="animate-fade-up p-6"
          style={{ animationDelay: "0.06s" }}
        >
          <div className="space-y-4">
            {/* Title */}
            <div className="flex items-center gap-3">
              <WaveformIcon
                className="shrink-0 text-primary"
                size={24}
                weight="bold"
              />
              {editingTitle && isOwner ? (
                <div className="flex flex-1 gap-2">
                  <input
                    autoFocus
                    className="flex-1 rounded-lg border border-border bg-muted px-3 py-1.5 font-bold text-foreground text-xl focus:outline-none focus:ring-2 focus:ring-ring"
                    onBlur={handleSaveTitle}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
                    type="text"
                    value={titleDraft}
                  />
                </div>
              ) : (
                <h1
                  className={`font-bold text-foreground text-xl tracking-tight ${isOwner ? "cursor-pointer transition-colors hover:text-primary" : ""}`}
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
                <div className="flex flex-1 gap-2">
                  <input
                    autoFocus
                    className="flex-1 rounded-lg border border-border bg-muted px-3 py-1 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    onBlur={handleSaveAuthor}
                    onChange={(e) => setAuthorDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveAuthor()}
                    placeholder="Your name (optional)"
                    type="text"
                    value={authorDraft}
                  />
                </div>
              ) : (
                <span
                  className={`text-muted-foreground text-xs ${
                    isOwner ? "cursor-pointer hover:text-primary" : ""
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
              <p className="text-muted-foreground text-xs">
                Forked from another soundscape
              </p>
            )}

            {/* Playback + actions */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                disabled={readyLayers.length === 0}
                onClick={handlePlayPause}
                size="lg"
                variant={playing ? "default" : "secondary"}
              >
                {playing ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
                {playing ? "Pause" : "Play"}
              </Button>

              {isOwner && !scene.isPublic && (
                <Button onClick={handleShare} variant="secondary">
                  <ShareIcon size={16} />
                  Share
                </Button>
              )}

              {isOwner && scene.isPublic && (
                <Button onClick={handleUnpublish} variant="secondary">
                  <EyeSlashIcon size={16} />
                  Unpublish
                </Button>
              )}

              {!isOwner && (
                <Button onClick={handleFork}>
                  <GitForkIcon size={16} />
                  Make It Yours
                </Button>
              )}
            </div>

            {/* Share URL */}
            {shareUrl && (
              <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                <LinkIcon className="shrink-0 text-primary" size={14} />
                <code className="flex-1 truncate text-foreground text-xs">
                  {shareUrl}
                </code>
                <span className="text-muted-foreground text-xs">Copied!</span>
              </div>
            )}

            {isOwner && scene.isPublic && !shareUrl && (
              <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                <LinkIcon className="shrink-0 text-primary" size={14} />
                <code className="flex-1 truncate text-foreground text-xs">
                  {window.location.origin}/scene/{sceneId}
                </code>
                <Button
                  onClick={() => {
                    const url = `${window.location.origin}/scene/${sceneId}`;
                    navigator.clipboard.writeText(url).catch(() => {});
                    setShareUrl(url);
                  }}
                  size="sm"
                  variant="ghost"
                >
                  Copy
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Generation progress */}
      {generating && (
        <Card
          className="animate-fade-up p-5"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="flex items-center gap-3">
            <SpinnerIcon className="animate-spin text-primary" size={18} />
            <p className="font-medium text-foreground text-sm">
              {progress
                ? progress.completed === 0
                  ? "Generating audio layers..."
                  : `${progress.completed} of ${progress.total} layers ready`
                : "Designing your soundscape..."}
            </p>
          </div>
        </Card>
      )}

      {/* Layer cards */}
      {layers.length > 0 && (
        <div className="space-y-3">
          <p
            className="animate-fade-up font-medium text-muted-foreground text-xs uppercase tracking-wide"
            style={{ animationDelay: "0.12s" }}
          >
            {isOwner ? `Layers (${layers.length})` : `${layers.length} Layers`}
          </p>
          {layers.map((layer, index) => (
            <LayerCard
              className="animate-fade-up"
              colorIndex={index}
              isOwner={isOwner}
              key={layer.id}
              layer={layer}
              onPanChange={handlePanChange}
              onRegenerate={handleRegenerate}
              onRemove={handleRemove}
              onToggle={handleToggle}
              onVolumeChange={handleVolumeChange}
              style={{ animationDelay: `${0.15 + index * 0.06}s` }}
            />
          ))}
        </div>
      )}

      {/* Add layer */}
      {isOwner && scene && !generating && (
        <div className="space-y-3">
          {showAddLayer ? (
            <Card className="space-y-3 p-4">
              <p className="font-semibold text-foreground text-sm">
                Add a new layer
              </p>
              <input
                className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                onChange={(e) => setAddLayerName(e.target.value)}
                placeholder="Layer name (e.g., Distant Thunder)"
                type="text"
                value={addLayerName}
              />
              <Textarea
                className="w-full"
                onChange={(e) => setAddLayerPrompt(e.target.value)}
                placeholder="Sound description (e.g., distant rolling thunder with rain)"
                rows={2}
                value={addLayerPrompt}
              />
              <div className="flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    checked={addLayerType === "sfx"}
                    className="accent-primary"
                    name="layerType"
                    onChange={() => setAddLayerType("sfx")}
                    type="radio"
                    value="sfx"
                  />
                  <span className="flex items-center gap-1 text-foreground text-sm">
                    <SpeakerHighIcon size={14} /> Sound Effect
                  </span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    checked={addLayerType === "music"}
                    className="accent-primary"
                    name="layerType"
                    onChange={() => setAddLayerType("music")}
                    type="radio"
                    value="music"
                  />
                  <span className="flex items-center gap-1 text-foreground text-sm">
                    <MusicNoteIcon size={14} /> Music
                  </span>
                </label>
              </div>
              <div className="flex gap-2">
                <Button
                  disabled={!addLayerPrompt.trim()}
                  onClick={handleAddLayer}
                >
                  <PlusIcon size={14} />
                  Add Layer
                </Button>
                <Button
                  onClick={() => setShowAddLayer(false)}
                  variant="secondary"
                >
                  Cancel
                </Button>
              </div>
            </Card>
          ) : (
            <Button
              className="w-full"
              onClick={() => setShowAddLayer(true)}
              variant="outline"
            >
              <PlusIcon size={14} />
              Add Layer
            </Button>
          )}
        </div>
      )}

      {/* Empty state (no scene yet, not new) */}
      {!(scene || generating || isNew) && connected && (
        <Card className="space-y-3 p-8 text-center">
          <WaveformIcon className="mx-auto text-muted-foreground" size={32} />
          <p className="text-muted-foreground text-sm">
            This soundscape doesn't exist yet.
          </p>
          <Button onClick={onNavigateHome} variant="secondary">
            Create a New Soundscape
          </Button>
        </Card>
      )}
    </div>
  );
}
