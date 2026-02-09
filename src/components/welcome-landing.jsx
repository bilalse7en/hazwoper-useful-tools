"use client";

import {useState,useEffect} from "react";
import {Trophy,LogIn,Sparkles,Zap,Flame,Shield,Rocket,Star,ChevronRight,Gift} from "lucide-react";

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

				{/* Footer Note */}
				<div className="mt-16 text-center" style={{animation: 'fadeIn 1s ease-out 0.4s forwards', opacity: 0}}>
					<p className="text-slate-500 text-sm font-medium">
						🎁 New users? Play the game to try premium features for free!
					</p>
				</div>

			</div>

			{/* Decorative Elements */}
			<div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full blur-3xl animate-pulse" />
			<div className="absolute bottom-10 left-10 w-40 h-40 bg-gradient-to-tr from-cyan-500/10 to-transparent rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
		</div>
	);
}
