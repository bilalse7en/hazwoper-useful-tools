"use client";

import {useEffect,useRef,useMemo} from "react";
import {useTheme} from "next-themes";

export function BackgroundSpace() {
	const canvasRef=useRef(null);
	const {theme}=useTheme();
	const mouse=useRef({x: -1000,y: -1000,vx: 0,vy: 0,lastX: 0,lastY: 0});
	const time=useRef(0);
	const isVisible=useRef(true);

	useEffect(() => {
		const canvas=canvasRef.current;
		if(!canvas) return;
		
		const observer = new IntersectionObserver(
			([entry]) => {
				isVisible.current = entry.isIntersecting;
			},
			{ threshold: 0.1 }
		);
		observer.observe(canvas);

		const ctx=canvas.getContext("2d", { alpha: false }); // Optimization: no alpha channel if opaque
		let animationFrameId;

		let stars=[];
		const count=window.innerWidth < 768 ? 50 : 120; // Further reduced for 100% performance

		const initStars=() => {
			canvas.width=window.innerWidth;
			canvas.height=window.innerHeight;
			stars=Array.from({length: count},() => {
				const x=Math.random()*canvas.width;
				const y=Math.random()*canvas.height;
				return {
					x,
					y,
					baseX: x,
					baseY: y,
					size: Math.random()*1.5+0.5,
					speed: Math.random()*0.2+0.05,
					opacity: Math.random()*0.5+0.5,
					twinkleSpeed: Math.random()*0.015+0.005,
					glow: Math.random()>0.95,
					vx: 0,
					vy: 0,
					angle: Math.random()*Math.PI*2
				};
			});
		};

		const handleMouseMove=(e) => {
			const x=e.clientX;
			const y=e.clientY;
			mouse.current.vx=x-mouse.current.lastX;
			mouse.current.vy=y-mouse.current.lastY;
			mouse.current.x=x;
			mouse.current.y=y;
			mouse.current.lastX=x;
			mouse.current.lastY=y;
		};

		const handleMouseDown=(e) => {
			const x=e.clientX;
			const y=e.clientY;
			const blastRadius=Math.max(canvas.width,canvas.height)*0.35;

			stars.forEach(star => {
				const dx=star.x-x;
				const dy=star.y-y;
				const distSq=dx*dx+dy*dy;

				if(distSq < blastRadius * blastRadius) {
					const dist = Math.sqrt(distSq);
					const force=(blastRadius-dist)/blastRadius;
					const strength=30.0;
					star.vx+=(dx/dist)*force*force*strength;
					star.vy+=(dy/dist)*force*force*strength;
					star.opacity=1;
				}
			});
		};

		const draw=() => {
			if (!isVisible.current || !canvas || !ctx) {
				animationFrameId=requestAnimationFrame(draw);
				return;
			}

			// Use background color based on theme for clearer clearing
			const colorMap={
				nebula: "#020617",
				dark: "#020617",
				light: "#ffffff"
			};
			const bgColor = colorMap[theme] || "#020617";
			const starColor=theme === 'light' ? "#000000" : "#ffffff";

			ctx.fillStyle = bgColor;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			
			time.current+=0.01;
			mouse.current.vx*=0.95;
			mouse.current.vy*=0.95;

			stars.forEach(star => {
				star.x-=star.speed;
				const waveOffset=Math.sin(time.current+star.angle)*0.12;
				star.y+=waveOffset;

				const dx=star.x-mouse.current.x;
				const dy=star.y-mouse.current.y;
				const distSq=dx*dx+dy*dy;
				const influenceRadius=80;

				if(distSq < influenceRadius * influenceRadius) {
					const dist = Math.sqrt(distSq);
					const force=(influenceRadius-dist)/influenceRadius;
					const strength=4.0;
					star.vx+=(dx/dist)*force*strength;
					star.vy+=(dy/dist)*force*strength;
					star.vx+=mouse.current.vx*force*0.06;
					star.vy+=mouse.current.vy*force*0.06;
					star.opacity=Math.min(1,star.opacity+0.05);
				}

				star.x+=star.vx;
				star.y+=star.vy;
				star.vx*=0.88;
				star.vy*=0.88;

				if(star.x<-50) star.x=canvas.width+50;
				if(star.x>canvas.width+50) star.x=-50;
				if(star.y<-50) star.y=canvas.height+50;
				if(star.y>canvas.height+50) star.y=-50;

				ctx.beginPath();
				ctx.arc(star.x,star.y,star.size,0,Math.PI*2);
				ctx.save();
				ctx.globalAlpha=Math.max(0.1,star.opacity);
				ctx.fillStyle=theme === 'nebula' ? "#3b82f6" : starColor;

				if(star.glow && theme !== 'light') {
					ctx.shadowBlur=8;
					ctx.shadowColor=theme === 'nebula' ? "#3b82f6" : "#ffffff";
				}

				ctx.fill();
				ctx.restore();
			});

			animationFrameId=requestAnimationFrame(draw);
		};

		window.addEventListener("resize",initStars);
		window.addEventListener("mousemove",handleMouseMove);
		window.addEventListener("mousedown",handleMouseDown);
		initStars();
		draw();

		return () => {
			observer.disconnect();
			window.removeEventListener("resize",initStars);
			window.removeEventListener("mousemove",handleMouseMove);
			window.removeEventListener("mousedown",handleMouseDown);
			cancelAnimationFrame(animationFrameId);
		};
	},[theme]);

	return (
		<canvas
			ref={canvasRef}
			className="fixed inset-0 z-[-1] pointer-events-none"
			style={{ background: 'transparent' }}
		/>
	);
}
