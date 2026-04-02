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
