import { Agent, callable } from "agents";

export interface PublishedScene {
  id: string;
  title: string;
  authorName: string | null;
  createdAt: string;
}

export interface GalleryState {
  scenes: PublishedScene[];
}

/**
 * Gallery Agent — singleton Durable Object.
 * Maintains a registry of published scenes for share link resolution.
 * No browse/discovery UI — used solely to validate that a scene ID is public.
 */
export class GalleryAgent extends Agent<Env, GalleryState> {
  initialState: GalleryState = { scenes: [] };

  /** Register a scene as publicly shared. */
  @callable()
  async register(scene: PublishedScene): Promise<void> {
    const existing = this.state.scenes.find((s) => s.id === scene.id);
    if (existing) {
      this.setState({
        ...this.state,
        scenes: this.state.scenes.map((s) =>
          s.id === scene.id ? scene : s
        )
      });
    } else {
      this.setState({
        ...this.state,
        scenes: [...this.state.scenes, scene]
      });
    }
  }

  /** Remove a scene from the public registry. */
  @callable()
  async unregister(id: string): Promise<void> {
    this.setState({
      ...this.state,
      scenes: this.state.scenes.filter((s) => s.id !== id)
    });
  }

  /** Look up a published scene by ID. */
  @callable()
  async resolve(id: string): Promise<PublishedScene | null> {
    return this.state.scenes.find((s) => s.id === id) || null;
  }
}
