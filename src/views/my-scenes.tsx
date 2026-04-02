import { ClockIcon, SpinnerIcon, WaveformIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface UserScene {
  createdAt: string;
  sceneId: string;
  title: string;
}

interface MyScenesViewProps {
  onNavigateToScene: (sceneId: string) => void;
}

export function MyScenesView({ onNavigateToScene }: MyScenesViewProps) {
  const [scenes, setScenes] = useState<UserScene[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/my-scenes", { credentials: "include" })
      .then((r) => {
        if (!r.ok) {
          return { scenes: [] };
        }
        return r.json() as Promise<{ scenes: UserScene[] }>;
      })
      .then((data) => setScenes(data.scenes))
      .catch(() => {
        setScenes([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-2xl items-center justify-center px-5 py-14">
        <SpinnerIcon className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-5 py-14">
      <div className="animate-fade-up">
        <h1 className="font-bold text-2xl text-foreground tracking-tight">
          My Scenes
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          All soundscapes you've created or claimed.
        </p>
      </div>

      {scenes.length === 0 ? (
        <Card
          className="animate-fade-up space-y-3 p-8 text-center"
          style={{ animationDelay: "0.08s" }}
        >
          <WaveformIcon className="mx-auto text-muted-foreground" size={32} />
          <p className="text-muted-foreground text-sm">
            You don't have any scenes yet. Create one to get started!
          </p>
        </Card>
      ) : (
        <div
          className="animate-fade-up space-y-2"
          style={{ animationDelay: "0.08s" }}
        >
          {scenes.map((scene) => (
            <Card
              className="cursor-pointer p-4 transition-all hover:ring-1 hover:ring-primary/30"
              key={scene.sceneId}
              onClick={() => onNavigateToScene(scene.sceneId)}
            >
              <div className="flex min-w-0 items-center gap-3">
                <WaveformIcon className="shrink-0 text-primary" size={16} />
                <div className="min-w-0">
                  <p className="mb-1 truncate font-medium text-foreground text-sm">
                    {scene.title}
                  </p>
                  <p className="flex items-center gap-1 text-muted-foreground text-xs">
                    <ClockIcon size={13} />
                    {new Date(scene.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
