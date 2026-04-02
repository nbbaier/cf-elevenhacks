import { routeAgentRequest } from "agents";
import { drizzle } from "drizzle-orm/d1";
import { eq, desc } from "drizzle-orm";
import { createAuth } from "./lib/auth";
import { userScenes } from "./lib/auth-schema";

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

      const db = drizzle(env.AUTH_DB);
      const results: { sceneId: string; claimed: boolean }[] = [];
      for (const sceneId of sceneIds) {
        try {
          const doId = env.SceneAgent.idFromName(sceneId);
          const stub = env.SceneAgent.get(doId);
          const claimed = await stub.claimScene(session.user.id);
          if (claimed) {
            // Fetch scene data from DO and upsert into user_scenes index
            const data = await stub.getSceneData();
            if (data.scene) {
              await db
                .insert(userScenes)
                .values({
                  sceneId,
                  userId: session.user.id,
                  title: data.scene.title,
                  createdAt: new Date(data.scene.createdAt),
                })
                .onConflictDoUpdate({
                  target: userScenes.sceneId,
                  set: { userId: session.user.id, title: data.scene.title },
                });
            }
          }
          results.push({ sceneId, claimed });
        } catch {
          results.push({ sceneId, claimed: false });
        }
      }

      return Response.json({ results });
    }

    // Register or update a scene in the user_scenes index
    if (url.pathname === "/api/my-scenes" && request.method === "POST") {
      const auth = createAuth(env, request);
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
      }

      const { sceneId, title } = (await request.json()) as {
        sceneId: string;
        title: string;
      };
      if (!sceneId || !title) {
        return new Response("Bad request", { status: 400 });
      }

      const db = drizzle(env.AUTH_DB);
      await db
        .insert(userScenes)
        .values({
          sceneId,
          userId: session.user.id,
          title,
          createdAt: new Date(),
        })
        .onConflictDoUpdate({
          target: userScenes.sceneId,
          set: { title },
        });

      return Response.json({ ok: true });
    }

    // List scenes for authenticated user
    if (url.pathname === "/api/my-scenes" && request.method === "GET") {
      const auth = createAuth(env, request);
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
      }

      const db = drizzle(env.AUTH_DB);
      const scenes = await db
        .select()
        .from(userScenes)
        .where(eq(userScenes.userId, session.user.id))
        .orderBy(desc(userScenes.createdAt));

      return Response.json({ scenes });
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
