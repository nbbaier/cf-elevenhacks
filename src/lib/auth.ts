import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import {
  account,
  session,
  user,
  userScenes,
  verification,
} from "./auth-schema";

const schema = { account, session, user, userScenes, verification };

export function createAuth(env: Env, request: Request) {
  const db = drizzle(env.AUTH_DB, { schema });
  const url = new URL(request.url);

  return betterAuth({
    baseURL: url.origin,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema,
    }),
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
