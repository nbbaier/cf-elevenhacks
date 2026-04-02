import { ClockIcon, WaveformIcon, SpinnerIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface UserScene {
	sceneId: string;
	title: string;
	createdAt: string;
}

interface MyScenesViewProps {
	onNavigateToScene: (sceneId: string) => void;
}

export function MyScenesView({ onNavigateToScene }: MyScenesViewProps) {
	const [scenes, setScenes] = useState<UserScene[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch("/api/my-scenes", { credentials: "include" })
			.then(async (r) => {
				if (!r.ok) return { scenes: [] };
				return r.json() as Promise<{ scenes: UserScene[] }>;
			})
			.then((data) => setScenes(data.scenes))
			.catch(() => {})
			.finally(() => setLoading(false));
	}, []);

	if (loading) {
		return (
			<div className="max-w-2xl mx-auto w-full px-5 py-14 flex items-center justify-center">
				<SpinnerIcon size={24} className="animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="max-w-2xl mx-auto w-full px-5 py-14 flex flex-col gap-8">
			<div className="animate-fade-up">
				<h1 className="text-2xl font-bold tracking-tight text-foreground">
					My Scenes
				</h1>
				<p className="text-sm text-muted-foreground mt-1">
					All soundscapes you've created or claimed.
				</p>
			</div>

			{scenes.length === 0 ? (
				<Card className="p-8 text-center space-y-3 animate-fade-up" style={{ animationDelay: "0.08s" }}>
					<WaveformIcon size={32} className="mx-auto text-muted-foreground" />
					<p className="text-sm text-muted-foreground">
						You don't have any scenes yet. Create one to get started!
					</p>
				</Card>
			) : (
				<div className="space-y-2 animate-fade-up" style={{ animationDelay: "0.08s" }}>
					{scenes.map((scene) => (
						<Card
							key={scene.sceneId}
							className="p-4 hover:ring-1 hover:ring-primary/30 transition-all cursor-pointer"
							onClick={() => onNavigateToScene(scene.sceneId)}
						>
							<div className="flex items-center gap-3 min-w-0">
								<WaveformIcon size={16} className="text-primary shrink-0" />
								<div className="min-w-0">
									<p className="text-sm font-medium text-foreground truncate mb-1">
										{scene.title}
									</p>
									<p className="text-xs text-muted-foreground flex items-center gap-1">
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
