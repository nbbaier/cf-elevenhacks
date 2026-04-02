import { Suspense, useState, useCallback, useEffect } from "react";
import { Button } from "@cloudflare/kumo";
import { Toasty } from "@cloudflare/kumo/components/toast";
import { CloudflareLogo } from "@cloudflare/kumo";
import { SunIcon, MoonIcon, WaveformIcon } from "@phosphor-icons/react";
import { CreateView } from "./views/create";
import { SceneMixer } from "./views/scene-mixer";

function ElevenLabsLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ElevenLabs logo"
    >
      <rect
        x="11"
        y="4"
        width="3.5"
        height="24"
        rx="1.75"
        fill="currentColor"
      />
      <rect
        x="17.5"
        y="4"
        width="3.5"
        height="24"
        rx="1.75"
        fill="currentColor"
      />
    </svg>
  );
}

function ModeToggle() {
  const [dark, setDark] = useState(
    () => document.documentElement.getAttribute("data-mode") === "dark"
  );

  const toggle = useCallback(() => {
    const next = !dark;
    setDark(next);
    const mode = next ? "dark" : "light";
    document.documentElement.setAttribute("data-mode", mode);
    document.documentElement.style.colorScheme = mode;
    localStorage.setItem("theme", mode);
  }, [dark]);

  return (
    <Button
      variant="secondary"
      shape="square"
      icon={dark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
      onClick={toggle}
      aria-label="Toggle theme"
    />
  );
}

// Simple pathname-based router
function useRoute(): {
  view: "create" | "scene";
  sceneId?: string;
} {
  const pathname = window.location.pathname;
  const match = pathname.match(/^\/scene\/([a-zA-Z0-9-]+)/);
  if (match) {
    return { view: "scene", sceneId: match[1] };
  }
  return { view: "create" };
}

export default function App() {
  const [route, setRoute] = useState(useRoute);
  const [newScenePrompt, setNewScenePrompt] = useState<string | null>(null);
  const [newSceneLayerCount, setNewSceneLayerCount] = useState<number>(5);

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

  const handleNavigateToScene = useCallback((sceneId: string) => {
    window.history.pushState({}, "", `/scene/${sceneId}`);
    setNewScenePrompt(null);
    setRoute({ view: "scene", sceneId });
  }, []);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname;
      const match = pathname.match(/^\/scene\/([a-zA-Z0-9-]+)/);
      setRoute(match ? { view: "scene", sceneId: match[1] } : { view: "create" });
      setNewScenePrompt(null);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);


  return (
    <Toasty>
      <div className="flex flex-col h-screen bg-kumo-elevated">
        {/* Header */}
        <header className="px-5 py-3 bg-kumo-base border-b border-kumo-line">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <button
              onClick={handleNavigateHome}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <WaveformIcon
                size={20}
                weight="bold"
                className="text-kumo-accent"
              />
              <span className="text-base font-semibold text-kumo-default">
                Soundscaper
              </span>
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-kumo-subtle">
                <ElevenLabsLogo className="w-4 h-4" />
                <span className="text-xs">×</span>
                <CloudflareLogo variant="glyph" color="color" className="h-3" />
              </div>
              <ModeToggle />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full text-kumo-inactive">
                Loading...
              </div>
            }
          >
            {route.view === "create" && (
              <CreateView onGenerate={handleGenerate} onNavigateToScene={handleNavigateToScene} />
            )}
            {route.view === "scene" && route.sceneId && (
              <SceneMixer
                key={route.sceneId}
                sceneId={route.sceneId}
                isNew={newScenePrompt !== null}
                initialPrompt={newScenePrompt ?? undefined}
                initialLayerCount={newSceneLayerCount}
                onNavigateHome={handleNavigateHome}
              />
            )}
          </Suspense>
        </main>
      </div>
    </Toasty>
  );
}
