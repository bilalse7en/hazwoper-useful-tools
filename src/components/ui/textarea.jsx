import * as React from "react"

import {cn} from "@/lib/utils"

function Textarea({className,...props}) {
	return (
		<textarea
			data-slot="textarea"
			className={cn(
				"border-border placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20 flex field-sizing-content min-h-16 w-full rounded-lg border bg-transparent px-3 py-2 text-base shadow-sm transition-colors focus-visible:ring-[3px] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
				className
			)}
			{...props}
		/>
	)
}

export {Textarea}
