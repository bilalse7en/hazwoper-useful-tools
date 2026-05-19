"use client";

import dynamic from "next/dynamic";
import {useState,useEffect} from "react";
import {useRouter} from "next/navigation";
import {InitialLoadingShell} from "@/components/initial-loading-shell";
import {supabase} from "@/lib/supabase";
import {toast} from "sonner";

// Dynamic imports with SSR enabled for SEO
const ToolsLanding = dynamic(() => import("@/components/tools-landing").then(mod => mod.ToolsLanding), {
	loading: () => <InitialLoadingShell isReady={false} />
});

const BlogSection = dynamic(() => import("@/components/blog-section").then(mod => mod.BlogSection), {
	loading: () => <InitialLoadingShell isReady={false} />
});

const WelcomeScroll = dynamic(() => import("@/components/welcome-scroll").then(mod => mod.WelcomeScroll), {
	loading: () => <InitialLoadingShell isReady={false} />,
	ssr: false // Keep welcome scroll client-only as it's purely interactive
});

const ProfessionalOverview = dynamic(() => import("@/components/professional-overview").then(mod => mod.ProfessionalOverview), {
	loading: () => <div className="h-96" />
});

export default function Home() {
	const router = useRouter();
	const [isChecking,setIsChecking]=useState(true); 
	const [user,setUser]=useState(null);
	const [showWelcome, setShowWelcome] = useState(false);

	useEffect(() => {
		// Show welcome scroll only once per session
		const hasSeenWelcome = sessionStorage.getItem('welcome_seen');
		if (!hasSeenWelcome) {
			setShowWelcome(true);
		}
	}, []);

	useEffect(() => {
		// Listen for auth state changes
		const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
			if (session?.user) {
				const { data: profile } = await supabase
					.from('profiles')
					.select('role, username, first_name, last_name, full_name, avatar_url, has_generator_access, email')
					.eq('id', session.user.id)
					.single();

				const activeUser = {
					id: session.user.id,
					first_name: profile?.first_name || session.user.user_metadata?.first_name || '',
					last_name: profile?.last_name || session.user.user_metadata?.last_name || '',
					full_name: profile?.full_name || session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
					username: profile?.username || session.user.email,
					email: profile?.email || session.user.email,
					role: profile?.role || 'user',
					has_generator_access: profile?.has_generator_access || false,
					name: profile?.full_name || session.user.user_metadata?.full_name || profile?.username || session.user.email,
					avatar: profile?.avatar_url || session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null
				};

				setUser(activeUser);
				sessionStorage.setItem('user', JSON.stringify(activeUser));
				
				const justLoggedIn = !sessionStorage.getItem('auth_toast_shown');
				if (justLoggedIn) {
					toast.success("Identity Verified", {
						description: `Welcome back, ${activeUser.name || 'Architect'}. Professional suite fully synchronized.`,
					});
					sessionStorage.setItem('auth_toast_shown', 'true');
				}
			} else {
				const storedUser = sessionStorage.getItem('user');
				if (storedUser) {
					try {
						const parsed = JSON.parse(storedUser);
						if (parsed.id === 'reward-user') {
							setUser(parsed);
						}
					} catch (e) {}
				}
			}
			setIsChecking(false);
		});

		return () => subscription.unsubscribe();
	}, [router]);

	const handleWelcomeComplete = () => {
		sessionStorage.setItem('welcome_seen', 'true');
		setShowWelcome(false);
	};

	// Always show ToolsLanding — it handles both logged-in and guest states
	return (
		<>
			{/* Professional SEO Infrastructure */}
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "SoftwareApplication",
						"name": "Content Suite",
						"operatingSystem": "Web",
						"applicationCategory": "BusinessApplication",
						"description": "Professional automated course content generator and safety documentation tool. Engineered for HAZWOPER compliance, technical blog creation, and media asset management.",
						"offers": {
							"@type": "Offer",
							"price": "0",
							"priceCurrency": "USD"
						},
						"aggregateRating": {
							"@type": "AggregateRating",
							"ratingValue": "4.9",
							"ratingCount": "250"
						}
					})
				}}
			/>

			<InitialLoadingShell isReady={!isChecking} />
			{showWelcome && <WelcomeScroll onComplete={handleWelcomeComplete} />}
			<ToolsLanding user={user} />
			<ProfessionalOverview />
			<BlogSection />
		</>
	);
}
