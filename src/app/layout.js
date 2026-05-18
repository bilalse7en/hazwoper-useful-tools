import {Inter,Orbitron} from "next/font/google";
import Script from "next/script";
import {ThemeProvider} from "@/components/theme-provider";
import {BackgroundSpace} from "@/components/background-space";
import {GdprConsent} from "@/components/gdpr-consent";
import {DelayedScriptLoader} from "@/components/delayed-script-loader";
import {Toaster} from "sonner";
import "./globals.css";

const inter=Inter({
	variable: "--font-inter",
	subsets: ["latin"],
	display: 'swap',
	preload: true,
});

const orbitron=Orbitron({
	variable: "--font-orbitron",
	subsets: ["latin"],
	display: 'swap',
	preload: true,
});

export const viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 5,
	themeColor: [
		{ media: '(prefers-color-scheme: light)', color: '#ffffff' },
		{ media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
	],
};

export const metadata={
	title: "Course Content Generator | Content Suite",
	description: "Extract Overview, Syllabus, FAQs, Glossary, Resources and Blog Content from your documents. Professional web content generation tool.",
	keywords: "course generator, content generator, DOCX to HTML, blog generator, glossary generator",
	authors: [{name: "Content Suite"}],
	icons: {
		icon: "https://media.hazwoper-osha.com/wp-content/uploads/2025/12/1765460885/Hi.gif",
	},
	other: {
		"google-adsense-account": "ca-pub-9874465109252768"
	}
};

import { GlobalHeader } from "@/components/global-header";
import { Footer } from "@/components/footer";


export default function RootLayout({children}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<meta name="google-adsense-account" content="ca-pub-9874465109252768"/>
				<Script
					async
					src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9874465109252768"
					crossOrigin="anonymous"
					strategy="afterInteractive"
				/>
				<link rel="preconnect" href="https://media.hazwoper-osha.com" crossOrigin="anonymous" />
				<link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
				<link rel="preconnect" href="https://pagead2.googlesyndication.com" crossOrigin="anonymous" />
				<link rel="dns-prefetch" href="https://media.hazwoper-osha.com" />
				<link rel="dns-prefetch" href="https://fonts.googleapis.com" />
				<link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
			</head>
			<body
				className={`${inter.variable} ${orbitron.variable} font-sans antialiased`}
				suppressHydrationWarning
			>
				<Script
					id="google-consent"
					strategy="afterInteractive"
					dangerouslySetInnerHTML={{
						__html: `
							window.dataLayer = window.dataLayer || [];
							function gtag(){dataLayer.push(arguments);}
							
							// Default consent mode - denies all until user makes a choice
							gtag('consent', 'default', {
								'ad_storage': 'denied',
								'ad_user_data': 'denied',
								'ad_personalization': 'denied',
								'analytics_storage': 'denied',
								'wait_for_update': 500
							});
						`,
					}}
				/>
				
				{process.env.NODE_ENV === 'production' && <DelayedScriptLoader />}
				
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem={true}
					themes={['light','dark','nebula']}
					storageKey="content-suite-theme"
				>
					<BackgroundSpace />
					<div className="flex flex-col min-h-screen relative">
						<GlobalHeader />
						<main className="flex-1">
							{children}
						</main>
						<Footer />
					</div>
					<GdprConsent />
					<Toaster position="top-right" toastOptions={{
						className: 'glass-toast !rounded-2xl !border-border !bg-card/90 !backdrop-blur-2xl !text-foreground !shadow-[0_20px_50px_rgba(0,0,0,0.3)] !p-4 !font-orbitron font-bold',
					}} />

				</ThemeProvider>
			</body>
		</html>
	);
}
