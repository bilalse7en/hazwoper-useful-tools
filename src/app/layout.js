import {Inter,Orbitron} from "next/font/google";
import Script from "next/script";
import {ThemeProvider} from "@/components/theme-provider";
import {BackgroundSpace} from "@/components/background-space";
import {GdprConsent} from "@/components/gdpr-consent";
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

export default function RootLayout({children}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
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
				
				{process.env.NODE_ENV === 'production' && (
					<>
						<Script
							src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9874465109252768"
							crossOrigin="anonymous"
							strategy="afterInteractive"
						/>
						<Script
							src="https://fundingchoicesmessages.google.com/i/pub-9874465109252768?ers=1"
							strategy="afterInteractive"
						/>
					</>
				)}
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem={true}
					themes={['light','dark','nebula']}
					storageKey="content-suite-theme"
				>
					<BackgroundSpace />
					{children}
					<GdprConsent />
				</ThemeProvider>
			</body>
		</html>
	);
}
