import * as React from "react"

import {cn} from "@/lib/utils"

function Input({className,type,...props}) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				"border-border file:text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20 flex h-10 w-full min-w-0 rounded-lg border bg-transparent px-3 py-2 text-base shadow-sm transition-colors file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-[3px] focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
				className
			)}
			{...props}
		/>
	)
}

export {Input}
