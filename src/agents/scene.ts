import { Agent, callable } from "agents";
import { generateMusic, generateSfx } from "../services/audio-generation";
import { decomposeScene } from "../services/decomposition";

export interface Layer {
  duration: number;
  enabled: boolean;
  id: string;
  name: string;
  order: number;
  pan: number;
  prompt: string;
  r2Key: string;
  type: "sfx" | "music";
  volume: number;
}

export interface SceneData {
  authorName: string | null;
  createdAt: string;
  forkedFrom: string | null;
  id: string;
  isPublic: boolean;
  ownerId: string | null;
  title: string;
}

export interface SceneState {
  generating: boolean;
  generationProgress: { completed: number; total: number } | null;
  layers: Layer[];
  scene: SceneData | null;
}

/**
 * Scene Agent — one Durable Object instance per scene.
 * Owns scene metadata and layer state.
 * Orchestrates decomposition and audio generation services.
 */
export class SceneAgent extends Agent<Env, SceneState> {
  initialState: SceneState = {
    scene: null,
    layers: [],
    generating: false,
    generationProgress: null,
  };

  /** Generate a full scene from a text description. */
  @callable()
  async generateScene(description: string, layerCount = 5): Promise<void> {
    const sceneId = this.name;

    this.setState({
      ...this.state,
      generating: true,
      generationProgress: { completed: 0, total: layerCount },
    });

    // Decompose scene into layer prompts via Workers AI
    const plan = await decomposeScene(this.env.AI, description, layerCount);

    const scene: SceneData = {
      id: sceneId,
      title: plan.title,
      authorName: null,
      createdAt: new Date().toISOString(),
      forkedFrom: null,
      isPublic: false,
      ownerId: this.state.scene?.ownerId ?? null,
    };

    // Create layer shells (no audio yet)
    const layers: Layer[] = plan.layers.map((lp, i) => ({
      id: crypto.randomUUID(),
      prompt: lp.prompt,
      name: lp.name,
      type: lp.type,
      r2Key: "",
      volume: 0.7,
      pan: 0,
      enabled: true,
      duration: 0,
      order: i,
    }));

    this.setState({
      ...this.state,
      scene,
      layers,
      generating: true,
      generationProgress: { completed: 0, total: layers.length },
    });

    // Generate audio for all layers in parallel
    let completed = 0;
    const promises = layers.map(async (layer, i) => {
      try {
        const gen =
          layer.type === "music"
            ? await generateMusic(
                this.env.ELEVENLABS_API_KEY,
                this.env.AUDIO_BUCKET,
                layer.id,
                layer.prompt
              )
            : await generateSfx(
                this.env.ELEVENLABS_API_KEY,
                this.env.AUDIO_BUCKET,
                layer.id,
                layer.prompt
              );

        layers[i] = { ...layers[i], r2Key: gen.r2Key, duration: gen.duration };
      } catch (e) {
        console.error(`Failed to generate layer ${layer.name}:`, e);
      }

      completed++;
      this.setState({
        ...this.state,
        scene,
        layers: [...layers],
        generating: true,
        generationProgress: { completed, total: layers.length },
      });
    });

    await Promise.all(promises);

    this.setState({
      ...this.state,
      scene,
      layers: [...layers],
      generating: false,
      generationProgress: null,
    });
  }

  /** Add a single new layer with audio generation. */
  @callable()
  async addLayer(
    prompt: string,
    name: string,
    type: "sfx" | "music" = "sfx"
  ): Promise<void> {
    const layerId = crypto.randomUUID();
    const layer: Layer = {
      id: layerId,
      prompt,
      name,
      type,
      r2Key: "",
      volume: 0.7,
      pan: 0,
      enabled: true,
      duration: 0,
      order: this.state.layers.length,
    };

    this.setState({
      ...this.state,
      layers: [...this.state.layers, layer],
      generating: true,
    });

    try {
      const gen =
        type === "music"
          ? await generateMusic(
              this.env.ELEVENLABS_API_KEY,
              this.env.AUDIO_BUCKET,
              layerId,
              prompt
            )
          : await generateSfx(
              this.env.ELEVENLABS_API_KEY,
              this.env.AUDIO_BUCKET,
              layerId,
              prompt
            );

      this.setState({
        ...this.state,
        layers: this.state.layers.map((l) =>
          l.id === layerId
            ? { ...l, r2Key: gen.r2Key, duration: gen.duration }
            : l
        ),
        generating: false,
      });
    } catch (e) {
      console.error("Failed to generate layer:", e);
      this.setState({ ...this.state, generating: false });
    }
  }

