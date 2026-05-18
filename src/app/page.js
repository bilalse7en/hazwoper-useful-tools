"use client";

import dynamic from "next/dynamic";
import {useState,useEffect} from "react";
import {useRouter} from "next/navigation";
import {InitialLoadingShell} from "@/components/initial-loading-shell";
import {supabase} from "@/lib/supabase";
import {toast} from "sonner";

// Dynamic imports
const ToolsLanding = dynamic(() => import("@/components/tools-landing").then(mod => mod.ToolsLanding), {
	loading: () => <InitialLoadingShell isReady={false} />,
	ssr: false
});

const WelcomeScroll = dynamic(() => import("@/components/welcome-scroll").then(mod => mod.WelcomeScroll), {
	loading: () => <InitialLoadingShell isReady={false} />,
	ssr: false
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
				// Fetch profile for role and generator access
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
				
				// Show Success Toast
				const justLoggedIn = !sessionStorage.getItem('auth_toast_shown');
				if (justLoggedIn) {
					toast.success("Identity Verified", {
						description: `Welcome back, ${activeUser.name || 'Architect'}. Professional suite fully synchronized.`,
					});
					sessionStorage.setItem('auth_toast_shown', 'true');
				}
			} else {
				// Check for stored user (reward users etc)
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

	if(isChecking) {
		return <InitialLoadingShell isReady={false} />;
	}

	// Handle welcome scroll completion
	const handleWelcomeComplete = () => {
		sessionStorage.setItem('welcome_seen', 'true');
		setShowWelcome(false);
	};

	// Always show ToolsLanding — it handles both logged-in and guest states
	return (
		<>
			<InitialLoadingShell isReady={true} />
			{showWelcome && <WelcomeScroll onComplete={handleWelcomeComplete} />}
			<ToolsLanding user={user} />
		</>
	);
}
