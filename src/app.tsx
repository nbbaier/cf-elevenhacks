import { Button } from "@/components/ui/button";
import {
	MoonIcon,
	SignOutIcon,
	SunIcon,
	WaveformIcon,
} from "@phosphor-icons/react";
import { Suspense, useCallback, useEffect, useState } from "react";
import { signIn, signOut, useSession } from "./lib/auth-client";
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

function CloudflareLogo({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 65 18"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			aria-label="Cloudflare logo"
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
	const [dark, setDark] = useState(
		() => document.documentElement.classList.contains("dark"),
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
			variant="secondary"
			size="icon-sm"
			onClick={toggle}
			aria-label="Toggle theme"
		>
			{dark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
		</Button>
	);
}

function UserMenu() {
	const { data: session, isPending } = useSession();

	if (isPending) return null;

	if (!session) {
		return (
			<Button
				variant="secondary"
				size="sm"
				onClick={() => signIn.social({ provider: "google" })}
			>
				Sign in with Google
			</Button>
		);
	}

	return (
		<div className="flex items-center gap-2">
			{session.user.image ? (
				<img
					src={session.user.image}
					alt={session.user.name}
					className="w-6 h-6 rounded-full"
					referrerPolicy="no-referrer"
				/>
			) : (
				<div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground">
					{session.user.name?.charAt(0)?.toUpperCase()}
				</div>
			)}
			<span className="text-sm text-foreground hidden sm:inline">
				{session.user.name}
			</span>
			<Button
				variant="secondary"
				size="icon-sm"
				onClick={() => signOut()}
				aria-label="Sign out"
			>
				<SignOutIcon size={14} />
			</Button>
		</div>
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
		[],
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
			setRoute(
				match ? { view: "scene", sceneId: match[1] } : { view: "create" },
			);
			setNewScenePrompt(null);
		};
		window.addEventListener("popstate", handlePopState);
		return () => window.removeEventListener("popstate", handlePopState);
	}, []);

	return (
		<div className="flex flex-col h-screen bg-background">
			{/* Header */}
			<header className="px-5 py-3 bg-card border-b border-border">
				<div className="max-w-2xl mx-auto flex items-center justify-between">
					<button
						type="button"
						onClick={handleNavigateHome}
						className="flex items-center gap-2 hover:opacity-80 transition-opacity"
					>
						<WaveformIcon
							size={20}
							weight="bold"
							className="text-primary"
						/>
						<span className="text-base font-semibold text-foreground">
							Soundscaper
						</span>
					</button>
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-1.5 text-muted-foreground">
							<ElevenLabsLogo className="w-4 h-4" />
							<span className="text-xs">×</span>
							<CloudflareLogo className="h-3" />
						</div>
						<UserMenu />
						<ModeToggle />
					</div>
				</div>
			</header>

			{/* Content */}
			<main className="flex-1 overflow-y-auto">
				<Suspense
					fallback={
						<div className="flex items-center justify-center h-full text-muted-foreground">
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
	);
}
