/**
 * Audio Playback Engine — Web Audio API module for seamless looping
 * with ~1.5s crossfade, per-layer volume and pan control.
 */

const CROSSFADE_DURATION = 1.5;

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

interface PanController {
  connect(destination: AudioNode): void;
  disconnect(): void;
  readonly input: AudioNode;
  setPan(pan: number, time: number): void;
}

class StereoPanController implements PanController {
  readonly input: AudioNode;
  private readonly node: StereoPannerNode;

  constructor(node: StereoPannerNode) {
    this.node = node;
    this.input = node;
  }

  connect(destination: AudioNode): void {
    this.node.connect(destination);
  }

  disconnect(): void {
    this.node.disconnect();
  }

  setPan(pan: number, time: number): void {
    this.node.pan.setTargetAtTime(pan, time, 0.05);
  }
}

class GainPanFallbackController implements PanController {
  readonly input: AudioNode;
  private readonly node: GainNode;

  constructor(node: GainNode) {
    this.node = node;
    this.input = node;
  }

  connect(destination: AudioNode): void {
    this.node.connect(destination);
  }

  disconnect(): void {
    this.node.disconnect();
  }

  setPan(): void {
    // Older mobile browsers may not support stereo panning.
    // Fallback keeps playback working and treats pan as centered.
  }
}

interface LayerPlayback {
  activeFadeGain: GainNode | null;
  activeSource: AudioBufferSourceNode | null;
  buffer: AudioBuffer | null;
  crossfadeTimer: ReturnType<typeof setTimeout> | null;
  enabled: boolean;
  gainNode: GainNode;
  id: string;
  panNode: PanController;
  volume: number;
}

