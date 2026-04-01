/**
 * Audio Playback Engine — Web Audio API module for seamless looping
 * with ~1.5s crossfade, per-layer volume and pan control.
 */

const CROSSFADE_DURATION = 1.5;

interface LayerPlayback {
  id: string;
  gainNode: GainNode;
  panNode: StereoPannerNode;
  buffer: AudioBuffer | null;
  volume: number;
  enabled: boolean;
  activeSource: AudioBufferSourceNode | null;
  activeFadeGain: GainNode | null;
  crossfadeTimer: ReturnType<typeof setTimeout> | null;
}

export class PlaybackEngine {
  private ctx: AudioContext | null = null;
  private layers: Map<string, LayerPlayback> = new Map();
  private _playing = false;

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  /** Load audio for a layer from a URL. */
  async loadLayer(
    id: string,
    audioUrl: string,
    volume = 0.7,
    pan = 0
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
    const panNode = ctx.createStereoPanner();

    gainNode.gain.value = volume;
    panNode.pan.value = pan;

    panNode.connect(gainNode);
    gainNode.connect(ctx.destination);

    const layer: LayerPlayback = {
      id,
      gainNode,
      panNode,
      buffer,
      volume,
      enabled: true,
      activeSource: null,
      activeFadeGain: null,
      crossfadeTimer: null
    };

    this.layers.set(id, layer);

    if (this._playing) {
      this.startLayerLoop(layer);
    }
  }

  /** Start the crossfade loop for a single layer. */
  private startLayerLoop(layer: LayerPlayback): void {
    if (!layer.buffer || !layer.enabled) return;
    const ctx = this.getContext();
    const duration = layer.buffer.duration;
    const fadeTime = Math.min(CROSSFADE_DURATION, duration / 3);

    const scheduleInstance = () => {
      if (!layer.buffer || !this._playing || !layer.enabled) return;

      const source = ctx.createBufferSource();
      source.buffer = layer.buffer;

      const fadeGain = ctx.createGain();
      fadeGain.connect(layer.panNode);
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
        } catch {}
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
    } catch {}
    layer.activeSource = null;
    layer.activeFadeGain = null;
  }

  /** Remove a layer entirely. */
  removeLayer(id: string): void {
    const layer = this.layers.get(id);
    if (!layer) return;

    this.stopLayerLoop(layer);
    try {
      layer.gainNode.disconnect();
      layer.panNode.disconnect();
    } catch {}
    this.layers.delete(id);
  }

  /** Update a layer's volume. */
  updateLayerVolume(id: string, volume: number): void {
    const layer = this.layers.get(id);
    if (!layer) return;
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
    if (!layer) return;
    layer.panNode.pan.setTargetAtTime(
      pan,
      this.getContext().currentTime,
      0.05
    );
  }

  /** Enable or disable a layer. */
  updateLayerEnabled(id: string, enabled: boolean): void {
    const layer = this.layers.get(id);
    if (!layer) return;
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
    return this.layers.has(id) && this.layers.get(id)!.buffer !== null;
  }

  /** Start playback of all enabled layers. */
  play(): void {
    const ctx = this.getContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    this._playing = true;
    for (const layer of this.layers.values()) {
      if (layer.enabled && layer.buffer) {
        this.startLayerLoop(layer);
      }
    }
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
      } catch {}
    }
    this.layers.clear();
    this.ctx?.close();
    this.ctx = null;
  }
}
