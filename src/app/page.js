"use client";

import {useState,useEffect} from "react";
import {cn} from "@/lib/utils";
import {AppSidebar} from "@/components/app-sidebar";
import {MobileHeader} from "@/components/mobile-header";
import {BrandLogo} from "@/components/brand-logo";
import {LandingLoader} from "@/components/landing-loader";
import {SimpleLoader} from "@/components/simple-loader";
import {AntigravityExperience} from "@/components/antigravity-experience";
import {ThemeDialog} from "@/components/theme-dialog";
import {LoginScreen} from "@/components/login-screen";
import {VictoryScroll} from "@/components/victory-scroll";
import {SessionTimer} from "@/components/session-timer";
import {WelcomeLanding} from "@/components/welcome-landing";
import {ScrollArea} from "@/components/ui/scroll-area";
import {hasAccess,ROLES} from "@/lib/auth";
import {AdSenseAd} from "@/components/adsense-ad";
import {
	CourseGenerator,
	BlogGenerator,
	GlossaryGenerator,
	ResourceGenerator,
	HTMLCleaner,
	ImageConverter,
	VideoCompressor,
	AIAssistant,
	ImageToText,
	DocumentExtractor
} from "@/components/generators";

export default function Home() {
	const [showWelcome,setShowWelcome]=useState(true);
	const [isLoading,setIsLoading]=useState(false);
	const [loaderVariant,setLoaderVariant]=useState("game"); // "game" | "simple" | "antigravity"
	const [isChecking,setIsChecking]=useState(true); // Prevent flash
	const [activeTab,setActiveTab]=useState("course");
	const [sidebarCollapsed,setSidebarCollapsed]=useState(false);
	const [themeDialogOpen,setThemeDialogOpen]=useState(false);
	const [user,setUser]=useState(null);
	const [showWinCelebration,setShowWinCelebration]=useState(false);
	const [winRole,setWinRole]=useState(null);

	useEffect(() => {
		// 1. Check if user has seen welcome page
		const hasSeenWelcome=sessionStorage.getItem('hasSeenWelcome');
		if(hasSeenWelcome) {
			setShowWelcome(false);
		}

		// 2. Check Reward Status (Priority)
		const rewardTime=localStorage.getItem('reward_claim_time');
		const TWO_HOURS=2*60*60*1000;

		let activeUser=null;
		let shouldShowLoader=false;
		let isRewardActive=false;

		if(rewardTime) {
			const elapsed=Date.now()-parseInt(rewardTime);
			if(elapsed<TWO_HOURS) {
				// Valid Reward Session - Auto Login
				activeUser={
					username: 'admin',
					role: 'admin',
					name: 'Reward Admin (2H)',
					loginTime: Date.now()
				};
				isRewardActive=true;
			}
		}

		// 3. Check session storage for user (if not already handled by reward)
		if(!activeUser) {
			const storedUser=sessionStorage.getItem('user');
			if(storedUser) {
				activeUser=JSON.parse(storedUser);
			}
		}

		// Apply User if found
		if(activeUser) {
			setUser(activeUser);
			sessionStorage.setItem('user',JSON.stringify(activeUser));

			// Restore active tab logic
			if(!isRewardActive) { // Only restore tab for normal logins, rewards usually default or safe to default
				const savedTab=sessionStorage.getItem('activeTab');
				if(savedTab&&hasAccess(activeUser.role,savedTab)) {
					setActiveTab(savedTab);
				} else {
					if(activeUser.role==='blog_creator') setActiveTab('blog');
					else if(activeUser.role==='content_creator') setActiveTab('course');
				}
			}

			// If we have a user, we never show the game loader.
			shouldShowLoader=false;
		}

		// 4. Check if user already attempted and failed this session
		// Only relevant if we don't have an active user yet.
		if(!activeUser) {
			const attemptStatus=sessionStorage.getItem('reward_attempted');
			// If they failed, or explicitly succeeded (though success usually implies activeUser via reward check, 
			// unless reward expired but session remains? If reward expired, activeUser is null. 
			// If 'success' flag is there but reward expired... we probably treat as new or expired.)

			if(attemptStatus==='failed') {
				shouldShowLoader=false; // Skip game, show login
			}
			// If attemptStatus is 'success' but no activeUser (reward expired), shouldShowLoader stays true (retry? or blocked?)
			// Assuming if reward expired, they can try again? Or should we block? 
			// User said "expired reward - Do NOT show loader again" in previous logic.
			// Let's stick to previous logic: if reward expired, skipLoader was true => isLoading false.

			if(rewardTime&&!isRewardActive) {
				shouldShowLoader=false;
			}
		}

		setIsLoading(shouldShowLoader);
		setIsChecking(false);
	},[]);

	const handleRewardUnlock=(role='admin') => {
		const roleNames={
			'admin': 'Reward Admin (2H)',
			'content_creator': 'Content Reward (2H)',
			'blog_creator': 'Blog Reward (2H)'
		};

		// Reset scroll for the upcoming cinematic reveal
		window.scrollTo(0, 0);

		// Show victory screen FIRST
		setWinRole(role);
		setShowWinCelebration(true);

		// Prepare user data (will be set after victory screen completes)
		const rewardUser={
			username: 'reward_user',
			role: role,
			name: roleNames[role]||'Reward User (2H)',
			loginTime: Date.now()
		};

		// Store for later use
		sessionStorage.setItem('pending_user',JSON.stringify(rewardUser));
		localStorage.setItem('reward_claim_time',Date.now().toString());
		sessionStorage.setItem('reward_attempted','success');
	};

	const handleLoaderComplete=() => {
		setIsLoading(false);
		sessionStorage.setItem('hasVisited','true');
	};

	const handleLoaderFail=() => {
		setUser(null);
		sessionStorage.removeItem('user');
		sessionStorage.setItem('reward_attempted','failed');
	};

	const handleLogin=(loggedInUser) => {
		setUser(loggedInUser);
		sessionStorage.setItem('user',JSON.stringify(loggedInUser));
		// Set default tab based on role
		if(loggedInUser.role==='blog_creator') {
			setActiveTab('blog');
		} else if(loggedInUser.role==='content_creator') {
			setActiveTab('course');
		} else {
			setActiveTab('course');
		}
	};

	const handlePlayGame=() => {
		sessionStorage.setItem('hasSeenWelcome','true');
		setShowWelcome(false);
		setIsLoading(true);
	};

	const handleSkipToSignIn=() => {
		sessionStorage.setItem('hasSeenWelcome','true');
		setShowWelcome(false);
	};

	const handleLogout=() => {
		setUser(null);
		sessionStorage.removeItem('user');
		localStorage.removeItem('reward_claim_time');
		sessionStorage.removeItem('reward_attempted');
		setIsLoading(false); // Ensure loader doesn't show again on logout
	};

	const renderActiveGenerator=() => {
		if(!user) return null;

		// Security check
		if(!hasAccess(user.role,activeTab)) {
			return (
				<div className="flex h-[50vh] flex-col items-center justify-center text-center">
					<h2 className="text-2xl font-bold text-muted-foreground">Access Denied</h2>
					<p>You do not have permission to view this generator.</p>
				</div>
			);
		}

		switch(activeTab) {
		case "course":
			return <CourseGenerator />;
		case "glossary":
			return <GlossaryGenerator />;
		case "resources":
			return <ResourceGenerator />;
		case "blog":
			return <BlogGenerator />;
		case "html-cleaner":
			return <HTMLCleaner />;
		case "image-converter":
			return <ImageConverter />;
		case "video-compressor":
			return <VideoCompressor />;
		case "ai-assistant":
			return <AIAssistant />;
		case "image-to-text":
			return <ImageToText />;
		case "document-extractor":
			return <DocumentExtractor />;
		case "pdf-suite":
			return <PDFSuite />;
		default:
			return <CourseGenerator />;
		}
	};

	const getPageTitle=() => {
		switch(activeTab) {
		case "course":
			return "Web Content Generator";
		case "glossary":
			return "Glossary Generator";
		case "resources":
			return "Resource Generator";
		case "blog":
			return "Blog Generator";
		case "html-cleaner":
			return "HTML Cleaner";
		case "video-compressor":
			return "Video Compressor";
		case "ai-assistant":
			return "AI UNIVERSE - Neural Hub";
		case "image-to-text":
			return "Image to Text - OCR Converter";
		case "document-extractor":
			return "Document Content Extractor";
		case "pdf-suite":
			return "PDF Suite - Secure & Extract";
		default:
			return "Course Content Generator";
		}
	};

	if(isChecking) {
		return <div className="min-h-screen bg-background" />;
	}

	// EXCLUSIVE VIEW: Victory Celebration
	if(showWinCelebration&&winRole) {
		return (
			<VictoryScroll
				role={winRole}
				onComplete={() => {
					// Get pending user and set it as active
					const pendingUser=sessionStorage.getItem('pending_user');
					if(pendingUser) {
						const userData=JSON.parse(pendingUser);
						setUser(userData);
						sessionStorage.setItem('user',JSON.stringify(userData));
						sessionStorage.removeItem('pending_user');

						// Set active tab based on preferredTab from victory scroll
						if(userData.preferredTab) {
							setActiveTab(userData.preferredTab);
						}
					}
					setShowWinCelebration(false);
					setIsLoading(false);
					// Reset scroll for the main app entry
					window.scrollTo(0, 0);
				}}
			/>
		);
	}

	return (
		<>
			{/* PRIORITY 1: Welcome Landing (Before Game/Login) */}
			{showWelcome && !user && !showWinCelebration && (
				<WelcomeLanding onPlayGame={handlePlayGame} onSignIn={handleSkipToSignIn} />
			)}

			{/* PRIORITY 2: Game Loader (only if not showing victory and welcome is done/hidden) */}
			{isLoading&&!showWinCelebration&&!showWelcome&&(
				loaderVariant==="game"? (
					<LandingLoader onComplete={handleLoaderComplete} onUnlock={handleRewardUnlock} onFail={handleLoaderFail} />
				):loaderVariant==="antigravity"? (
					<AntigravityExperience onComplete={handleLoaderComplete} />
				):(
					<SimpleLoader />
				)
			)}

			{/* PRIORITY 3: Login Screen (only if no user and not in victory/loading/welcome) */}
			{!user&&!isLoading&&!showWinCelebration&&!showWelcome&&(
				<LoginScreen onLogin={handleLogin} />
			)}

			{/* PRIORITY 4: Main App (only if user exists) */}
			{user&&(
				<>
					{/* Main App Layout */}
					<div className={cn(
						"min-h-screen bg-transparent transition-opacity duration-500",
						isLoading&&!user? "opacity-0":"opacity-100"
					)}>
						{/* Desktop Sidebar */}
						<AppSidebar
							activeTab={activeTab}
							onTabChange={setActiveTab}
							collapsed={sidebarCollapsed}
							onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
							onThemeToggle={() => setThemeDialogOpen(true)}
							user={user}
							onLogout={handleLogout}
							className="hidden lg:block fixed left-0 top-0 z-40 h-screen"
						/>

						{/* Mobile Header */}
						<MobileHeader
							activeTab={activeTab}
							onTabChange={setActiveTab}
							onThemeToggle={() => setThemeDialogOpen(true)}
							user={user}
							onLogout={handleLogout}
						/>

						{/* Main Content */}
						<main
							className={cn(
								"min-h-screen transition-all duration-300 lg:pt-0",
								sidebarCollapsed? "lg:ml-16":"lg:ml-64"
							)}
						>
							<ScrollArea className="h-screen">
								{/* Hero Section */}
								<div className="border-b border-border bg-gradient-to-b from-muted/50 to-transparent py-8 lg:py-16 hero-section animate-in-card">
									<div className="container mx-auto px-4 text-center">
										<BrandLogo
											size="lg"
											className="mx-auto mb-4 lg:mb-6 shadow-lg ring-4 ring-primary/20 hover:scale-105 transition-transform duration-500"
										/>
										<h1 id="mainTitle" className="mb-3 lg:mb-4 text-2xl lg:text-3xl xl:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary via-blue-500 to-cyan-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]">
											{getPageTitle()}
										</h1>
									</div>
								</div>

								{/* Content Area */}
								<div className="container mx-auto px-4 py-8 animate-in-card [animation-delay:200ms]">
									{/* AdSense Banner - Top of Content */}
									<div className="mb-8 flex justify-center">
										<AdSenseAd 
											slot="9491607826" 
											format="horizontal"
											style={{ maxWidth: '970px', width: '100%' }}
										/>
									</div>
									
									{renderActiveGenerator()}
								</div>
							</ScrollArea>
						</main>
					</div>

					{/* Theme Dialog */}
					<ThemeDialog open={themeDialogOpen} onOpenChange={setThemeDialogOpen} />

					{/* Session Timer (only for reward users) */}
					{user&&localStorage.getItem('reward_claim_time')&&(
						<SessionTimer onExpire={handleLogout} />
					)}
				</>
			)}
		</>
	);
}
