"use client";

import {useState,useEffect} from "react";
import Link from "next/link";
import {Trophy,LogIn,Sparkles,Zap,Flame,Shield,Rocket,Star,ChevronRight,Gift,BookOpen} from "lucide-react";
import { AdSenseAd } from "@/components/adsense-ad";
import { Footer } from "@/components/footer";

export function WelcomeLanding({onPlayGame,onSignIn}) {
	const [isVisible,setIsVisible]=useState(false);
	const [hoveredCard,setHoveredCard]=useState(null);
	const [particles,setParticles]=useState([]);

	useEffect(() => {
		setIsVisible(true);
		
		// Generate floating particles
		const newParticles=Array.from({length: 15},(_,i) => ({ // Reduced for performance
			id: i,
			x: Math.random()*100,
			y: Math.random()*100,
			size: Math.random()*4+2,
			duration: Math.random()*20+15,
			delay: Math.random()*5
		}));
		setParticles(newParticles);
	},[]);

	return (
		<div className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-y-auto custom-scrollbar">
			{/* Animated Grid Background */}
			<div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:64px_64px]" />
			
			{/* Radial Gradient Overlay */}
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.1),transparent_50%)]" />
			
			{/* Floating Particles */}
			{particles.map(particle => (
				<div
					key={particle.id}
					className="absolute rounded-full bg-gradient-to-br from-green-500/30 to-cyan-500/30 blur-sm"
					style={{
						left: `${particle.x}%`,
						top: `${particle.y}%`,
						width: `${particle.size}px`,
						height: `${particle.size}px`,
						animation: `float ${particle.duration}s ease-in-out infinite`,
						animationDelay: `${particle.delay}s`
					}}
				/>
			))}

			<style jsx>{`
				@keyframes float {
					0%, 100% {
						transform: translateY(0) translateX(0);
						opacity: 0.3;
					}
					50% {
						transform: translateY(-30px) translateX(20px);
						opacity: 0.8;
					}
				}
				@keyframes slideUp {
					from {
						opacity: 0;
						transform: translateY(40px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}
				@keyframes fadeIn {
					from {
						opacity: 0;
					}
					to {
						opacity: 1;
					}
				}
				@keyframes pulse-glow {
					0%, 100% {
						box-shadow: 0 0 20px rgba(34,197,94,0.3), 0 0 40px rgba(34,197,94,0.1);
					}
					50% {
						box-shadow: 0 0 30px rgba(34,197,94,0.5), 0 0 60px rgba(34,197,94,0.2);
					}
				}
				@keyframes shimmer {
					0% {
						background-position: -1000px 0;
					}
					100% {
						background-position: 1000px 0;
					}
				}
				.animate-slide-up {
					animation: slideUp 0.8s ease-out forwards;
				}
				.animate-fade-in {
					animation: fadeIn 1s ease-out forwards;
				}
				.animate-pulse-glow {
					animation: pulse-glow 2s ease-in-out infinite;
				}
				.shimmer-effect {
					background: linear-gradient(
						90deg,
						transparent,
						rgba(255,255,255,0.1),
						transparent
					);
					background-size: 1000px 100%;
					animation: shimmer 3s infinite;
				}
			`}</style>

			{/* Main Content */}
			<div className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center px-4 py-20 transition-all duration-1000">
				
				{/* Header Section */}
				<div className="text-center mb-16 max-w-4xl mx-auto" style={{animation: 'slideUp 0.8s ease-out forwards'}}>
					{/* Brand Badge */}
					<div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/20 rounded-full px-6 py-2 mb-8 backdrop-blur-sm">
						<Sparkles className="w-4 h-4 text-green-400" />
						<span className="text-sm font-bold text-green-400 tracking-wider uppercase">Welcome to HAZWOPER Tools</span>
						<Sparkles className="w-4 h-4 text-cyan-400" />
					</div>

					{/* Main Title */}
					<h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-[1.1]">
						<span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-green-200 to-cyan-300 drop-shadow-[0_0_30px_rgba(34,197,94,0.3)]">
							Choose Your
						</span>
						<span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 drop-shadow-[0_0_40px_rgba(34,197,94,0.5)] mt-2">
							Adventure
						</span>
					</h1>

					{/* Subtitle */}
					<p className="text-xl md:text-2xl text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">
						Unlock premium tools and accelerate your productivity
					</p>
				</div>

				{/* Cards Container */}
				<div className="grid md:grid-cols-2 gap-8 max-w-5xl w-full px-4" style={{animation: 'slideUp 0.8s ease-out 0.2s forwards', opacity: 0}}>
					
					{/* Play Game Card */}
					<div
						onMouseEnter={() => setHoveredCard('game')}
						onMouseLeave={() => setHoveredCard(null)}
						onClick={onPlayGame}
						className="group relative cursor-pointer"
					>
						{/* Glow Effect */}
						<div className={`absolute -inset-1 bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-60 transition-all duration-500 ${hoveredCard==='game'? 'animate-pulse-glow':''}`} />
						
						{/* Card */}
						<div className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-green-500/20 rounded-3xl p-8 md:p-10 transform transition-all duration-500 hover:scale-[1.02] hover:border-green-500/40 overflow-hidden">
							
							{/* Shimmer Effect */}
							<div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100" />
							
							{/* Icon Badge */}
							<div className="relative mb-6 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-[0_10px_40px_rgba(34,197,94,0.3)] transform transition-transform group-hover:scale-110 group-hover:rotate-6">
								<Trophy className="w-10 h-10 text-white drop-shadow-lg" />
								<div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1.5 shadow-lg animate-pulse">
									<Gift className="w-4 h-4 text-slate-900" />
								</div>
							</div>

							{/* Title */}
							<h2 className="relative text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400 mb-4">
								Play & Win
							</h2>

							{/* Description */}
							<p className="relative text-slate-300 text-lg mb-6 leading-relaxed">
								Test your skills in our exciting space runner game and unlock <span className="text-green-400 font-bold">2 hours of FREE premium access</span> as a reward!
							</p>

							{/* Features List */}
							<ul className="relative space-y-3 mb-8">
								{[
									{icon: Rocket,text: "Fast-paced gameplay"},
									{icon: Zap,text: "Multiple difficulty levels"},
									{icon: Shield,text: "Unlock premium features"}
								].map((item,index) => (
									<li key={index} className="flex items-center gap-3 text-slate-400">
										<div className="bg-green-500/20 rounded-lg p-1.5">
											<item.icon className="w-4 h-4 text-green-400" />
										</div>
										<span className="font-medium">{item.text}</span>
									</li>
								))}
							</ul>

							{/* CTA Button */}
							<button className="relative w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-lg py-4 px-8 rounded-xl shadow-[0_10px_30px_rgba(34,197,94,0.3)] transform transition-all hover:shadow-[0_15px_40px_rgba(34,197,94,0.4)] hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-3 overflow-hidden group/btn">
								<span className="relative z-10 flex items-center gap-3">
									<Flame className="w-6 h-6" />
									START GAME
									<ChevronRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" />
								</span>
								<div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
							</button>

							{/* Badge */}
							<div className="relative mt-4 text-center">
								<span className="inline-flex items-center gap-2 text-xs text-green-400 font-bold uppercase tracking-wider">
									<Star className="w-3 h-3 fill-green-400" />
									Most Popular
									<Star className="w-3 h-3 fill-green-400" />
								</span>
							</div>
						</div>
					</div>

					{/* Sign In Card */}
					<div
						onMouseEnter={() => setHoveredCard('signin')}
						onMouseLeave={() => setHoveredCard(null)}
						onClick={onSignIn}
						className="group relative cursor-pointer"
					>
						{/* Glow Effect */}
						<div className={`absolute -inset-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-50 transition-all duration-500`} />
						
						{/* Card */}
						<div className="relative bg-gradient-to-br from-slate-900/70 to-slate-800/70 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 md:p-10 transform transition-all duration-500 hover:scale-[1.02] hover:border-cyan-500/30 overflow-hidden">
							
							{/* Shimmer Effect */}
							<div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100" />
							
							{/* Icon Badge */}
							<div className="relative mb-6 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-600 shadow-[0_10px_40px_rgba(0,0,0,0.3)] transform transition-transform group-hover:scale-110 group-hover:rotate-6">
								<LogIn className="w-10 h-10 text-cyan-400 drop-shadow-lg" />
							</div>

							{/* Title */}
							<h2 className="relative text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-cyan-300 mb-4">
								Sign In
							</h2>

							{/* Description */}
							<p className="relative text-slate-400 text-lg mb-6 leading-relaxed">
								Already have credentials? Skip the game and access your account directly with your existing login.
							</p>

							{/* Features List */}
							<ul className="relative space-y-3 mb-8">
								{[
									{icon: Zap,text: "Instant access"},
									{icon: Shield,text: "Secure authentication"},
									{icon: Star,text: "All your saved data"}
								].map((item,index) => (
									<li key={index} className="flex items-center gap-3 text-slate-500">
										<div className="bg-slate-700/50 rounded-lg p-1.5">
											<item.icon className="w-4 h-4 text-slate-400" />
										</div>
										<span className="font-medium">{item.text}</span>
									</li>
								))}
							</ul>

							{/* CTA Button */}
							<button className="relative w-full bg-gradient-to-r from-slate-700 to-slate-600 text-white font-black text-lg py-4 px-8 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.3)] transform transition-all hover:shadow-[0_15px_40px_rgba(100,116,139,0.4)] hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-3 overflow-hidden group/btn hover:from-cyan-600 hover:to-blue-600">
								<span className="relative z-10 flex items-center gap-3">
									<LogIn className="w-6 h-6" />
									SIGN IN NOW
									<ChevronRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" />
								</span>
							</button>

							{/* Badge */}
							<div className="relative mt-4 text-center">
								<span className="inline-flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-wider">
									Quick & Direct
								</span>
							</div>
						</div>
					</div>

				</div>

				{/* Professional Tools Section - Addressing AdSense Content Requirements */}
				<div className="mt-32 w-full max-w-6xl px-6 py-16" style={{animation: 'fadeIn 1s ease-out 0.4s forwards', opacity: 0}}>
					<h2 className="text-3xl md:text-5xl font-black text-white text-center mb-16">
						Our <span className="text-green-400">Professional</span> Suite
					</h2>
					<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
						{[
							{ id: 'web-content', name: 'Content Gen', icon: '📝' },
							{ id: 'blog-generator', name: 'Blog Gen', icon: '✍️' },
							{ id: 'glossary-generator', name: 'Glossary', icon: '📚' },
							{ id: 'media-tools', name: 'Media Opt', icon: '🎬', link: '/tools/video-compressor' },
							{ id: 'ocr-tools', name: 'Smart OCR', icon: '📷', link: '/tools/image-to-text' },
						].map((item) => (
							<Link 
								key={item.id} 
								href={item.link || `/tools/${item.id}`}
								className="p-6 rounded-[32px] bg-white/5 border border-white/10 hover:border-green-500/30 hover:bg-white/10 transition-all text-center group"
							>
								<div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{item.icon}</div>
								<div className="text-xs font-bold text-slate-300 uppercase tracking-widest">{item.name}</div>
							</Link>
						))}
					</div>
					<div className="mt-8 text-center">
						<Link href="/blog" className="inline-flex items-center gap-2 text-green-400 font-bold hover:underline">
							View all tools & guides <ChevronRight className="w-4 h-4" />
						</Link>
					</div>
				</div>

				{/* Features Brief for SEO */}
				<div className="mt-24 w-full max-w-6xl grid md:grid-cols-3 gap-12 px-6 py-16 border-t border-white/5" style={{animation: 'fadeIn 1s ease-out 0.6s forwards', opacity: 0}}>
					<div className="space-y-4">
						<h3 className="text-xl font-bold text-white flex items-center gap-2">
							<Shield className="w-5 h-5 text-green-400" />
							Privacy First
						</h3>
						<p className="text-slate-400 leading-relaxed text-sm">
							All document processing happens entirely in your local browser. Your sensitive files never touch our servers, ensuring absolute confidentiality and data security.
						</p>
					</div>
					<div className="space-y-4">
						<h3 className="text-xl font-bold text-white flex items-center gap-2">
							<Zap className="w-5 h-5 text-cyan-400" />
							Ultra Fast
						</h3>
						<p className="text-slate-400 leading-relaxed text-sm">
							By processing files on your local device, we eliminate upload and download bottleneck times. Experience instant results with our optimized client-side neural engines.
						</p>
					</div>
					<div className="space-y-4">
						<h3 className="text-xl font-bold text-white flex items-center gap-2">
							<Star className="w-5 h-5 text-yellow-400" />
							Smart Extraction
						</h3>
						<p className="text-slate-400 leading-relaxed text-sm">
							Extract Syllabus, FAQs, Glossaries, and more from your training documents with intelligent segmentation that understands structure and context.
						</p>
					</div>
				</div>

				{/* High Value Publisher Content - Addressing AdSense Policy */}
				<div className="mt-12 w-full max-w-6xl px-6 py-16 bg-white/5 rounded-[40px] border border-white/10" style={{animation: 'fadeIn 1s ease-out 0.7s forwards', opacity: 0}}>
					
					{/* AdSense Banner - Top of Landing Content */}
					<div className="mb-12 flex justify-center">
						<AdSenseAd 
							slot="9491607826" 
							format="horizontal"
							style={{ width: '100%', maxWidth: '970px' }}
						/>
					</div>

					<h2 className="text-3xl font-bold text-white mb-8 text-center bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
						Next-Generation Content Automation & Digital Workflows
					</h2>
					<div className="grid md:grid-cols-2 gap-12 text-slate-300">
						<div className="space-y-6">
							<p className="leading-relaxed">
								Professional content creation requires a robust set of tools to handle the complexities of modern digital media. 
								Our suite of applications is designed to bridge the gap between raw document data and production-ready web content.
								By leveraging advanced client-side processing, we enable teams to transform documentation into structured web assets 
								instantly. This includes automated extraction of glossaries, syllabi, and structured references.
							</p>
							<p className="leading-relaxed">
								Digital workflow optimization is no longer a luxury—it's a necessity for teams handling high volumes of training and technical material. 
								Our neural engines provide the speed and accuracy needed to maintain content consistency across all platforms.
								This technological shift allows developers to focus on the quality of education rather than the mechanics of formatting.
							</p>
						</div>
						<div className="space-y-6">
							<p className="leading-relaxed">
								From media compression that preserves visual integrity to AI-assisted content refinement, 
								Content Suite provides the technical infrastructure to ensure your digital output is optimized, accessible, and professional.
								We prioritize a local-first approach, meaning your data privacy is built into the architecture of our tools.
							</p>
							<p className="leading-relaxed">
								Our commitment to excellence extends into our research and development of automated safety compliance mappings. 
								As regulations evolve, our tools adapt to ensure your training materials remain at the forefront of industry standards, 
								protecting both your workers and your organizational compliance profile.
							</p>
						</div>
					</div>
					<div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
						<div className="p-4 rounded-2xl bg-white/5 border border-white/10">
							<div className="text-2xl font-bold text-green-400 mb-1">OCR</div>
							<div className="text-xs uppercase tracking-widest text-slate-500">Processing</div>
						</div>
						<div className="p-4 rounded-2xl bg-white/5 border border-border/10">
							<div className="text-2xl font-bold text-cyan-400 mb-1">HTML5</div>
							<div className="text-xs uppercase tracking-widest text-slate-500">Standards</div>
						</div>
						<div className="p-4 rounded-2xl bg-white/5 border border-white/10">
							<div className="text-2xl font-bold text-blue-400 mb-1">WebP</div>
							<div className="text-xs uppercase tracking-widest text-slate-500">Optimization</div>
						</div>
						<div className="p-4 rounded-2xl bg-white/5 border border-white/10">
							<div className="text-2xl font-bold text-emerald-400 mb-1">Private</div>
							<div className="text-xs uppercase tracking-widest text-slate-500">Processing</div>
						</div>
					</div>
				</div>

				{/* Footer Section */}
				<div className="mt-20 w-full" style={{animation: 'fadeIn 1s ease-out 0.9s forwards', opacity: 0}}>
					<Footer />
				</div>

			</div>

			{/* Decorative Elements */}
			<div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full blur-3xl animate-pulse" />
			<div className="absolute bottom-10 left-10 w-40 h-40 bg-gradient-to-tr from-cyan-500/10 to-transparent rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
		</div>
	);
}
