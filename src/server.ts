import { routeAgentRequest } from "agents";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { z } from "zod/v4";
import { GalleryAgent } from "./agents/gallery";
import { SceneAgent } from "./agents/scene";
import { createAuth } from "./lib/auth";
import { userScenes } from "./lib/auth-schema";

const claimScenesSchema = z.object({
  sceneIds: z.array(z.string().uuid()).min(1).max(50),
});

const upsertSceneSchema = z.object({
  sceneId: z.string().uuid(),
  title: z.string().min(1).max(200),
});

// biome-ignore lint/performance/noBarrelFile: Cloudflare requires these Durable Object exports from the Worker entry module.
export { GalleryAgent, SceneAgent };

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

      const parsed = claimScenesSchema.safeParse(await request.json());
      if (!parsed.success) {
        return Response.json({ error: parsed.error.message }, { status: 400 });
      }
      const { sceneIds } = parsed.data;

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
                  target: [userScenes.sceneId, userScenes.userId],
                  set: { title: data.scene.title },
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

      const parsed = upsertSceneSchema.safeParse(await request.json());
      if (!parsed.success) {
        return Response.json({ error: parsed.error.message }, { status: 400 });
      }
      const { sceneId, title } = parsed.data;

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
          target: [userScenes.sceneId, userScenes.userId],
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
      if (!object) {
        return new Response("Not found", { status: 404 });
      }

      return new Response(object.body, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=31536000, immutable",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Route agent WebSocket/RPC requests
    return (
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;
