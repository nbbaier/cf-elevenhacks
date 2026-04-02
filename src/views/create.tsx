import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
	MagicWandIcon,
	WaveformIcon,
	MinusIcon,
	PlusIcon,
	ClockIcon,
	TrashIcon,
} from "@phosphor-icons/react";
import { AnimatedWaveform } from "../components/animated-waveform";
import { getOwnedScenes, removeOwnedScene, type OwnedScene } from "../lib/owned-scenes";

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
	const [ownedScenes, setOwnedScenes] = useState<OwnedScene[]>(() => getOwnedScenes());

	const handleGenerate = useCallback(() => {
		const desc = description.trim();
		if (!desc) return;
		onGenerate(desc, layerCount);
	}, [description, layerCount, onGenerate]);

	return (
		<div className="max-w-2xl mx-auto w-full px-5 py-10 space-y-8">
			{/* Hero */}
			<div className="text-center space-y-3">
				<div className="mx-auto w-fit">
					<AnimatedWaveform size={48} />
				</div>
				<h1 className="text-2xl font-bold text-foreground">Soundscaper</h1>
				<p className="text-sm text-muted-foreground">
					Describe any scene and AI will generate a layered ambient soundscape
					you can mix, customize, and share.
				</p>
			</div>

			{/* Input */}
			<Card className="p-5 space-y-4">
				<p className="text-sm font-semibold text-foreground">
					Describe your scene
				</p>
				<Textarea
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					placeholder="A rainy café in Tokyo with jazz playing softly and rain on the windows..."
					rows={3}
					className="w-full"
				/>

				{/* Layer count */}
				<div className="flex items-center justify-between">
					<p className="text-xs text-muted-foreground">
						Number of layers
					</p>
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
					className="w-full"
				>
					<MagicWandIcon size={16} />
					Generate Soundscape
				</Button>
			</Card>

			{/* Preset suggestions */}
			<div className="space-y-3">
				<p className="text-xs text-muted-foreground text-center">
					Or try a preset
				</p>
				<div className="flex flex-wrap justify-center gap-2">
					{PRESETS.map((preset) => (
						<Button
							key={preset}
							variant="secondary"
							size="sm"
							onClick={() => setDescription(preset)}
						>
							{preset}
						</Button>
					))}
				</div>
			</div>

			{/* My Soundscapes */}
			{ownedScenes.length > 0 && (
				<div className="space-y-3">
					<p className="text-sm font-semibold text-foreground">
						My Soundscapes
					</p>
					<div className="space-y-2">
						{ownedScenes.map((scene) => (
							<Card
								key={scene.id}
								className="p-4 hover:ring-1 hover:ring-primary transition-colors cursor-pointer"
								onClick={() => onNavigateToScene(scene.id)}
							>
								<div className="flex items-center justify-between gap-3">
									<div className="flex items-center gap-3 min-w-0">
										<WaveformIcon size={16} className="text-primary shrink-0" />
										<div className="min-w-0">
											<p className="text-sm font-medium text-foreground truncate">
												{scene.title}
											</p>
											<p className="text-xs text-muted-foreground flex items-center gap-1">
												<ClockIcon size={10} />
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
