# Soundscaper

AI-powered ambient soundscape generator. Describe a scene in natural language and get a layered, mixable soundscape you can customize, save, and share.

Built with [Cloudflare Agents SDK](https://developers.cloudflare.com/agents/), [ElevenLabs](https://elevenlabs.io/) APIs, and [Workers AI](https://developers.cloudflare.com/workers-ai/).

## How it works

1. **Describe a scene** — e.g. "rainy Tokyo street at night"
2. **AI decomposes it** — Workers AI breaks the description into 4-6 distinct sound layers
3. **Audio generation** — ElevenLabs generates loopable ambient sounds for each layer (and optional background music)
4. **Mix and customize** — adjust volume, panning, toggle layers, edit prompts, add or remove layers
5. **Save and share** — publish your soundscape with a shareable link; others can listen and fork it

## Quick start

```bash
bun install
```

Create a `.env` file:

```
ELEVENLABS_API_KEY=your-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
BETTER_AUTH_SECRET=your-secret
```

```bash
bun run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Tech stack

- **Frontend:** React 19, Tailwind CSS, shadcn/ui, Web Audio API
- **Backend:** Cloudflare Workers, Durable Objects, R2 (audio storage), D1 (auth database)
- **AI:** Workers AI (scene decomposition), ElevenLabs Sound Effects API, ElevenLabs Music API
- **Auth:** Better Auth with Google OAuth, Drizzle ORM

## Features

- **Scene generation** from natural language with configurable layer count (4-6)
- **Per-layer mixing** — volume, stereo panning, enable/disable
- **Seamless looping** with crossfade via Web Audio API
- **Layer editing** — edit prompts and regenerate, add new layers, remove layers
- **Persistence** — localStorage for quick access, D1 for authenticated users
- **Sharing** — publish scenes with a link, fork others' creations with attribution
- **Optional auth** — scenes work without login; Google OAuth to save across devices

## Project structure

```
src/
  server.ts                 # Worker entry, API routes, audio serving
  agents/
    scene.ts                # SceneAgent — per-scene Durable Object
    gallery.ts              # GalleryAgent — published scenes registry
  views/
    create.tsx              # Home/scene creation
    scene-mixer.tsx         # Scene editor with layer controls
    my-scenes.tsx           # User's saved scenes
  components/
    layer-card.tsx          # Layer control card (volume, pan, edit, remove)
    animated-waveform.tsx   # Playback visualization
    ui/                     # Base UI components
  services/
    decomposition.ts        # Workers AI scene breakdown
    audio-generation.ts     # ElevenLabs API + R2 storage
  lib/
    auth.ts                 # Better Auth server config
    auth-client.ts          # Client-side auth hooks
    auth-schema.ts          # Drizzle schema
    elevenlabs.ts           # ElevenLabs SDK client
    playback-engine.ts      # Web Audio API mixing engine
    owned-scenes.ts         # localStorage persistence
    use-auto-claim.ts       # Auto-claim scenes on login
  app.tsx                   # SPA router + header
  client.tsx                # React entry
  styles.css                # Tailwind + animations
```

## Agents SDK features used

- **`Agent`** — stateful Durable Objects for per-scene isolation (SceneAgent, GalleryAgent)
- **`@callable()`** — typed RPC methods callable from the browser
- **`setState` / `useAgent`** — real-time state sync between agent and UI

## Deploy

```bash
bun x wrangler r2 bucket create elevenlabs-audio
bun x wrangler secret put ELEVENLABS_API_KEY
bun x wrangler secret put GOOGLE_CLIENT_ID
bun x wrangler secret put GOOGLE_CLIENT_SECRET
bun x wrangler secret put BETTER_AUTH_SECRET
bun run deploy
```

## Links

- [Agents SDK docs](https://developers.cloudflare.com/agents/)
- [ElevenLabs API reference](https://elevenlabs.io/docs/api-reference)
