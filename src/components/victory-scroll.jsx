"use client";

import {useEffect,useState,useRef} from "react";
import {motion,useScroll,useTransform,useSpring,AnimatePresence,useInView} from "framer-motion";
import {Trophy,Crown,BookOpen,FileText,Sparkles,ChevronDown,ArrowDown} from "lucide-react";

// Scroll-triggered animated text component
const ScrollRevealText=({text,className="",delay=0}) => {
	const ref=useRef(null);
	const isInView=useInView(ref,{once: false,amount: 0.5});
	const letters=Array.from(text);

	return (
		<span ref={ref} className={className}>
			{letters.map((letter,index) => (
				<motion.span
					key={index}
					initial={{opacity: 0,y: 50,rotateX: -90}}
					animate={isInView? {
						opacity: 1,
						y: 0,
						rotateX: 0
					}:{opacity: 0,y: 50,rotateX: -90}}
					transition={{
						duration: 0.8,
						delay: delay+index*0.03,
						ease: [0.25,0.46,0.45,0.94]
					}}
					style={{display: 'inline-block'}}
				>
					{letter===" "? "\u00A0":letter}
				</motion.span>
			))}
		</span>
	);
};

// Centered scroll-triggered container
const ScrollSection=({children,className=""}) => {
	const ref=useRef(null);
	const isInView=useInView(ref,{once: false,amount: 0.3});

	return (
		<motion.div
			ref={ref}
			className={className}
			initial={{opacity: 0,scale: 0.8}}
			animate={isInView? {
				opacity: 1,
				scale: 1
			}:{opacity: 0,scale: 0.8}}
			transition={{
				duration: 1.2,
				ease: [0.25,0.46,0.45,0.94]
			}}
		>
			{children}
		</motion.div>
	);
};

