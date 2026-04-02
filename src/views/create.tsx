import {
	ClockIcon,
	MagicWandIcon,
	MinusIcon,
	PlusIcon,
	TrashIcon,
	WaveformIcon,
} from "@phosphor-icons/react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AnimatedWaveform } from "../components/animated-waveform";
import {
	getOwnedScenes,
	type OwnedScene,
	removeOwnedScene,
} from "../lib/owned-scenes";

interface CreateViewProps {
	onGenerate: (description: string, layerCount: number) => void;
	onNavigateToScene: (sceneId: string) => void;
}

const PRESETS = [
	"Rainy Tokyo street at night",
	"Campfire in the woods with crickets and an owl",
	"Busy spaceport with engines and announcements",
	"Underwater coral reef with whale songs",
	"Cozy library with rain on the windows",
	"Mountain cabin during a thunderstorm",
];

export function CreateView({ onGenerate, onNavigateToScene }: CreateViewProps) {
	const [description, setDescription] = useState("");
	const [layerCount, setLayerCount] = useState(5);
	const [ownedScenes, setOwnedScenes] = useState<OwnedScene[]>(() =>
		getOwnedScenes(),
	);

	const handleGenerate = useCallback(() => {
		const desc = description.trim();
		if (!desc) return;
		onGenerate(desc, layerCount);
	}, [description, layerCount, onGenerate]);

	return (
		<div className="max-w-2xl mx-auto w-full px-5 py-14 flex flex-col gap-12">
			{/* Hero */}
			<div className="text-center flex flex-col items-center gap-5 animate-fade-up">
				<div className="mx-auto w-fit">
					<AnimatedWaveform size={64} />
				</div>
				<div className="space-y-2">
					<h1 className="text-4xl font-bold tracking-tight text-foreground">
						Soundscaper
					</h1>
					<p className="text-base font-light text-muted-foreground max-w-md mx-auto leading-relaxed">
						Describe any scene. AI generates a layered ambient soundscape you
						can mix, customize, and share.
					</p>
				</div>
			</div>

			{/* Input */}
			<Card className="p-6 animate-fade-up" style={{ animationDelay: "0.08s" }}>
				<p className="text-sm font-semibold text-foreground">
					Describe your scene
				</p>
				<Textarea
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					placeholder="A rainy café in Tokyo with jazz playing softly and rain on the windows..."
					rows={3}
					className="w-full text-base"
				/>

				{/* Layer count */}
				<div className="flex items-center justify-between">
					<p className="text-xs text-muted-foreground">Number of layers</p>
					<div className="flex items-center gap-3">
						<Button
							variant="secondary"
							size="icon-xs"
							aria-label="Decrease layers"
							disabled={layerCount <= 4}
							onClick={() => setLayerCount((c) => Math.max(4, c - 1))}
						>
							<MinusIcon size={12} />
						</Button>
						<span className="text-sm font-medium text-foreground w-4 text-center">
							{layerCount}
						</span>
						<Button
							variant="secondary"
							size="icon-xs"
							aria-label="Increase layers"
							disabled={layerCount >= 6}
							onClick={() => setLayerCount((c) => Math.min(6, c + 1))}
						>
							<PlusIcon size={12} />
						</Button>
					</div>
				</div>

				<Button
					disabled={!description.trim()}
					onClick={handleGenerate}
					size="lg"
					className="w-full text-base"
				>
					<MagicWandIcon size={18} />
					Generate Soundscape
				</Button>
			</Card>

			{/* Preset suggestions */}
			<div
				className="space-y-4 animate-fade-up"
				style={{ animationDelay: "0.16s" }}
			>
				<p className="text-xs font-medium tracking-wide uppercase text-muted-foreground text-center">
					Try a preset
				</p>
				<div className="flex flex-wrap justify-center gap-2">
					{PRESETS.map((preset, i) => (
						<button
							key={preset}
							type="button"
							onClick={() => setDescription(preset)}
							className="px-3.5 py-2 text-sm rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
						>
							{preset}
						</button>
					))}
				</div>
			</div>

			{/* My Soundscapes */}
			{ownedScenes.length > 0 && (
				<div
					className="space-y-4 animate-fade-up"
					style={{ animationDelay: "0.24s" }}
				>
					<p className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
						My Soundscapes
					</p>
					<div className="space-y-2">
						{ownedScenes.map((scene) => (
							<Card
								key={scene.id}
								className="p-4 hover:ring-1 hover:ring-primary/30 transition-all cursor-pointer"
								onClick={() => onNavigateToScene(scene.id)}
							>
								<div className="flex items-center justify-between gap-3">
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
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											removeOwnedScene(scene.id);
											setOwnedScenes(getOwnedScenes());
										}}
										className="text-muted-foreground hover:text-destructive shrink-0 p-1"
										aria-label="Remove from list"
									>
										<TrashIcon size={14} />
									</button>
								</div>
							</Card>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
