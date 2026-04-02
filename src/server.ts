import { routeAgentRequest } from "agents";
import { createAuth } from "./lib/auth";

export { SceneAgent } from "./agents/scene";
export { GalleryAgent } from "./agents/gallery";

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    // Handle auth routes
    if (url.pathname.startsWith("/api/auth")) {
      const auth = createAuth(env, request);
      return auth.handler(request);
    }

    // Claim scenes for authenticated user
    if (url.pathname === "/api/claim-scenes" && request.method === "POST") {
      const auth = createAuth(env, request);
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
      }

      const { sceneIds } = (await request.json()) as { sceneIds: string[] };
      if (!Array.isArray(sceneIds) || sceneIds.length === 0) {
        return new Response("Bad request", { status: 400 });
      }

      const results: { sceneId: string; claimed: boolean }[] = [];
      for (const sceneId of sceneIds) {
        try {
          const doId = env.SceneAgent.idFromName(sceneId);
          const stub = env.SceneAgent.get(doId);
          const claimed = await stub.claimScene(session.user.id);
          results.push({ sceneId, claimed });
        } catch {
          results.push({ sceneId, claimed: false });
        }
      }

      return Response.json({ results });
    }

    // Serve audio files from R2 at /audio/{r2Key}
    if (url.pathname.startsWith("/audio/")) {
      let key: string;
      try {
        key = decodeURIComponent(url.pathname.slice("/audio/".length));
      } catch {
        return new Response("Bad request", { status: 400 });
      }
      const object = await env.AUDIO_BUCKET.get(key);
      if (!object) return new Response("Not found", { status: 404 });

      return new Response(object.body, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=31536000, immutable",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // Route agent WebSocket/RPC requests
    return (
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  }
} satisfies ExportedHandler<Env>;