  /** Regenerate a layer's audio, optionally with a new prompt. */
  /** Regenerate a layer's audio, optionally with a new prompt. */
  @callable()
  async regenerateLayer(layerId: string, newPrompt?: string): Promise<void> {
    const layer = this.state.layers.find((l) => l.id === layerId);
    if (!layer) {
      throw new Error("Layer not found");
    }

    const prompt = newPrompt || layer.prompt;
    const newLayerId = crypto.randomUUID();
    const oldR2Key = layer.r2Key;

    // Mark layer as regenerating (clear r2Key, assign new ID)
    this.setState({
      ...this.state,
      layers: this.state.layers.map((l) =>
        l.id === layerId ? { ...l, id: newLayerId, prompt, r2Key: "" } : l
      ),
    });

    // Delete old audio from R2
    if (oldR2Key) {
      try {
        await this.env.AUDIO_BUCKET.delete(oldR2Key);
      } catch (e) {
        console.error("Failed to delete old audio:", e);
      }
    }

    try {
      const gen =
        layer.type === "music"
          ? await generateMusic(
              this.env.ELEVENLABS_API_KEY,
              this.env.AUDIO_BUCKET,
              newLayerId,
              prompt
            )
          : await generateSfx(
              this.env.ELEVENLABS_API_KEY,
              this.env.AUDIO_BUCKET,
              newLayerId,
              prompt
            );

      this.setState({
        ...this.state,
        layers: this.state.layers.map((l) =>
          l.id === newLayerId
            ? { ...l, r2Key: gen.r2Key, duration: gen.duration }
            : l
        ),
      });
    } catch (e) {
      console.error("Failed to regenerate layer:", e);
    }
  }

  /** Remove a layer and delete its audio from R2. */
  @callable()
  async removeLayer(layerId: string): Promise<void> {
    const layer = this.state.layers.find((l) => l.id === layerId);
    if (layer?.r2Key) {
      await this.env.AUDIO_BUCKET.delete(layer.r2Key);
    }
    this.setState({
      ...this.state,
      layers: this.state.layers.filter((l) => l.id !== layerId),
    });
  }

  /** Update layer settings (volume, pan, enabled, name). */
  @callable()
  updateLayer(
    layerId: string,
    updates: Partial<Pick<Layer, "volume" | "pan" | "enabled" | "name">>
  ): void {
    this.setState({
      ...this.state,
      layers: this.state.layers.map((l) =>
        l.id === layerId ? { ...l, ...updates } : l
      ),
    });
  }

  /** Update scene metadata (title, author name). */
  @callable()
  updateScene(updates: Partial<Pick<SceneData, "title" | "authorName">>): void {
    if (!this.state.scene) {
      return;
    }
    this.setState({
      ...this.state,
      scene: { ...this.state.scene, ...updates },
    });
  }

  /** Make the scene publicly shareable. Returns the scene ID. */
  @callable()
  async publish(): Promise<string> {
    if (!this.state.scene) {
      throw new Error("No scene to publish");
    }
    this.setState({
      ...this.state,
      scene: { ...this.state.scene, isPublic: true },
    });

    // Register with Gallery DO
    const galleryId = this.env.GalleryAgent.idFromName("gallery");
    const gallery = this.env.GalleryAgent.get(galleryId);
    await gallery.register({
      id: this.state.scene.id,
      title: this.state.scene.title,
      authorName: this.state.scene.authorName,
      createdAt: this.state.scene.createdAt,
    });

    return this.state.scene.id;
  }

  /** Unpublish the scene and remove from Gallery. */
  @callable()
  async unpublish(): Promise<void> {
    if (!this.state.scene) {
      throw new Error("No scene to unpublish");
    }
    this.setState({
      ...this.state,
      scene: { ...this.state.scene, isPublic: false },
    });

    const galleryId = this.env.GalleryAgent.idFromName("gallery");
    const gallery = this.env.GalleryAgent.get(galleryId);
    await gallery.unregister(this.state.scene.id);
  }

  /** Get full scene data (used by fork flow). */
  @callable()
  getSceneData(): {
    scene: SceneData | null;
    layers: Layer[];
  } {
    return { scene: this.state.scene, layers: this.state.layers };
  }

  /** Claim ownership of this scene for a user. Only works if unclaimed or already owned by the same user. */
  @callable()
  claimScene(userId: string): boolean {
    if (!this.state.scene) {
      return false;
    }
    const currentOwner = this.state.scene.ownerId ?? null;
    if (currentOwner && currentOwner !== userId) {
      return false;
    }
    if (currentOwner === userId) {
      return true;
    }
    this.setState({
      ...this.state,
      scene: { ...this.state.scene, ownerId: userId },
    });
    return true;
  }

  /** Initialize this scene as a fork of another scene. */
  @callable()
  async initFromFork(
    sourceSceneId: string,
    sourceTitle: string,
    sourceLayers: Layer[]
  ): Promise<void> {
    const scene: SceneData = {
      id: this.name,
      title: `${sourceTitle} (fork)`,
      authorName: null,
      createdAt: new Date().toISOString(),
      forkedFrom: sourceSceneId,
      isPublic: false,
      ownerId: null,
    };

    // Copy R2 objects so each scene owns its own audio files
    const forkedLayers = await Promise.all(
      sourceLayers.map(async (l) => {
        if (!l.r2Key) {
          return { ...l };
        }
        const prefix = l.type === "music" ? "music" : "sfx";
        const newKey = `${prefix}/${crypto.randomUUID()}.mp3`;
        const srcObj = await this.env.AUDIO_BUCKET.get(l.r2Key);
        if (srcObj) {
          await this.env.AUDIO_BUCKET.put(newKey, srcObj.body);
          return { ...l, r2Key: newKey };
        }
        return { ...l, r2Key: "" };
      })
    );

    this.setState({
      scene,
      layers: forkedLayers,
      generating: false,
      generationProgress: null,
    });
  }
}
