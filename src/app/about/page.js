import { AboutPageClient } from '@/components/about-page-client';

export const metadata = {
  title: 'About Content Suite | Safety Automation Technology',
  description:
    'Learn about Content Suite, our mission to pioneer safety technology, and how we automate industrial safety (HAZWOPER/OSHA) documentation securely using neural engines.',
  keywords:
    'about Content Suite, safety technology, HAZWOPER automation, OSHA compliance, content automation, local-first safety tools',
  alternates: {
    canonical: 'https://hazwoper-useful-tools.vercel.app/about',
  },
};

export default function AboutPage() {
  return <AboutPageClient />;
}
