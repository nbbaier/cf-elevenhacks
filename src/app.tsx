import {
  ListIcon,
  MoonIcon,
  SignOutIcon,
  SunIcon,
  WaveformIcon,
} from "@phosphor-icons/react";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { signIn, signOut, useSession } from "./lib/auth-client";
import { useAutoClaimScenes } from "./lib/use-auto-claim";
import { CreateView } from "./views/create";
import { MyScenesView } from "./views/my-scenes";
import { SceneMixer } from "./views/scene-mixer";

const SCENE_PATH_PATTERN = /^\/scene\/([a-zA-Z0-9-]+)/;

function _ElevenLabsLogo({ className }: { className?: string }) {
  return (
    <svg
      aria-label="ElevenLabs logo"
      className={className}
      fill="none"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        fill="currentColor"
        height="24"
        rx="1.75"
        width="3.5"
        x="11"
        y="4"
      />
      <rect
        fill="currentColor"
        height="24"
        rx="1.75"
        width="3.5"
        x="17.5"
        y="4"
      />
    </svg>
  );
}

function _CloudflareLogo({ className }: { className?: string }) {
  return (
    <svg
      aria-label="Cloudflare logo"
      className={className}
      fill="none"
      viewBox="0 0 65 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13.162 14.197l.438-1.51a2.56 2.56 0 00-.094-1.925 2.39 2.39 0 00-1.39-1.23l-8.379-1.14a.33.33 0 01-.216-.127.39.39 0 01-.06-.243.41.41 0 01.345-.337l8.49-1.16a4.83 4.83 0 002.87-2.543l.606-1.468a.48.48 0 00.03-.233C14.992 1.21 12.162.003 9.496.003a9.2 9.2 0 00-8.87 6.79A4.16 4.16 0 00.003 9.34a3.42 3.42 0 00.593 3.42 3.42 3.42 0 00-.41 2.91A3.51 3.51 0 003.56 18h9.303a.43.43 0 00.42-.337l-.12.534z"
        fill="#F6821F"
      />
      <path
        d="M16.576 5.754h-.26a.22.22 0 00-.197.13l-.53 1.82a2.56 2.56 0 00.095 1.924 2.39 2.39 0 001.39 1.23l2.92.4a.33.33 0 01.216.127.39.39 0 01.06.243.41.41 0 01-.345.337l-3.03.414a4.84 4.84 0 00-2.87 2.544l-.17.41a.18.18 0 00.166.252h6.463A3.51 3.51 0 0024 12.12a6.41 6.41 0 00-7.424-6.366z"
        fill="#FBAD41"
      />
    </svg>
  );
}

function ModeToggle() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  const toggle = useCallback(() => {
    const next = !dark;
    setDark(next);
    const mode = next ? "dark" : "light";
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.style.colorScheme = mode;
    localStorage.setItem("theme", mode);
  }, [dark]);

  return (
    <Button
      aria-label="Toggle theme"
      onClick={toggle}
      size="icon-sm"
      variant="secondary"
    >
      {dark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
    </Button>
  );
}

function UserMenu() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return null;
  }

  if (!session) {
    return (
      <Button
        onClick={() => signIn.social({ provider: "google" })}
        size="sm"
        variant="secondary"
      >
        Sign in with Google
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {session.user.image ? (
        <img
          alt={session.user.name}
          className="h-6 w-6 rounded-full"
          height="24"
          referrerPolicy="no-referrer"
          src={session.user.image}
          width="24"
        />
      ) : (
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground text-xs">
          {session.user.name?.charAt(0)?.toUpperCase()}
        </div>
      )}
      <span className="hidden text-foreground text-sm sm:inline">
        {session.user.name}
      </span>
      <Button
        aria-label="Sign out"
        onClick={() => signOut()}
        size="icon-sm"
        variant="secondary"
      >
        <SignOutIcon size={14} />
      </Button>
    </div>
  );
}

// Simple pathname-based router
function useRoute(): {
  view: "create" | "scene" | "my-scenes";
  sceneId?: string;
} {
  const pathname = window.location.pathname;
  if (pathname === "/my-scenes") {
    return { view: "my-scenes" };
  }
  const match = pathname.match(SCENE_PATH_PATTERN);
  if (match) {
    return { view: "scene", sceneId: match[1] };
  }
  return { view: "create" };
}

export default function App() {
  const [route, setRoute] = useState(useRoute);
  const [newScenePrompt, setNewScenePrompt] = useState<string | null>(null);
  const [newSceneLayerCount, setNewSceneLayerCount] = useState<number>(5);
  const { data: session } = useSession();

  useAutoClaimScenes();

  const handleGenerate = useCallback(
    (description: string, layerCount: number) => {
      const id = crypto.randomUUID();
      setNewScenePrompt(description);
      setNewSceneLayerCount(layerCount);
      window.history.pushState({}, "", `/scene/${id}`);
      setRoute({ view: "scene", sceneId: id });
    },
    []
  );

  const handleNavigateHome = useCallback(() => {
    window.history.pushState({}, "", "/");
    setRoute({ view: "create" });
    setNewScenePrompt(null);
  }, []);

  const handleNavigateMyScenes = useCallback(() => {
    window.history.pushState({}, "", "/my-scenes");
    setRoute({ view: "my-scenes" });
    setNewScenePrompt(null);
  }, []);

  const handleNavigateToScene = useCallback((sceneId: string) => {
    window.history.pushState({}, "", `/scene/${sceneId}`);
    setNewScenePrompt(null);
    setRoute({ view: "scene", sceneId });
  }, []);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname;
      if (pathname === "/my-scenes") {
        setRoute({ view: "my-scenes" });
      } else {
        const match = pathname.match(SCENE_PATH_PATTERN);
        setRoute(
          match ? { view: "scene", sceneId: match[1] } : { view: "create" }
        );
      }
      setNewScenePrompt(null);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-border border-b bg-card px-5 py-3.5">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <button
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
            onClick={handleNavigateHome}
            type="button"
          >
            <WaveformIcon className="text-primary" size={22} weight="bold" />
            <span className="font-bold text-base text-foreground tracking-tight">
              Soundscaper
            </span>
          </button>
          <div className="flex items-center gap-3">
            {session && (
              <button
                className="flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
                onClick={handleNavigateMyScenes}
                type="button"
              >
                <ListIcon size={16} />
                <span className="hidden sm:inline">My Scenes</span>
              </button>
            )}
            {/* <div className="flex items-center gap-1.5 text-muted-foreground">
							<ElevenLabsLogo className="w-4 h-4" />
							<span className="text-xs">×</span>
							<CloudflareLogo className="h-3" />
						</div> */}
            <UserMenu />
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Loading...
            </div>
          }
        >
          {route.view === "create" && (
            <CreateView
              onGenerate={handleGenerate}
              onNavigateToScene={handleNavigateToScene}
            />
          )}
          {route.view === "my-scenes" && (
            <MyScenesView onNavigateToScene={handleNavigateToScene} />
          )}
          {route.view === "scene" && route.sceneId && (
            <SceneMixer
              initialLayerCount={newSceneLayerCount}
              initialPrompt={newScenePrompt ?? undefined}
              isNew={newScenePrompt !== null}
              key={route.sceneId}
              onNavigateHome={handleNavigateHome}
              sceneId={route.sceneId}
            />
          )}
        </Suspense>
      </main>
      <Toaster />
    </div>
  );
}