export class PlaybackEngine {
  private ctx: AudioContext | null = null;
  private readonly layers: Map<string, LayerPlayback> = new Map();
  private _playing = false;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioContextCtor = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioContextCtor) {
        throw new Error("Web Audio API is not supported in this browser");
      }
      this.ctx = new AudioContextCtor();
    }
    return this.ctx;
  }

  private createPanController(ctx: AudioContext): PanController {
    if ("createStereoPanner" in ctx) {
      try {
        return new StereoPanController(ctx.createStereoPanner());
      } catch {
        // Fall back to a centered gain node on browsers with partial support.
      }
    }

    return new GainPanFallbackController(ctx.createGain());
  }

  /** Load audio for a layer from a URL. */
  async loadLayer(
    id: string,
    audioUrl: string,
    volume = 0.7,
    pan = 0,
    enabled = true
  ): Promise<void> {
    const ctx = this.getContext();

    // Remove existing layer if reloading
    if (this.layers.has(id)) {
      this.removeLayer(id);
    }

    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = await ctx.decodeAudioData(arrayBuffer);

    const gainNode = ctx.createGain();
    const panNode = this.createPanController(ctx);

    gainNode.gain.value = enabled ? volume : 0;
    panNode.setPan(pan, ctx.currentTime);

    panNode.connect(gainNode);
    gainNode.connect(ctx.destination);

    const layer: LayerPlayback = {
      id,
      gainNode,
      panNode,
      buffer,
      volume,
      enabled,
      activeSource: null,
      activeFadeGain: null,
      crossfadeTimer: null,
    };

    this.layers.set(id, layer);

    if (this._playing) {
      this.startLayerLoop(layer);
    }
  }

  /** Start the crossfade loop for a single layer. */
  private startLayerLoop(layer: LayerPlayback): void {
    if (!(layer.buffer && layer.enabled)) {
      return;
    }
    const ctx = this.getContext();
    const duration = layer.buffer.duration;
    const fadeTime = Math.min(CROSSFADE_DURATION, duration / 3);

    const scheduleInstance = () => {
      if (!(layer.buffer && this._playing && layer.enabled)) {
        return;
      }

      const source = ctx.createBufferSource();
      source.buffer = layer.buffer;

      const fadeGain = ctx.createGain();
      fadeGain.connect(layer.panNode.input);
      source.connect(fadeGain);

      const now = ctx.currentTime;

      // Fade in
      fadeGain.gain.setValueAtTime(0, now);
      fadeGain.gain.linearRampToValueAtTime(1, now + fadeTime);

      // Fade out before end
      const fadeOutStart = duration - fadeTime;
      if (fadeOutStart > fadeTime) {
        fadeGain.gain.setValueAtTime(1, now + fadeOutStart);
        fadeGain.gain.linearRampToValueAtTime(0, now + duration);
      }

      source.start(0);

      // Keep reference so we can stop it
      layer.activeSource = source;
      layer.activeFadeGain = fadeGain;

      // Schedule next instance with overlap for crossfade
      const nextDelay = Math.max(100, (fadeOutStart - fadeTime * 0.1) * 1000);
      layer.crossfadeTimer = setTimeout(() => {
        scheduleInstance();
      }, nextDelay);

      // Auto-cleanup when this source ends
      source.onended = () => {
        try {
          fadeGain.disconnect();
        } catch {
          // intentional: disconnect may throw if already disconnected
        }
      };
    };

    scheduleInstance();
  }

  /** Stop and clean up a layer's loop. */
  private stopLayerLoop(layer: LayerPlayback): void {
    if (layer.crossfadeTimer !== null) {
      clearTimeout(layer.crossfadeTimer);
      layer.crossfadeTimer = null;
    }
    try {
      layer.activeSource?.stop();
    } catch {
      // intentional: source may already be stopped
    }
    layer.activeSource = null;
    layer.activeFadeGain = null;
  }

  /** Remove a layer entirely. */
  removeLayer(id: string): void {
    const layer = this.layers.get(id);
    if (!layer) {
      return;
    }

    this.stopLayerLoop(layer);
    try {
      layer.gainNode.disconnect();
      layer.panNode.disconnect();
    } catch {
      // intentional: nodes may already be disconnected
    }
    this.layers.delete(id);
  }

  /** Update a layer's volume. */
  updateLayerVolume(id: string, volume: number): void {
    const layer = this.layers.get(id);
    if (!layer) {
      return;
    }
    layer.volume = volume;
    if (layer.enabled) {
      layer.gainNode.gain.setTargetAtTime(
        volume,
        this.getContext().currentTime,
        0.05
      );
    }
  }

  /** Update a layer's stereo pan (-1 to 1). */
  updateLayerPan(id: string, pan: number): void {
    const layer = this.layers.get(id);
    if (!layer) {
      return;
    }
    layer.panNode.setPan(pan, this.getContext().currentTime);
  }

  /** Enable or disable a layer. */
  updateLayerEnabled(id: string, enabled: boolean): void {
    const layer = this.layers.get(id);
    if (!layer) {
      return;
    }
    layer.enabled = enabled;

    if (enabled && this._playing) {
      layer.gainNode.gain.setTargetAtTime(
        layer.volume,
        this.getContext().currentTime,
        0.1
      );
      this.startLayerLoop(layer);
    } else if (!enabled) {
      layer.gainNode.gain.setTargetAtTime(
        0,
        this.getContext().currentTime,
        0.1
      );
      this.stopLayerLoop(layer);
    }
  }

  /** Check if a layer's audio is loaded. */
  hasLayer(id: string): boolean {
    return this.layers.has(id) && this.layers.get(id)?.buffer !== null;
  }

  /** Start playback of all enabled layers. */
  async play(): Promise<boolean> {
    const ctx = this.getContext();
    if (ctx.state !== "running") {
      try {
        await ctx.resume();
      } catch {
        return false;
      }
    }

    if (ctx.state !== "running") {
      return false;
    }

    this._playing = true;
    for (const layer of this.layers.values()) {
      if (layer.enabled && layer.buffer) {
        this.startLayerLoop(layer);
      }
    }
    return true;
  }

  /** Pause all layers. */
  pause(): void {
    this._playing = false;
    for (const layer of this.layers.values()) {
      this.stopLayerLoop(layer);
    }
  }

  get playing(): boolean {
    return this._playing;
  }

  /** Clean up all resources. */
  destroy(): void {
    this.pause();
    for (const layer of this.layers.values()) {
      try {
        layer.gainNode.disconnect();
        layer.panNode.disconnect();
      } catch {
        // intentional: nodes may already be disconnected
      }
    }
    this.layers.clear();
    this.ctx?.close();
    this.ctx = null;
  }
}
