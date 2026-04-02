/**
 * Tracks which scenes this browser owns, stored in localStorage.
 * Stores metadata (title, createdAt) so the Create view can list them.
 */

export interface OwnedScene {
  createdAt: string;
  id: string;
  title: string;
}

const STORAGE_KEY = "ownedScenes";

/** Read all owned scenes from localStorage. */
export function getOwnedScenes(): OwnedScene[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);

    // Backward compat: old format was string[]
    if (
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      typeof parsed[0] === "string"
    ) {
      const migrated: OwnedScene[] = (parsed as string[]).map((id) => ({
        id,
        title: "Untitled Soundscape",
        createdAt: new Date().toISOString(),
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }

    return parsed as OwnedScene[];
  } catch {
    return [];
  }
}

/** Check if a scene ID is owned by this browser. */
export function isOwnedScene(id: string): boolean {
  return getOwnedScenes().some((s) => s.id === id);
}

/** Add a new scene to the owned list. */
export function addOwnedScene(id: string, title: string, createdAt: string) {
  const scenes = getOwnedScenes().filter((s) => s.id !== id);
  scenes.unshift({ id, title, createdAt });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenes));
}

/** Update the title of an owned scene (e.g. after the user renames it). */
export function updateOwnedScene(
  id: string,
  updates: Partial<Pick<OwnedScene, "title">>
) {
  const scenes = getOwnedScenes();
  const idx = scenes.findIndex((s) => s.id === id);
  if (idx === -1) {
    return;
  }
  scenes[idx] = { ...scenes[idx], ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenes));
}

/** Remove a scene from the owned list. */
export function removeOwnedScene(id: string) {
  const scenes = getOwnedScenes().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenes));
}