// Scroll progress indicator
const ScrollProgress=({progress,currentSection,totalSections}) => {
	return (
		<div className="fixed left-8 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-3">
			{[...Array(totalSections)].map((_,i) => (
				<motion.div
					key={i}
					className="relative"
					initial={{scale: 0}}
					animate={{scale: 1}}
					transition={{delay: i*0.1}}
				>
					<div className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${i<=currentSection? 'bg-primary border-primary scale-125':'bg-transparent border-foreground/30'
						}`} />
					{i<totalSections-1&&(
						<div className={`absolute left-1/2 -translate-x-1/2 top-full w-0.5 h-8 transition-colors duration-300 ${i<currentSection? 'bg-primary':'bg-foreground/20'
							}`} />
					)}
				</motion.div>
			))}
		</div>
	);
};

export function VictoryScroll({role,onComplete}) {
	const containerRef=useRef(null);
	const [hasReachedEnd,setHasReachedEnd]=useState(false);
	const [currentSection,setCurrentSection]=useState(0);

	const {scrollYProgress}=useScroll({
		target: containerRef,
		offset: ["start start","end end"]
	});

	const smoothProgress=useSpring(scrollYProgress,{
		stiffness: 100,
		damping: 30,
		restDelta: 0.001
	});

	const getRoleInfo=() => {
		switch(role) {
		case 'admin':
			return {
				title: "ULTIMATE VICTORY!",
				icon: Crown,
				color: "from-amber-500 via-yellow-500 to-orange-500",
				glow: "shadow-[0_0_80px_rgba(251,191,36,0.5)]",
				particles: "#fbbf24",
				winText: "You've conquered the galaxy and unlocked FULL ADMIN ACCESS for 2 hours!",
				tools: [
					{name: "Course Generator",desc: "Transform documents into professional web content with AI-powered extraction"},
					{name: "Blog Generator",desc: "Create SEO-optimized blog posts with intelligent content generation"},
					{name: "All Premium Tools",desc: "Full access to every tool in the platform including glossary, resources & more"}
				],
				preferredTab: 'course'
			};
		case 'blog_creator':
			return {
				title: "STELLAR ACHIEVEMENT!",
				icon: BookOpen,
				color: "from-pink-500 via-rose-500 to-red-500",
				glow: "shadow-[0_0_80px_rgba(236,72,153,0.5)]",
				particles: "#ec4899",
				winText: "Amazing flight! You've unlocked BLOG & CONTENT ACCESS for 2 hours!",
				tools: [
					{name: "Blog Generator",desc: "Generate professional, engaging blog content with advanced AI"},
					{name: "Course Generator",desc: "Create comprehensive course materials from your documents"}
				],
				preferredTab: 'blog'
			};
		case 'content_creator':
			return {
				title: "ORBIT REACHED!",
				icon: FileText,
				color: "from-cyan-500 via-blue-500 to-indigo-500",
				glow: "shadow-[0_0_80px_rgba(6,182,212,0.5)]",
				particles: "#06b6d4",
				winText: "Excellent piloting! You've unlocked CONTENT ACCESS for 2 hours!",
				tools: [
					{name: "Course Generator",desc: "Extract FAQs, create glossaries, and generate course content automatically"}
				],
				preferredTab: 'course'
			};
		default:
			return {
				title: "CONGRATULATIONS!",
				icon: Trophy,
				color: "from-green-500 via-emerald-500 to-teal-500",
				glow: "shadow-[0_0_80px_rgba(34,197,94,0.5)]",
				particles: "#22c55e",
				winText: "You've earned access!",
				tools: [],
				preferredTab: 'course'
			};
		}
	};

	const roleInfo=getRoleInfo();
	const Icon=roleInfo.icon;

	// Track current section based on scroll
	useEffect(() => {
		const unsubscribe=smoothProgress.on("change",(latest) => {
			const section=Math.floor(latest*5);
			setCurrentSection(Math.min(section,4));

			// Mark as reached end when scroll is 95%+
			if(latest>=0.95&&!hasReachedEnd) {
				setHasReachedEnd(true);
			}
		});
		return () => unsubscribe();
	},[smoothProgress,hasReachedEnd]);

	// Auto-complete 5 seconds after reaching end
	useEffect(() => {
		if(hasReachedEnd) {
			const timer=setTimeout(() => {
				// Store preferred tab in pending user
				const pendingUser=sessionStorage.getItem('pending_user');
				if(pendingUser) {
					const userData=JSON.parse(pendingUser);
					userData.preferredTab=roleInfo.preferredTab;
					sessionStorage.setItem('pending_user',JSON.stringify(userData));
				}
				onComplete?.();
			},5000);
			return () => clearTimeout(timer);
		}
	},[hasReachedEnd,onComplete,roleInfo.preferredTab]);

	return (
		<div ref={containerRef} className="fixed inset-0 z-[200] bg-gradient-to-br from-background via-background/95 to-background overflow-y-auto overflow-x-hidden scroll-smooth">
			{/* Animated Grid Background */}
			<div className="absolute inset-0 opacity-[0.03]">
				<motion.div
					className="absolute inset-0"
					style={{
						backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px),
						                 linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
						backgroundSize: '50px 50px'
					}}
					animate={{
						backgroundPosition: ['0px 0px','50px 50px']
					}}
					transition={{
						duration: 20,
						repeat: Infinity,
						ease: "linear"
					}}
				/>
			</div>

			{/* Floating Particles with scroll parallax */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				{[...Array(40)].map((_,i) => {
					const yOffset=useTransform(smoothProgress,[0,1],[0,-(Math.random()*800+300)]);
					const rotation=useTransform(smoothProgress,[0,1],[0,Math.random()*720]);
					return (
						<motion.div
							key={i}
							className="absolute rounded-full"
							style={{
								width: Math.random()*8+3+'px',
								height: Math.random()*8+3+'px',
								left: `${Math.random()*100}%`,
								top: `${Math.random()*100+50}%`,
								backgroundColor: roleInfo.particles,
								opacity: 0.3,
								y: yOffset,
								rotate: rotation,
								filter: 'blur(1px)'
							}}
						/>
					);
				})}
			</div>

			{/* Scroll Progress Indicator */}
			<ScrollProgress progress={smoothProgress} currentSection={currentSection} totalSections={5} />

			{/* Completion Countdown */}
			<AnimatePresence>
				{hasReachedEnd&&(
					<motion.div
						className="fixed top-8 left-1/2 -translate-x-1/2 z-50"
						initial={{opacity: 0,y: -20}}
						animate={{opacity: 1,y: 0}}
						exit={{opacity: 0,y: -20}}
					>
						<div className={`glass-panel px-6 py-3 rounded-full border-2 border-primary ${roleInfo.glow}`}>
							<p className={`text-lg font-bold bg-gradient-to-r ${roleInfo.color} bg-clip-text text-transparent`}>
								Redirecting in 5 seconds...
							</p>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Main Scroll Content */}
			<div className="relative min-h-[500vh]">
				{/* Section 1: Victory Title */}
				<div className="sticky top-0 h-screen flex items-center justify-center">
					<ScrollSection className="text-center px-4">
						{/* Animated rings around icon */}
						<div className="relative inline-block mb-12">
							{[...Array(3)].map((_,i) => (
								<motion.div
									key={i}
									className={`absolute inset-0 rounded-full border-4`}
									style={{borderColor: roleInfo.particles}}
									animate={{
										scale: [1,2+i*0.5],
										opacity: [0.5,0]
									}}
									transition={{
										duration: 3,
										repeat: Infinity,
										delay: i*1,
										ease: "easeOut"
									}}
								/>
							))}

							<motion.div
								className="relative"
								initial={{scale: 0,rotate: -180}}
								animate={{scale: 1,rotate: 0}}
								transition={{
									type: "spring",
									stiffness: 200,
									damping: 20,
									delay: 0.2
								}}
							>
								<motion.div
									className={`absolute inset-0 blur-3xl ${roleInfo.glow}`}
									animate={{
										scale: [1,1.4,1],
										opacity: [0.4,0.7,0.4]
									}}
									transition={{duration: 3,repeat: Infinity}}
								/>
								<div className="relative glass-panel p-10 rounded-[2rem]">
									<motion.div
										animate={{
											rotateY: [0,360]
										}}
										transition={{
											duration: 20,
											repeat: Infinity,
											ease: "linear"
										}}
									>
										<Icon className="w-32 h-32 text-foreground" />
									</motion.div>
								</div>
							</motion.div>
						</div>

						{/* Title with Scroll Reveal */}
						<ScrollRevealText
							text={roleInfo.title}
							className={`block text-6xl md:text-8xl font-black bg-gradient-to-r ${roleInfo.color} bg-clip-text text-transparent drop-shadow-2xl mb-8`}
							delay={0.3}
						/>

						{/* Scroll Indicator - More prominent */}
						<motion.div
							className="mt-16"
							initial={{opacity: 0}}
							animate={{opacity: 1}}
							transition={{delay: 2}}
						>
							<motion.div
								animate={{y: [0,15,0]}}
								transition={{duration: 2,repeat: Infinity}}
								className="flex flex-col items-center gap-2"
							>
								<p className="text-xl font-semibold text-foreground/80">Scroll to continue</p>
								<div className="flex flex-col gap-1">
									<ChevronDown className="w-10 h-10 text-primary" />
									<ChevronDown className="w-10 h-10 text-primary -mt-6 opacity-50" />
								</div>
							</motion.div>
						</motion.div>
					</ScrollSection>
				</div>

				{/* Section 2: What You Won */}
				<div className="sticky top-0 h-screen flex items-center justify-center">
					<ScrollSection className="max-w-4xl w-full px-4">
						<motion.div
							className="glass-panel p-12 rounded-[2rem] border border-border backdrop-blur-xl relative overflow-hidden"
							initial={{rotateY: -15}}
							whileInView={{rotateY: 0}}
							transition={{duration: 1.2}}
						>
							{/* Animated gradient overlay */}
							<motion.div
								className={`absolute inset-0 bg-gradient-to-br ${roleInfo.color} opacity-10`}
								animate={{
									backgroundPosition: ['0% 0%','100% 100%']
								}}
								transition={{
									duration: 10,
									repeat: Infinity,
									repeatType: "reverse"
								}}
							/>

							<div className="relative z-10">
								<ScrollRevealText
									text={roleInfo.winText}
									className={`text-3xl md:text-5xl font-bold leading-relaxed bg-gradient-to-r ${roleInfo.color} bg-clip-text text-transparent`}
									delay={0.1}
								/>

								{/* Animated Progress Bar */}
								<div className="mt-8 relative">
									<motion.div
										className="h-2 bg-foreground/10 rounded-full overflow-hidden"
									>
										<motion.div
											className={`h-full bg-gradient-to-r ${roleInfo.color} relative`}
											initial={{width: 0}}
											whileInView={{width: "100%"}}
											transition={{delay: 1,duration: 2,ease: "easeOut"}}
										>
											{/* Shimmer effect */}
											<motion.div
												className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
												animate={{
													x: ['-100%','200%']
												}}
												transition={{
													duration: 2,
													repeat: Infinity,
													ease: "linear"
												}}
											/>
										</motion.div>
									</motion.div>
								</div>
							</div>
						</motion.div>

						{/* Scroll hint */}
						<motion.div
							className="text-center mt-8"
							animate={{opacity: [0.5,1,0.5]}}
							transition={{duration: 2,repeat: Infinity}}
						>
							<ArrowDown className="w-8 h-8 text-foreground/40 mx-auto" />
						</motion.div>
					</ScrollSection>
				</div>

				{/* Section 3: Tools Grid */}
				<div className="sticky top-0 h-screen flex items-center justify-center">
					<ScrollSection className="max-w-5xl w-full px-4">
						<motion.h2
							className="text-5xl md:text-6xl font-black text-center text-foreground mb-12"
							initial={{opacity: 0,y: -30}}
							whileInView={{opacity: 1,y: 0}}
							transition={{duration: 0.8}}
						>
							Your Unlocked Tools
						</motion.h2>

						<div className="grid gap-6 md:grid-cols-2">
							{roleInfo.tools.map((tool,index) => (
								<motion.div
									key={tool.name}
									className="glass-panel p-6 rounded-2xl border border-border backdrop-blur-xl relative overflow-hidden group"
									initial={{
										opacity: 0,
										x: index%2===0? -100:100,
										rotateY: index%2===0? -30:30
									}}
									whileInView={{
										opacity: 1,
										x: 0,
										rotateY: 0
									}}
									transition={{
										delay: index*0.2,
										duration: 1,
										type: "spring",
										stiffness: 100
									}}
									whileHover={{
										scale: 1.05,
										transition: {duration: 0.3}
									}}
								>
									{/* Animated gradient on hover */}
									<motion.div
										className={`absolute inset-0 bg-gradient-to-br ${roleInfo.color} opacity-0 group-hover:opacity-15`}
										animate={{
											backgroundPosition: ['0% 0%','100% 100%','0% 0%']
										}}
										transition={{
											duration: 3,
											repeat: Infinity
										}}
									/>

									<div className="relative z-10">
										<h3 className={`text-2xl font-black bg-gradient-to-r ${roleInfo.color} bg-clip-text text-transparent mb-3`}>
											{tool.name}
										</h3>
										<p className="text-lg text-muted-foreground leading-relaxed">
											{tool.desc}
										</p>
									</div>

									{/* Corner sparkle */}
									<motion.div
										className={`absolute top-4 right-4 w-2 h-2 rounded-full bg-gradient-to-r ${roleInfo.color}`}
										animate={{
											scale: [0,1.5,0],
											opacity: [0,1,0]
										}}
										transition={{
											duration: 2,
											repeat: Infinity,
											delay: index*0.5
										}}
									/>
								</motion.div>
							))}
						</div>

						{/* Scroll hint */}
						<motion.div
							className="text-center mt-8"
							animate={{opacity: [0.5,1,0.5]}}
							transition={{duration: 2,repeat: Infinity}}
						>
							<ArrowDown className="w-8 h-8 text-foreground/40 mx-auto" />
						</motion.div>
					</ScrollSection>
				</div>

				{/* Section 4: Developer Credits */}
				<div className="sticky top-0 h-screen flex items-center justify-center">
					<ScrollSection>
						<motion.div
							className="relative glass-panel px-16 py-12 rounded-[2.5rem] border-2 border-border backdrop-blur-2xl"
							initial={{scale: 0.5,rotate: -5}}
							whileInView={{scale: 1,rotate: 0}}
							transition={{
								type: "spring",
								stiffness: 150,
								damping: 15
							}}
						>
							<div className={`absolute inset-0 bg-gradient-to-br ${roleInfo.color} opacity-10 rounded-[2.5rem]`} />

							{/* Sparkle Burst Animation */}
							<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
								{[...Array(12)].map((_,i) => (
									<motion.div
										key={i}
										className={`absolute w-4 h-4 rounded-full bg-gradient-to-r ${roleInfo.color}`}
										animate={{
											x: [0,Math.cos(i*Math.PI/6)*200],
											y: [0,Math.sin(i*Math.PI/6)*200],
											scale: [0,1.5,0],
											opacity: [1,0.6,0]
										}}
										transition={{
											duration: 3,
											repeat: Infinity,
											delay: i*0.1,
											ease: "easeOut"
										}}
									/>
								))}
							</div>

							<div className="relative z-10 text-center">
								<motion.div
									className="text-5xl md:text-7xl font-black mb-2"
									initial={{opacity: 0}}
									whileInView={{opacity: 1}}
									transition={{delay: 0.3}}
								>
									<span className="text-foreground">Crafted by </span>
									<span className={`bg-gradient-to-r ${roleInfo.color} bg-clip-text text-transparent`}>
										Bilal
									</span>
								</motion.div>
								<motion.p
									className="text-2xl text-muted-foreground font-medium"
									initial={{opacity: 0,y: 10}}
									whileInView={{opacity: 1,y: 0}}
									transition={{delay: 0.8}}
								>
									with passion & innovation
								</motion.p>
							</div>
						</motion.div>

						{/* Scroll hint */}
						<motion.div
							className="text-center mt-8"
							animate={{opacity: [0.5,1,0.5]}}
							transition={{duration: 2,repeat: Infinity}}
						>
							<ArrowDown className="w-8 h-8 text-foreground/40 mx-auto" />
						</motion.div>
					</ScrollSection>
				</div>

				{/* Section 5: LOGO GIF - Epic Finale */}
				<div className="sticky top-0 h-screen flex items-center justify-center">
					<ScrollSection className="text-center">
						<motion.div
							className="relative inline-block"
							initial={{scale: 0,rotate: -180}}
							whileInView={{scale: 1,rotate: 0}}
							transition={{
								type: "spring",
								stiffness: 120,
								damping: 15,
								delay: 0.2
							}}
						>
							{/* Multiple pulsing glow rings */}
							{[...Array(3)].map((_,i) => (
								<motion.div
									key={i}
									className={`absolute -inset-${8+i*4} blur-3xl ${roleInfo.glow} rounded-full`}
									animate={{
										scale: [1,1.5+i*0.2,1],
										opacity: [0.3+i*0.1,0.6+i*0.1,0.3+i*0.1]
									}}
									transition={{
										duration: 3+i,
										repeat: Infinity,
										ease: "easeInOut",
										delay: i*0.5
									}}
								/>
							))}

							{/* Particle Burst System */}
							<div className="absolute inset-0 pointer-events-none">
								{[...Array(16)].map((_,i) => (
									<motion.div
										key={i}
										className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full"
										style={{backgroundColor: roleInfo.particles}}
										animate={{
											x: [0,Math.cos(i*Math.PI/8)*250],
											y: [0,Math.sin(i*Math.PI/8)*250],
											scale: [0,2,0],
											opacity: [0.8,0.4,0]
										}}
										transition={{
											duration: 3,
											repeat: Infinity,
											delay: i*0.08,
											ease: "easeOut"
										}}
									/>
								))}
							</div>

							{/* Logo GIF */}
							<motion.img
								src="https://media.hazwoper-osha.com/wp-content/uploads/2025/12/1765460885/Hi.gif"
								alt="HAZWOPER Logo"
								className="relative z-10 w-64 h-64 md:w-96 md:h-96 object-contain logo-animate rounded-3xl"
								initial={{opacity: 0}}
								whileInView={{opacity: 1}}
								transition={{delay: 0.5,duration: 1}}
								animate={{
									rotateY: [0,10,-10,0],
									scale: [1,1.08,1]
								}}
								transition={{
									rotateY: {duration: 6,repeat: Infinity,ease: "easeInOut"},
									scale: {duration: 4,repeat: Infinity,ease: "easeInOut"}
								}}
							/>

							{/* Continuous animated ring pulses */}
							{[...Array(2)].map((_,i) => (
								<motion.div
									key={i}
									className={`absolute inset-0 border-4 border-current rounded-3xl`}
									style={{borderColor: roleInfo.particles}}
									animate={{
										scale: [1,1.5],
										opacity: [0.6,0]
									}}
									transition={{
										duration: 2,
										repeat: Infinity,
										ease: "easeOut",
										delay: i*1
									}}
								/>
							))}
						</motion.div>

						{/* Logo Title */}
						<motion.h2
							className={`mt-12 text-4xl md:text-6xl font-black bg-gradient-to-r ${roleInfo.color} bg-clip-text text-transparent`}
							initial={{opacity: 0,y: 30}}
							whileInView={{opacity: 1,y: 0}}
							transition={{delay: 1,duration: 0.8}}
						>
							HAZWOPER Useful Tools
						</motion.h2>

						<motion.p
							className="mt-4 text-xl text-muted-foreground"
							initial={{opacity: 0}}
							whileInView={{opacity: 1}}
							transition={{delay: 1.5}}
						>
							Your journey begins now
						</motion.p>

						{/* Final completion indicator */}
						{!hasReachedEnd&&(
							<motion.p
								className="mt-8 text-sm text-foreground/50"
								animate={{opacity: [0.3,0.7,0.3]}}
								transition={{duration: 2,repeat: Infinity}}
							>
								Keep scrolling to finish...
							</motion.p>
						)}
					</ScrollSection>
				</div>

				{/* Extra scroll space for natural completion */}
				<div className="h-screen" />
			</div>
		</div>
	);
}
