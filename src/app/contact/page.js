import { ContactPageClient } from '@/components/contact-page-client';

export const metadata = {
  title: 'Contact All Useful Tools | Support & Inquiries',
  description:
    'Contact the All Useful Tools technical team. Have questions about our tools, API integrations, or feedback? We look forward to helping you.',
  keywords:
    'contact All Useful Tools, tool support, web tools help, PDF editor support, media converter questions, business inquiries',
  alternates: {
    canonical: 'https://hazwoper-useful-tools.vercel.app/contact',
  },
};

export default function ContactPage() {
  return <ContactPageClient />;
}
