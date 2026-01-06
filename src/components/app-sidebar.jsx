"use client";

import {cn} from "@/lib/utils";
import {
	GraduationCap,
	BookOpen,
	FileSpreadsheet,
	PenTool,
	Code,
	ImageIcon,
	Video,
	ChevronLeft,
	ChevronRight,
	Palette,
	LogOut,
	Search,
	Zap,
	Wrench,
	BrainCircuit
} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Tooltip,TooltipContent,TooltipProvider,TooltipTrigger} from "@/components/ui/tooltip";
import {Separator} from "@/components/ui/separator";
import {Input} from "@/components/ui/input";
import {hasAccess} from "@/lib/auth";
import {useState} from "react";
import {BrandLogo} from "./brand-logo";

const navGroups=[
	{
		id: "generators",
		label: "Generators",
		icon: Zap,
		items: [
			{id: "course",label: "Web Content",icon: GraduationCap},
			{id: "blog",label: "Blog",icon: PenTool},
			{id: "glossary",label: "Glossary",icon: BookOpen},
			{id: "resources",label: "Resources",icon: FileSpreadsheet},
		]
	},
	{
		id: "tools",
		label: "Tools",
		icon: Wrench,
		items: [
			{id: "html-cleaner",label: "HTML Cleaner",icon: Code},
			{id: "image-converter",label: "Image Converter",icon: ImageIcon},
			{id: "video-compressor",label: "Video Compressor",icon: Video},
			{id: "ai-assistant",label: "AI UNIVERSE",icon: BrainCircuit},
		]
	}
];

export function AppSidebar({
	activeTab,
	onTabChange,
	collapsed,
	onToggleCollapse,
	onThemeToggle,
	user,
	onLogout,
	className
}) {
	const [searchQuery,setSearchQuery]=useState("");
	const [expandedGroups,setExpandedGroups]=useState(["generators","tools"]);

	const toggleGroup=(groupId) => {
		setExpandedGroups(prev =>
			prev.includes(groupId)
				? prev.filter(id => id!==groupId)
				:[...prev,groupId]
		);
	};

	const filteredGroups=navGroups.map(group => ({
		...group,
		items: group.items.filter(item =>
			hasAccess(user?.role,item.id)&&
			item.label.toLowerCase().includes(searchQuery.toLowerCase())
		)
	})).filter(group => group.items.length>0);

	return (
		<TooltipProvider delayDuration={0}>
			<aside
				className={cn(
					"h-full border-r border-border backdrop-blur-xl transition-all duration-300 sidebar-wrapper flex flex-col select-none",
					!className?.includes("w-")&&(collapsed? "w-16":"w-64"),
					className
				)}
				style={{backgroundColor: 'var(--sidebar)'}}
			>
				{/* Header */}
				<div className={cn(
					"flex h-14 items-center gap-3 border-b border-border p-4",
					collapsed&&"justify-center flex-col"
				)}>
					<BrandLogo
						size="md"
						className="hover:scale-110 hover:rotate-6 transition-transform duration-300 cursor-pointer"
					/>
					{!collapsed&&(
						<div className="flex flex-col overflow-hidden flex-1">
							<span className="font-bold text-foreground whitespace-nowrap tracking-tight">Content Suite</span>
							{user&&<span className="text-[10px] text-muted-foreground truncate uppercase tracking-wider">{user.name}</span>}
						</div>
					)}
				</div>

				{/* Search Bar */}
				{!collapsed&&(
					<div className="p-3 border-b border-border">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								type="text"
								placeholder="Search..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9 h-9 bg-background/50 border-border focus-visible:ring-1"
							/>
						</div>
					</div>
				)}

				{/* Navigation Groups */}
				<nav className="flex-1 overflow-y-auto p-2 space-y-1">
					{filteredGroups.map((group) => {
						const isExpanded=expandedGroups.includes(group.id);

						return (
							<div key={group.id} className="space-y-1">
								{/* Group Header */}
								{!collapsed? (
									<button
										onClick={() => toggleGroup(group.id)}
										className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-semibold text-muted-foreground hover:text-foreground uppercase tracking-[0.1em] transition-colors group"
									>
										<span className="flex-1 text-left">{group.label}</span>
										<ChevronRight className={cn("h-3 w-3 transition-transform duration-300",isExpanded&&"rotate-90")} />
									</button>
								):(
									<div className="h-4" />
								)}

								{/* Group Items */}
								{(isExpanded||collapsed||searchQuery)&&group.items.map((item) => {
									const Icon=item.icon;
									const isActive=activeTab===item.id;

									const button=(
										<Button
											key={item.id}
											variant="ghost"
											className={cn(
												"w-full justify-start gap-3 transition-all duration-200 relative overflow-hidden group cursor-pointer",
												collapsed&&"justify-center px-2",
												isActive&&"bg-primary/10 text-primary font-semibold shadow-sm",
												!isActive&&"hover:bg-accent/50 hover:translate-x-1"
											)}
											onClick={() => onTabChange(item.id)}
										>
											{isActive&&<div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"></div>}
											<Icon className={cn(
												"h-5 w-5 shrink-0 transition-all duration-200",
												isActive&&"scale-110",
												!isActive&&"group-hover:scale-110"
											)} />
											{!collapsed&&(
												<span className="truncate">{item.label}</span>
											)}
											{isActive&&!collapsed&&(
												<div className="ml-auto h-2 w-2 rounded-full bg-primary animate-pulse"></div>
											)}
										</Button>
									);

									if(collapsed) {
										return (
											<Tooltip key={item.id}>
												<TooltipTrigger asChild>
													{button}
												</TooltipTrigger>
												<TooltipContent side="right" className="font-medium">
													{item.label}
												</TooltipContent>
											</Tooltip>
										);
									}

									return button;
								})}
							</div>
						);
					})}
				</nav>

				{/* Footer */}
				<div className="border-t border-border p-2 space-y-1">
					{/* Theme Toggle */}
					{collapsed? (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="w-full"
									onClick={onThemeToggle}
								>
									<Palette className="h-5 w-5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="right">Change Theme</TooltipContent>
						</Tooltip>
					):(
						<Button
							variant="ghost"
							className="w-full justify-start gap-3"
							onClick={onThemeToggle}
						>
							<Palette className="h-5 w-5" />
							<span>Change Theme</span>
						</Button>
					)}

					{/* Logout Button */}
					{collapsed? (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="w-full text-destructive/80 hover:text-destructive hover:bg-destructive/10"
									onClick={onLogout}
								>
									<LogOut className="h-5 w-5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="right">Logout</TooltipContent>
						</Tooltip>
					):(
						<Button
							variant="ghost"
							className="w-full justify-start gap-3 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
							onClick={onLogout}
						>
							<LogOut className="h-5 w-5" />
							<span>Logout</span>
						</Button>
					)}

					<Separator className="my-2 bg-border/50" />

					{/* Collapse Toggle */}
					<Button
						variant="ghost"
						size={collapsed? "icon":"default"}
						className={cn(
							"w-full transition-all",
							collapsed? "":"justify-start gap-3"
						)}
						onClick={onToggleCollapse}
					>
						{collapsed?
							<ChevronRight className="h-5 w-5" />:
							<>
								<ChevronLeft className="h-5 w-5" />
								<span>Collapse</span>
							</>
						}
					</Button>
				</div>
			</aside>
		</TooltipProvider>
	);
}
