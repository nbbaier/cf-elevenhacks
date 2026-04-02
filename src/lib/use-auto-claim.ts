import { useEffect, useRef } from "react";
import { useSession } from "./auth-client";
import { getOwnedScenes } from "./owned-scenes";

/**
 * When a user signs in, automatically claim all scenes
 * stored in localStorage by POSTing to /api/claim-scenes.
 */
export function useAutoClaimScenes() {
  const { data: session } = useSession();
  const claimedRef = useRef(false);

  useEffect(() => {
    if (!session?.user?.id || claimedRef.current) {
      return;
    }
    claimedRef.current = true;

    const scenes = getOwnedScenes();
    if (scenes.length === 0) {
      return;
    }

    fetch("/api/claim-scenes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ sceneIds: scenes.map((s) => s.id) }),
    }).catch(() => {
      // Silent fail — scenes remain in localStorage regardless
    });
  }, [session?.user?.id]);
}
