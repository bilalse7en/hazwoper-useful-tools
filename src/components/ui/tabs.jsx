"use client"

import * as React from "react"

import {cn} from "@/lib/utils"

function Tabs({className,...props}) {
	return (
		<div
			data-slot="tabs"
			className={cn("flex flex-col gap-2",className)}
			{...props}
		/>
	)
}

function TabsList({className,...props}) {
	return (
		<div
			data-slot="tabs-list"
			className={cn(
				"bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-1",
				className
			)}
			{...props}
		/>
	)
}

function TabsTrigger({className,active,onClick,...props}) {
	return (
		<button
			data-slot="tabs-trigger"
			onClick={onClick}
			className={cn(
				"inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
				active? "bg-background text-foreground shadow-sm":"hover:text-foreground",
				className
			)}
			{...props}
		/>
	)
}

function TabsContent({className,active,...props}) {
	if(!active) return null
	return (
		<div
			data-slot="tabs-content"
			className={cn("mt-2",className)}
			{...props}
		/>
	)
}

export {Tabs,TabsList,TabsTrigger,TabsContent}
