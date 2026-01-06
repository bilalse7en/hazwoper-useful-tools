"use client";

import {cn} from "@/lib/utils";
import {BRAND_CONFIG} from "@/lib/constants";

export function BrandLogo({className,size="md",animate=true}) {
	const sizeClasses={
		xs: "h-6 w-6",
		sm: "h-8 w-8",
		md: "h-9 w-9",
		lg: "h-16 w-16 lg:h-24 lg:w-24",
	};

	return (
		<div className={cn("relative shrink-0 overflow-hidden rounded-full",sizeClasses[size],className)}>
			<img
				src={BRAND_CONFIG.logo}
				alt="" // Keeping alt empty here to prevent text overlays if loading is slow
				loading="eager"
				className={cn(
					"h-full w-full object-cover",
					animate&&"logo-animate"
				)}
				style={{
					imageRendering: 'auto',
					WebkitBackfaceVisibility: 'hidden',
					transform: 'translate3d(0, 0, 0)', // More stable GPU trigger
					backfaceVisibility: 'hidden'
				}}
			/>
		</div>
	);
}
