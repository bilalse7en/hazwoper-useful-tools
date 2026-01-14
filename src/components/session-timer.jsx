"use client";

import {useEffect,useState,useRef} from "react";
import {motion,AnimatePresence} from "framer-motion";
import {Clock,AlertTriangle,XCircle,ChevronRight} from "lucide-react";

export function SessionTimer({onExpire}) {
	const [timeRemaining,setTimeRemaining]=useState(null);
	const [isExpanded,setIsExpanded]=useState(false);
	const [notifiedAt,setNotifiedAt]=useState(new Set());
	const [countdown,setCountdown]=useState(null);
	const hasShownInitial=useRef(false);

	useEffect(() => {
		const checkTime=() => {
			const rewardTime=localStorage.getItem('reward_claim_time');
			if(!rewardTime) {
				setTimeRemaining(null);
				return;
			}

			const TWO_HOURS=2*60*60*1000;
			const elapsed=Date.now()-parseInt(rewardTime);
			const remaining=TWO_HOURS-elapsed;

			if(remaining<=0) {
				if(!notifiedAt.has('expired')) {
					setNotifiedAt(prev => new Set(prev).add('expired'));
					setTimeout(() => {
						localStorage.removeItem('reward_claim_time');
						sessionStorage.removeItem('user');
						sessionStorage.removeItem('reward_attempted');
						sessionStorage.removeItem('pending_user');
						localStorage.setItem('game_cooldown',Date.now().toString());
						onExpire?.();
					},1000);
				}
				setTimeRemaining(0);
				setCountdown(0);
				return;
			}

			setTimeRemaining(remaining);

			const secondsRemaining=Math.floor(remaining/1000);
			if(secondsRemaining<=10&&secondsRemaining>0) {
				setCountdown(secondsRemaining);
				setIsExpanded(true);
			} else {
				setCountdown(null);
			}

			if(!hasShownInitial.current) {
				hasShownInitial.current=true;
				setIsExpanded(true);
				setTimeout(() => {
					if(secondsRemaining>10) {
						setIsExpanded(false);
					}
				},5000);
			}

			const intervals=[
				{key: '90min',threshold: 90*60*1000},
				{key: '60min',threshold: 60*60*1000},
				{key: '30min',threshold: 30*60*1000}
			];

			for(const interval of intervals) {
				const lowerBound=interval.threshold-2000;
				const upperBound=interval.threshold+2000;

				if(remaining>=lowerBound&&remaining<=upperBound&&!notifiedAt.has(interval.key)) {
					setNotifiedAt(prev => new Set(prev).add(interval.key));
					setIsExpanded(true);
					setTimeout(() => {
						if(secondsRemaining>10) {
							setIsExpanded(false);
						}
					},5000);
					break;
				}
			}
		};

		checkTime();
		const interval=setInterval(checkTime,1000);
		return () => clearInterval(interval);
	},[notifiedAt,onExpire]);

	const formatTime=(ms) => {
		if(ms<=0) return "0m";
		const totalMinutes=Math.floor(ms/1000/60);
		const hours=Math.floor(totalMinutes/60);
		const minutes=totalMinutes%60;
		if(hours>0) {
			return `${hours}h ${minutes}m`;
		} else {
			return `${minutes}m`;
		}
	};

	const getTimerColor=() => {
		if(!timeRemaining||timeRemaining<=0) return "from-red-600 to-red-700";
		if(timeRemaining<5*60*1000) return "from-red-500 to-orange-600";
		if(timeRemaining<30*60*1000) return "from-orange-500 to-yellow-600";
		if(timeRemaining<60*60*1000) return "from-yellow-500 to-green-600";
		return "from-green-500 to-emerald-600";
	};

	const getTimerIcon=() => {
		if(!timeRemaining||timeRemaining<=0) return XCircle;
		if(timeRemaining<5*60*1000) return AlertTriangle;
		return Clock;
	};

	if(timeRemaining===null) return null;

	const TimerIcon=getTimerIcon();
	const shouldBlink=countdown!==null&&countdown<=10;

	return (
		<motion.div
			className="fixed bottom-6 right-6 z-[100]"
			initial={{opacity: 0,y: 50}}
			animate={{opacity: 1,y: 0}}
			transition={{delay: 0.5}}
		>
			<AnimatePresence mode="wait">
				{!isExpanded? (
					/* CLOSED: Icon only */
					<motion.button
						key="collapsed"
						onClick={() => setIsExpanded(true)}
						className={`p-3 rounded-full bg-gradient-to-br ${getTimerColor()} shadow-xl`}
						initial={{scale: 0}}
						animate={{scale: 1}}
						exit={{scale: 0}}
						whileHover={{scale: 1.1}}
						whileTap={{scale: 0.9}}
					>
						<TimerIcon className="w-5 h-5 text-white" />
					</motion.button>
				):(
					/* OPEN: Timer + Chevron only */
					<motion.div
						key="expanded"
						className="glass-panel px-4 py-2 rounded-full border-2 shadow-xl backdrop-blur-md flex items-center gap-2"
						style={{borderColor: 'var(--primary)'}}
						initial={{scale: 0,opacity: 0}}
						animate={{
							scale: shouldBlink? [1,1.1,1]:[1],
							opacity: shouldBlink? [1,0.6,1]:[1]
						}}
						exit={{scale: 0,opacity: 0}}
						transition={shouldBlink? {
							duration: 0.5,
							repeat: Infinity
						}:{}}
					>
						<span className={`text-lg font-black tabular-nums ${countdown!==null? `bg-gradient-to-br ${getTimerColor()} bg-clip-text text-transparent`:'text-foreground'}`}>
							{countdown!==null? countdown:formatTime(timeRemaining)}
						</span>
						{countdown===null&&(
							<button
								onClick={() => setIsExpanded(false)}
								className="p-0.5 hover:bg-foreground/10 rounded transition-colors"
							>
								<ChevronRight className="w-4 h-4 text-foreground/60" />
							</button>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}
