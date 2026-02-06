import {Inter,JetBrains_Mono,Orbitron,Space_Grotesk,Exo_2,Chakra_Petch,Rajdhani} from "next/font/google";
import Script from "next/script";
import {ThemeProvider} from "@/components/theme-provider";
import {BackgroundSpace} from "@/components/background-space";
import {GdprConsent} from "@/components/gdpr-consent";
import "./globals.css";

const inter=Inter({
	variable: "--font-inter",
	subsets: ["latin"],
});

const jetbrainsMono=JetBrains_Mono({
	variable: "--font-mono",
	subsets: ["latin"],
});

const orbitron=Orbitron({
	variable: "--font-orbitron",
	subsets: ["latin"],
});

const spaceGrotesk=Space_Grotesk({
	variable: "--font-space-grotesk",
	subsets: ["latin"],
});

const exo2=Exo_2({
	variable: "--font-exo",
	subsets: ["latin"],
});

const chakraPetch=Chakra_Petch({
	weight: ['300','400','500','600','700'],
	variable: "--font-chakra",
	subsets: ["latin"],
});

const rajdhani=Rajdhani({
	weight: ['300','400','500','600','700'],
	variable: "--font-rajdhani",
	subsets: ["latin"],
});

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
			<body
				className={`${inter.variable} ${jetbrainsMono.variable} ${orbitron.variable} ${spaceGrotesk.variable} ${exo2.variable} ${chakraPetch.variable} ${rajdhani.variable} font-sans antialiased`}
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
							strategy="lazyOnload"
						/>
						<Script
							src="https://fundingchoicesmessages.google.com/i/pub-9874465109252768?ers=1"
							strategy="lazyOnload"
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
