"use client";

import {Button} from "@/components/ui/button";
import {Sheet,SheetContent,SheetTrigger} from "@/components/ui/sheet";
import {Menu,Moon,Sun} from "lucide-react";
import {useTheme} from "next-themes";
import {AppSidebar} from "./app-sidebar";
import {BrandLogo} from "./brand-logo";

export function MobileHeader({activeTab,onTabChange,onThemeToggle,user,onLogout}) {
	const {theme,setTheme}=useTheme();

	return (
		<header
			className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-white/10 backdrop-blur-xl px-4 lg:hidden"
			style={{backgroundColor: 'var(--sidebar)'}}
		>
			{/* Mobile Menu */}
			<Sheet>
				<SheetTrigger asChild>
					<Button variant="ghost" size="icon" className="mobile-menu-btn">
						<Menu className="h-5 w-5" />
						<span className="sr-only">Toggle menu</span>
					</Button>
				</SheetTrigger>
				<SheetContent side="left" className="max-w-[320px] p-0 border-r-border">
					<AppSidebar
						activeTab={activeTab}
						onTabChange={onTabChange}
						collapsed={false}
						onToggleCollapse={() => {}}
						onThemeToggle={onThemeToggle}
						user={user}
						onLogout={onLogout}
						className="border-none w-full"
					/>
				</SheetContent>
			</Sheet>

			{/* Brand - Centered */}
			<div className="flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2 pointer-events-none">
				<BrandLogo size="md" className="shadow-sm" />
				<span className="font-bold text-sm tracking-tight text-foreground whitespace-nowrap">Content Suite</span>
			</div>

			{/* Theme Toggle */}
			<div className="flex items-center gap-1">
				<Button
					variant="ghost"
					size="icon"
					className="btn-theme-toggle-mobile"
					onClick={() => setTheme(theme==='dark'? 'light':'dark')}
				>
					<Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
					<Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
					<span className="sr-only">Toggle theme</span>
				</Button>
			</div>
		</header>
	);
}
